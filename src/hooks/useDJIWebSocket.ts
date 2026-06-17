'use client';

// Single native WebSocket connection per hook instance to the DJI Cloud backend.
//
// The DJI server uses plain WebSocket (RFC 6455), NOT socket.io.
// socket.io appends ?EIO=4&transport=websocket which the DJI server rejects.
//
// Connection: ws://<host>/api/v1/ws?x-auth-token=<jwt>
// Messages:   JSON { biz_code: string; data: object }

import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import { DJI_CONFIG } from '@/lib/config/config';
import { getToken } from '@/lib/config/token-store';

// ─── Event types from DJI docs ────────────────────────────────────────────────

export type BizCode =
  | 'device_online_update'
  | 'device_osd'
  | 'hms_event'
  | 'task_progress'
  | 'flight_area_sync'
  | 'device_upgrade_progress';

export interface DeviceOnlineUpdateData {
  sn: string;
  online_status: boolean;
  battery_percent: number;
  mode_code: number; // 0 = standby/docked, 1 = in-flight
  // GPS fields — present when the device has a fix
  latitude?: number;
  longitude?: number;
  altitude?: number;
  horizontal_speed?: number;
  heading?: number;
}

// High-frequency telemetry delivered by the DJI backend for every online drone.
// Fields are strings in some firmware versions — always parse with Number().
export interface DeviceOSDData {
  sn: string;
  host: {
    longitude: number;
    latitude: number;
    height: string | number; // AGL height in metres
    elevation?: string | number; // ASL elevation in metres
    horizontal_speed: string | number;
    vertical_speed?: string | number;
    wind_speed?: string | number;
    wind_direction?: string | number;
    gear?: number;
    mode_code: number;
    attitude_head?: number; // heading 0-360° clockwise from north
    attitude_pitch?: number;
    attitude_roll?: number;
    position_state?: {
      gps_number: number;
      is_fixed: number; // 1 = GPS fix acquired, 0 = no fix
      rtk_number?: number;
    };
    battery?: {
      capacity_percent: number;
      landing_power?: number;
      remain_flight_time?: number;
      return_home_power?: number;
    };
  };
}

export interface HMSEventData {
  sn: string;
  hms_id: string;
  level: number; // 0=info, 1=warn, 2=error
  message_en: string;
}

export interface TaskProgressData {
  job_id: string;
  status: string;
  progress: number;
  waypoint_index?: number;
  estimated_time?: number;
}

export interface FlightAreaSyncData {
  sync_id: string;
  status: string;
  result?: string;
}

// step_key: 'downloading' | 'upgrading' | 'success' | 'failure'
export interface DeviceUpgradeProgressData {
  sn: string;
  host: {
    progress: { percent: number; step_key: string };
    status: number; // 1=downloading, 2=upgrading, 3=success, 4=failure
  };
}

interface DJIMessage {
  biz_code: string;
  data: unknown;
}

type EventHandler<T> = (data: T) => void;

interface EventHandlerMap {
  device_online_update: EventHandler<DeviceOnlineUpdateData>[];
  device_osd: EventHandler<DeviceOSDData>[];
  hms_event: EventHandler<HMSEventData>[];
  task_progress: EventHandler<TaskProgressData>[];
  flight_area_sync: EventHandler<FlightAreaSyncData>[];
  device_upgrade_progress: EventHandler<DeviceUpgradeProgressData>[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDJIWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef<EventHandlerMap>({
    device_online_update: [],
    device_osd: [],
    hms_event: [],
    task_progress: [],
    flight_area_sync: [],
    device_upgrade_progress: [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const [deviceStates, setDeviceStates] = useState<Map<string, DeviceOnlineUpdateData>>(new Map());
  const [osdStates, setOsdStates] = useState<Map<string, DeviceOSDData>>(new Map());
  const [upgradeStates, setUpgradeStates] = useState<Map<string, DeviceUpgradeProgressData>>(
    new Map()
  );

  const on = useCallback(
    <T extends BizCode>(
      bizCode: T,
      handler: EventHandler<
        T extends 'device_online_update'
          ? DeviceOnlineUpdateData
          : T extends 'device_osd'
            ? DeviceOSDData
            : T extends 'hms_event'
              ? HMSEventData
              : T extends 'task_progress'
                ? TaskProgressData
                : T extends 'device_upgrade_progress'
                  ? DeviceUpgradeProgressData
                  : FlightAreaSyncData
      >
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (handlersRef.current[bizCode] as any[]).push(handler);
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr = handlersRef.current[bizCode] as any[];
        const idx = arr.indexOf(handler);
        if (idx !== -1) arr.splice(idx, 1);
      };
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const token = getToken();
      if (!token || cancelled) return;

      const base = DJI_CONFIG.BASE_URL.replace(/^http/, 'ws');
      const url = `${base}/api/v1/ws?x-auth-token=${token}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          ws.close();
          return;
        }
        setIsConnected(true);
      };

      ws.onclose = (e) => {
        if (cancelled) return;
        setIsConnected(false);
        // Reconnect after 3 seconds unless deliberately closed
        if (e.code !== 1000) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        console.error('[DJI WS] Connection error');
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data as string) as DJIMessage;
          const { biz_code, data } = msg;

          // Diagnostic: log every incoming message with biz_code and mode_code when present
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sn = (data as any)?.sn ?? '?';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const modeCode = (data as any)?.host?.mode_code ?? (data as any)?.mode_code;
          if (modeCode !== undefined) {
            console.log(`[ws] ${biz_code} sn=${sn} mode_code=${modeCode}`, data);
          } else {
            console.log(`[ws] ${biz_code} sn=${sn}`, data);
          }

          // Dispatch to registered handlers
          if (biz_code in handlersRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (handlersRef.current[biz_code as BizCode] as any[]).forEach((h) => h(data));
          }

          // Wrap all state updates in startTransition so navigation takes priority
          // over incoming telemetry re-renders.
          startTransition(() => {
            // Built-in: maintain device state map for device_online_update
            if (biz_code === 'device_online_update') {
              const update = data as DeviceOnlineUpdateData;
              setDeviceStates((prev) => {
                const next = new Map(prev);
                next.set(update.sn, update);
                return next;
              });
            }

            // Built-in: maintain OSD map — primary source of GPS + telemetry
            if (biz_code === 'device_osd') {
              const osd = data as DeviceOSDData;
              setOsdStates((prev) => {
                const next = new Map(prev);
                next.set(osd.sn, osd);
                return next;
              });
            }

            // Built-in: track OTA progress per device; remove entry once done/failed
            if (biz_code === 'device_upgrade_progress') {
              const upgrade = data as DeviceUpgradeProgressData;
              setUpgradeStates((prev) => {
                const next = new Map(prev);
                const done = upgrade.host.status === 3 || upgrade.host.status === 4;
                if (done) {
                  next.delete(upgrade.sn);
                } else {
                  next.set(upgrade.sn, upgrade);
                }
                return next;
              });
            }
          });
        } catch {
          // ignore malformed messages
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        // Only close an already-open socket. Closing a CONNECTING socket fires a
        // browser error ("WebSocket is closed before the connection is established")
        // which is noisy in dev/Strict Mode. The cancelled flag above will make the
        // onopen handler close it once the handshake completes.
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'component unmounted');
        }
        wsRef.current = null;
      }
    };
  }, []);

  return { isConnected, deviceStates, osdStates, upgradeStates, on };
}
