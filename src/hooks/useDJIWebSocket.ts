'use client';

// Single shared native WebSocket connection to the DJI Cloud backend.
//
// The DJI server uses plain WebSocket (RFC 6455), NOT socket.io.
// socket.io appends ?EIO=4&transport=websocket which the DJI server rejects.
//
// Connection: ws://<host>/api/v1/ws?x-auth-token=<jwt>
// Messages:   JSON { biz_code: string; data: object }

import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import { create } from 'zustand';
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
    height: string | number;         // AGL height in metres
    elevation?: string | number;     // ASL elevation in metres
    horizontal_speed: string | number;
    vertical_speed?: string | number;
    wind_speed?: string | number;
    wind_direction?: string | number;
    gear?: number;
    mode_code: number;
    attitude_head?: number;          // heading 0-360° clockwise from north
    attitude_pitch?: number;
    attitude_roll?: number;
    position_state?: {
      gps_number: number;
      is_fixed: number;              // 1 = GPS fix acquired, 0 = no fix
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

// ─── Shared Zustand Store ──────────────────────────────────────────────────────

interface WebSocketState {
  isConnected: boolean;
  deviceStates: Map<string, DeviceOnlineUpdateData>;
  osdStates: Map<string, DeviceOSDData>;
  upgradeStates: Map<string, DeviceUpgradeProgressData>;

  setConnected: (connected: boolean) => void;
  updateDeviceState: (sn: string, data: DeviceOnlineUpdateData) => void;
  updateOsdState: (sn: string, data: DeviceOSDData) => void;
  updateUpgradeState: (sn: string, data: DeviceUpgradeProgressData) => void;
  removeUpgradeState: (sn: string) => void;
}

const useWebSocketStore = create<WebSocketState>((set) => ({
  isConnected: false,
  deviceStates: new Map(),
  osdStates: new Map(),
  upgradeStates: new Map(),

  setConnected: (connected) => set({ isConnected: connected }),
  updateDeviceState: (sn, data) => set((state) => {
    const next = new Map(state.deviceStates);
    next.set(sn, data);
    return { deviceStates: next };
  }),
  updateOsdState: (sn, data) => set((state) => {
    const next = new Map(state.osdStates);
    next.set(sn, data);
    return { osdStates: next };
  }),
  updateUpgradeState: (sn, data) => set((state) => {
    const next = new Map(state.upgradeStates);
    next.set(sn, data);
    return { upgradeStates: next };
  }),
  removeUpgradeState: (sn) => set((state) => {
    const next = new Map(state.upgradeStates);
    next.delete(sn);
    return { upgradeStates: next };
  }),
}));

// ─── Global Connection Lifecycle & Subscriptions ─────────────────────────────────

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let subscribersCount = 0;

const globalHandlers: EventHandlerMap = {
  device_online_update: [],
  device_osd: [],
  hms_event: [],
  task_progress: [],
  flight_area_sync: [],
  device_upgrade_progress: [],
};

function connectGlobalWS() {
  if (ws) return; // already connected or connecting

  const token = getToken();
  if (!token) return;

  const base = DJI_CONFIG.BASE_URL.replace(/^http/, 'ws');
  const url = `${base}/api/v1/ws?x-auth-token=${token}`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    useWebSocketStore.getState().setConnected(true);
  };

  ws.onclose = (e) => {
    ws = null;
    useWebSocketStore.getState().setConnected(false);
    
    // Reconnect after 3 seconds unless deliberately closed, and we still have active mounts
    if (e.code !== 1000 && subscribersCount > 0) {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectGlobalWS, 3000);
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
      if (biz_code in globalHandlers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalHandlers[biz_code as BizCode] as any[]).forEach((h) => h(data));
      }

      // Wrap all state updates in startTransition so navigation takes priority
      // over incoming telemetry re-renders.
      startTransition(() => {
        // Built-in: maintain device state map for device_online_update
        if (biz_code === 'device_online_update') {
          const update = data as DeviceOnlineUpdateData;
          useWebSocketStore.getState().updateDeviceState(update.sn, update);
        }

        // Built-in: maintain OSD map — primary source of GPS + telemetry
        if (biz_code === 'device_osd') {
          const osd = data as DeviceOSDData;
          useWebSocketStore.getState().updateOsdState(osd.sn, osd);
        }

        // Built-in: track OTA progress per device; remove entry once done/failed
        if (biz_code === 'device_upgrade_progress') {
          const upgrade = data as DeviceUpgradeProgressData;
          const done = upgrade.host.status === 3 || upgrade.host.status === 4;
          if (done) {
            useWebSocketStore.getState().removeUpgradeState(upgrade.sn);
          } else {
            useWebSocketStore.getState().updateUpgradeState(upgrade.sn, upgrade);
          }
        }
      });
    } catch (err) {
      console.error('[DJI WS] Failed to parse message:', err);
    }
  };
}

function disconnectGlobalWS() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(1000, 'all components unmounted');
    }
    ws = null;
  }
  useWebSocketStore.getState().setConnected(false);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDJIWebSocket() {
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const deviceStates = useWebSocketStore((state) => state.deviceStates);
  const osdStates = useWebSocketStore((state) => state.osdStates);
  const upgradeStates = useWebSocketStore((state) => state.upgradeStates);

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
      (globalHandlers[bizCode] as any[]).push(handler);
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr = globalHandlers[bizCode] as any[];
        const idx = arr.indexOf(handler);
        if (idx !== -1) arr.splice(idx, 1);
      };
    },
    []
  );

  useEffect(() => {
    subscribersCount++;
    connectGlobalWS();

    return () => {
      subscribersCount--;
      if (subscribersCount === 0) {
        disconnectGlobalWS();
      }
    };
  }, []);

  return { isConnected, deviceStates, osdStates, upgradeStates, on };
}
