'use client';

// Telemetry hook — consumes device_online_update events from the DJI WebSocket.
//
// The DJI WebSocket (ws://<host>/api/v1/ws) fires device_online_update whenever
// a device's connection state, battery, or flight mode changes. The event also
// carries GPS fields (latitude, longitude, altitude) when the device has a fix.
//
// High-frequency GPS during active flight is delivered over MQTT (separate topic
// per device SN). Hook that MQTT connection into this one once an MQTT library
// is added to the project.

import { useDJIWebSocket, type DeviceOnlineUpdateData } from './useDJIWebSocket';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcessedDroneData {
  battery: number;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  online: boolean;
  modeCode: number;        // 0 = standby/docked, 1 = in-flight
  lastUpdate: number;
  isRecent: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTelemetry() {
  const { isConnected, deviceStates } = useDJIWebSocket();

  const getDroneTelemetry = (sn: string): DeviceOnlineUpdateData | undefined =>
    deviceStates.get(sn);

  const getProcessedDroneData = (sn: string): ProcessedDroneData | null => {
    const state = deviceStates.get(sn);
    if (!state) return null;

    return {
      battery:    state.battery_percent ?? 0,
      latitude:   state.latitude        ?? 0,
      longitude:  state.longitude       ?? 0,
      altitude:   state.altitude        ?? 0,
      heading:    state.heading         ?? 0,
      speed:      state.horizontal_speed ?? 0,
      online:     state.online_status,
      modeCode:   state.mode_code,
      lastUpdate: Date.now(),
      isRecent:   true,
    };
  };

  return {
    connectionStatus: isConnected ? 'connected' : 'disconnected' as const,
    droneUpdates: deviceStates,
    getDroneTelemetry,
    getProcessedDroneData,
    isTelemetrySocketConnected: isConnected,
  };
}
