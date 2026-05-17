'use client';

// Single shared native WebSocket connection to the DJI Cloud backend.
//
// The DJI server uses plain WebSocket (RFC 6455), NOT socket.io.
// socket.io appends ?EIO=4&transport=websocket which the DJI server rejects.
//
// Connection: ws://<host>/api/v1/ws?x-auth-token=<jwt>
// Messages:   JSON { biz_code: string; data: object }

import { useEffect, useRef, useState, useCallback } from 'react';
import { DJI_CONFIG } from '@/lib/config/config';
import { getToken } from '@/lib/config/token-store';

// ─── Event types from DJI docs ────────────────────────────────────────────────

export type BizCode = 'device_online_update' | 'hms_event' | 'task_progress' | 'flight_area_sync';

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

interface DJIMessage {
  biz_code: BizCode;
  data: unknown;
}

type EventHandler<T> = (data: T) => void;

interface EventHandlerMap {
  device_online_update: EventHandler<DeviceOnlineUpdateData>[];
  hms_event: EventHandler<HMSEventData>[];
  task_progress: EventHandler<TaskProgressData>[];
  flight_area_sync: EventHandler<FlightAreaSyncData>[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDJIWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<EventHandlerMap>({
    device_online_update: [],
    hms_event: [],
    task_progress: [],
    flight_area_sync: [],
  });
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [deviceStates, setDeviceStates] = useState<Map<string, DeviceOnlineUpdateData>>(new Map());

  // Subscribe to a specific biz_code event; returns an unsubscribe function
  const on = useCallback(
    <T extends BizCode>(
      bizCode: T,
      handler: EventHandler<
        T extends 'device_online_update'
          ? DeviceOnlineUpdateData
          : T extends 'hms_event'
            ? HMSEventData
            : T extends 'task_progress'
              ? TaskProgressData
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
        console.log('[DJI WS] Connected');
        setIsConnected(true);
      };

      ws.onclose = (e) => {
        if (cancelled) return;
        console.log('[DJI WS] Disconnected — code:', e.code);
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
        try {
          const msg = JSON.parse(event.data as string) as DJIMessage;
          const { biz_code, data } = msg;

          // Dispatch to registered handlers
          if (biz_code in handlersRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (handlersRef.current[biz_code] as any[]).forEach((h) => h(data));
          }

          // Built-in: maintain device state map for device_online_update
          if (biz_code === 'device_online_update') {
            const update = data as DeviceOnlineUpdateData;
            setDeviceStates((prev) => {
              const next = new Map(prev);
              next.set(update.sn, update);
              return next;
            });
          }
        } catch (err) {
          console.error('[DJI WS] Failed to parse message:', err);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close(1000, 'component unmounted');
    };
  }, []);

  return { isConnected, deviceStates, on };
}
