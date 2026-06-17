'use client';

// Subscribes to the MQTT broker for dock OSD telemetry.
//
// The DJI backend publishes dock state changes (including mode_code) over MQTT
// on topic thing/product/{sn}/osd — this is the only channel that reliably
// delivers dock mode_code changes (e.g. entering/leaving Remote Debug mode).
// The WebSocket layer only forwards drone OSD, not dock OSD.
//
// Broker: ws://<host>:8083/mqtt (WebSocket MQTT — browsers cannot use raw TCP)
// Credentials read from NEXT_PUBLIC_MQTT_USERNAME / NEXT_PUBLIC_MQTT_PASSWORD.

import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt from 'mqtt';

// Transform tcp://host:1883 → ws://host:8083/mqtt (browser-compatible)
function toWsUrl(raw: string): string {
  let url = raw.replace(/^tcp:\/\//, 'ws://').replace(/:1883\b/, ':8083');
  if (!url.endsWith('/mqtt')) url += '/mqtt';
  return url;
}

const RAW_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL ?? 'ws://localhost:8083/mqtt';
const BROKER_URL = toWsUrl(RAW_URL);
const MQTT_USERNAME = process.env.NEXT_PUBLIC_MQTT_USERNAME;
const MQTT_PASSWORD = process.env.NEXT_PUBLIC_MQTT_PASSWORD;

const ONLINE_TIMEOUT_MS = 8000;

interface DockOSDState {
  mode_code: number;
  lastSeen: number;
  latitude?: number;
  longitude?: number;
  drone_in_dock?: number;
  cover_state?: number;
  temperature?: number;
}

export function useDockMQTT() {
  const [isConnected, setIsConnected] = useState(false);
  const [dockStates, setDockStates] = useState<Map<string, DockOSDState>>(new Map());
  const clientRef = useRef<ReturnType<typeof mqtt.connect> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    // Defer by one tick so React Strict Mode's first unmount can cancel this
    // timer before the WebSocket is ever created — avoids "closed before
    // connection established" from tearing down a CONNECTING socket.
    const initTimer = setTimeout(() => {
      if (cancelledRef.current) return;

      const client = mqtt.connect(BROKER_URL, {
        clientId: 'omniwatch_' + Math.random().toString(16).substring(2, 10),
        clean: true,
        reconnectPeriod: 2000,
        keepalive: 30,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
      });
      clientRef.current = client;

      client.on('connect', () => {
        if (cancelledRef.current) return;
        setIsConnected(true);
        client.subscribe('thing/product/+/osd', { qos: 0 });
        console.log(`[mqtt] connected to ${BROKER_URL}, subscribed to thing/product/+/osd`);
      });

      client.on('reconnect', () => {
        if (cancelledRef.current) return;
        console.log('[mqtt] reconnecting…');
      });

      client.on('close', () => {
        if (cancelledRef.current) return;
        setIsConnected(false);
        console.log('[mqtt] disconnected');
      });

      client.on('error', (err) => {
        if (cancelledRef.current) return;
        console.error('[mqtt] error', err.message);
      });

      client.on('message', (topic, message) => {
        if (cancelledRef.current) return;
        try {
          const payload = JSON.parse(message.toString());
          const data = payload?.data;
          if (!data) return;

          const parts = topic.split('/');
          const sn = parts[2];
          if (!sn || parts[3] !== 'osd') return;

          // Dock OSD uses flat data.mode_code; drone OSD nests it under data.host.
          // We only track dock-style messages here.
          const mode_code = data.mode_code;
          if (mode_code === undefined) return;

          console.log(`[mqtt:dock] sn=${sn} mode_code=${mode_code}`);

          setDockStates((prev) => {
            const next = new Map(prev);
            next.set(sn, {
              mode_code,
              lastSeen: Date.now(),
              latitude: data.latitude,
              longitude: data.longitude,
              drone_in_dock: data.drone_in_dock,
              cover_state: data.cover_state,
              temperature: data.temperature,
            });
            return next;
          });
        } catch {
          // ignore malformed messages
        }
      });
    }, 0);

    return () => {
      cancelledRef.current = true;
      clearTimeout(initTimer);
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, []);

  const getDockModeCode = useCallback(
    (sn: string): number => dockStates.get(sn)?.mode_code ?? -1,
    [dockStates]
  );

  const isDockOnlineMQTT = useCallback(
    (sn: string): boolean => {
      const state = dockStates.get(sn);
      if (!state) return false;
      return Date.now() - state.lastSeen < ONLINE_TIMEOUT_MS;
    },
    [dockStates]
  );

  return { isConnected, dockStates, getDockModeCode, isDockOnlineMQTT };
}
