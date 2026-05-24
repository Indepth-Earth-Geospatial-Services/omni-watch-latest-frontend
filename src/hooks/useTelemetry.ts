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

import { useCallback, useMemo, useRef } from 'react';
import { useDJIWebSocket, type DeviceOnlineUpdateData } from './useDJIWebSocket';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProcessedDroneData {
  battery: number;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  direction: string; // compass rose label derived from heading, e.g. "NE"
  speed: number;
  online: boolean;
  modeCode: number; // 0 = standby/docked, 1 = in-flight
  lastUpdate: number;
  isRecent: boolean;
  hasOSD: boolean; // true once a device_osd event has been received
  isGPSFixed: boolean; // position_state.is_fixed === 1
  gpsNumber: number; // satellites visible (position_state.gps_number)
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
function headingToCompass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTelemetry() {
  const { isConnected, deviceStates, osdStates } = useDJIWebSocket();

  // Sticky GPS cache — once a valid fix is received, we keep those coords even
  // when subsequent OSD events arrive with lat=0/lng=0 (is_fixed=0).
  const lastValidGPS = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Union of all SNs that have received any data — OSD or online_update.
  // geo-map iterates this to know which drones to render / track.
  const allDroneSns = useMemo(() => {
    const merged = new Map<string, true>();
    deviceStates.forEach((_, sn) => merged.set(sn, true));
    osdStates.forEach((_, sn) => merged.set(sn, true));
    return merged;
  }, [deviceStates, osdStates]);

  const getDroneTelemetry = useCallback(
    (sn: string): DeviceOnlineUpdateData | undefined => deviceStates.get(sn),
    [deviceStates]
  );

  const getProcessedDroneData = useCallback(
    (sn: string): ProcessedDroneData | null => {
      const osd = osdStates.get(sn);
      const state = deviceStates.get(sn);
      if (!osd && !state) return null;

      const rawLat = osd ? Number(osd.host.latitude)  : (state?.latitude  ?? 0);
      const rawLng = osd ? Number(osd.host.longitude) : (state?.longitude ?? 0);

      // is_fixed=1 means RTK precision fix — NOT required for a valid GPS position.
      // Cache any time we have actual non-zero coordinates.
      const hasCoords = rawLat !== 0 || rawLng !== 0;
      if (hasCoords) {
        lastValidGPS.current.set(sn, { lat: rawLat, lng: rawLng });
      }

      // Fall back to the last known valid position when current OSD has no coords.
      const cached = lastValidGPS.current.get(sn);
      const lat = hasCoords ? rawLat : (cached?.lat ?? 0);
      const lng = hasCoords ? rawLng : (cached?.lng ?? 0);

      const isFixed = (osd?.host.position_state?.is_fixed ?? 0) === 1;

      const altitude = osd ? Number(osd.host.height)           : (state?.altitude         ?? 0);
      const speed    = osd ? Number(osd.host.horizontal_speed) : (state?.horizontal_speed ?? 0);
      const battery  = osd ? (osd.host.battery?.capacity_percent ?? 0) : (state?.battery_percent ?? 0);
      const modeCode = osd?.host.mode_code   ?? state?.mode_code  ?? 0;
      const heading  = osd?.host.attitude_head ?? state?.heading  ?? 0;

      return {
        battery,
        latitude: lat,
        longitude: lng,
        altitude,
        heading,
        direction: headingToCompass(heading),
        speed,
        online: state?.online_status ?? true,
        modeCode,
        lastUpdate: Date.now(),
        isRecent: true,
        hasOSD: !!osd,
        isGPSFixed: isFixed,
        gpsNumber: osd?.host.position_state?.gps_number ?? 0,
      };
    },
    [deviceStates, osdStates]
  );

  return {
    connectionStatus: isConnected ? 'connected' : ('disconnected' as const),
    droneUpdates: allDroneSns,
    getDroneTelemetry,
    getProcessedDroneData,
    isTelemetrySocketConnected: isConnected,
  };
}
