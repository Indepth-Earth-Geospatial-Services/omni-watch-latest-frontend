'use client';

// DRC = Drone Real-time Control — the MQTT channel required for emergency stop.
//
// Lifecycle:
//   call activate(dockSn) → POST /drc/connect → POST /drc/enter → MQTT connect
//   call deactivate()     → clear heartbeat → end MQTT → POST /drc/exit
//
// Emergency stop MUST go through this channel; the REST /jobs API does not
// support real-time stop commands. Mirror of drone_tracker.html emergencyStop().

import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';
import { DJI_CONFIG } from '@/lib/config/config';
import { useAuth } from '@/providers/AuthProvider';
import { drcConnect, drcEnter, drcExit } from '@/services/djiservice-layer/dji-service';

// tcp://host:1883 → ws://host:8083/mqtt  (browser cannot use raw TCP MQTT)
function toWsUrl(raw: string): string {
  let url = raw.replace(/^tcp:\/\//, 'ws://').replace(/:1883\b/, ':8083');
  if (!url.endsWith('/mqtt')) url += '/mqtt';
  return url;
}

export type DRCStatus = 'idle' | 'connecting' | 'active' | 'error';

export function useDRC() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  const [status, setStatus] = useState<DRCStatus>('idle');

  // Keep workspaceId always current so the cleanup closure sees the right value even at unmount
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  // All mutable session state lives in refs — no re-render needed
  const clientRef    = useRef<ReturnType<typeof mqtt.connect> | null>(null);
  const clientIdRef  = useRef('');
  const dockSnRef    = useRef('');
  const pubTopicRef  = useRef('');
  const seqRef       = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef   = useRef(true);

  // Cleanup on unmount — end MQTT and fire exit API
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup(false); // sync part; async exit is fire-and-forget
    };
  }, []);

  function cleanup(updateState: boolean) {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    if (clientIdRef.current && dockSnRef.current) {
      drcExit(workspaceIdRef.current, clientIdRef.current, dockSnRef.current).catch(() => {});
      clientIdRef.current = '';
    }
    if (updateState && mountedRef.current) setStatus('idle');
  }

  const activate = useCallback(async (dockSn: string): Promise<void> => {
    // Idempotent — skip if already up or workspace not available yet
    if (clientRef.current) return;
    if (!workspaceIdRef.current) throw new Error('Workspace ID not available — user may not be logged in');

    if (mountedRef.current) setStatus('connecting');
    dockSnRef.current = dockSn;

    try {
      // 1. Get MQTT broker credentials
      const broker = await drcConnect(workspaceIdRef.current);
      clientIdRef.current = broker.client_id;

      // 2. Get DRC pub/sub MQTT topics
      const { pub, sub } = await drcEnter(workspaceIdRef.current, broker.client_id, dockSn);
      pubTopicRef.current = pub[0] ?? '';

      // 3. Convert TCP address → WebSocket URL (browsers can't use raw TCP MQTT)
      const addr = toWsUrl(broker.address);

      // 4. Connect MQTT — allow auto-reconnect so a network blip during flight
      //    doesn't silently kill the emergency stop channel
      const client = mqtt.connect(addr, {
        clientId: broker.client_id,
        username: broker.username,
        password: broker.password,
        clean:     true,
        reconnectPeriod: 2000, // retry every 2s on drop — keeps E-stop alive mid-flight
        keepalive: 30,
      });
      clientRef.current = client;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('DRC MQTT connection timed out')), 10000);

        client.on('connect', () => {
          clearTimeout(timeout);

          // Subscribe to DRC response topics
          sub.forEach((t) => client.subscribe(t, { qos: 0 }));

          // Heartbeat — required to keep the DRC session alive.
          // Only set up once; auto-reconnect reuses the same client and existing interval.
          if (!heartbeatRef.current) {
            seqRef.current = 0;
            heartbeatRef.current = setInterval(() => {
              if (!pubTopicRef.current || !clientRef.current) return;
              clientRef.current.publish(
                pubTopicRef.current,
                JSON.stringify({ method: 'heart_beat', data: { seq: seqRef.current++, timestamp: Date.now() } }),
              );
            }, 1000);
          }

          if (mountedRef.current) setStatus('active');
          resolve();
        });

        client.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        client.on('reconnect', () => {
          if (mountedRef.current) setStatus('connecting');
        });

        client.on('close', () => {
          // Only mark idle if we're not actively reconnecting (reconnectPeriod>0 handles retries)
          if (mountedRef.current && !client.reconnecting) setStatus('idle');
        });
      });
    } catch (err) {
      cleanup(false);
      if (mountedRef.current) setStatus('error');
      throw err;
    }
  }, []);

  const deactivate = useCallback(() => {
    cleanup(true);
  }, []);

  const sendEmergencyStop = useCallback((): boolean => {
    if (!clientRef.current || !pubTopicRef.current) return false;
    clientRef.current.publish(
      pubTopicRef.current,
      JSON.stringify({ method: 'drone_emergency_stop', data: { seq: seqRef.current++ } }),
    );
    return true;
  }, []);

  return { status, activate, deactivate, sendEmergencyStop };
}
