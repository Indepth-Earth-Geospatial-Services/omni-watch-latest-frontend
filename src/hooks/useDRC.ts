'use client';

// DRC = Drone Real-time Control — the MQTT channel required for manual flight and emergency stop.
//
// Activation sequence:
//   activate(dockSn)
//     → POST /drc/enter  (drc_mode_enter → dock services MQTT, returns pub/sub topics + credentials)
//     → MQTT connect + heartbeat loop
//
// Teardown:
//   deactivate() → POST /drc/exit (closes DRC channel on the server side)
//
// stick_control requires flight authority to be held — enforced in the UI.
// Emergency stop (drone_emergency_stop) does NOT require flight authority.

import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';
import { DJI_CONFIG } from '@/lib/config/config';
import { useAuth } from '@/providers/AuthProvider';
import { drcConnect, drcEnter, drcExit, DRC_CLIENT_ID } from '@/services/djiservice-layer/dji-service';

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
  const clientRef       = useRef<ReturnType<typeof mqtt.connect> | null>(null);
  const clientIdRef     = useRef('');
  const dockSnRef       = useRef('');
  const pubTopicRef     = useRef('');
  const heartbeatSeqRef = useRef(0);  // heart_beat top-level seq
  const stickSeqRef     = useRef(0);  // stick_control top-level seq
  const heartbeatRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef      = useRef(true);

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
    if (workspaceIdRef.current && clientIdRef.current && dockSnRef.current) {
      drcExit(workspaceIdRef.current, clientIdRef.current, dockSnRef.current).catch(() => {});
      clientIdRef.current = '';
    }
    stickSeqRef.current = 0;
    if (updateState && mountedRef.current) setStatus('idle');
  }

  const activate = useCallback(async (dockSn: string): Promise<void> => {
    // Idempotent — skip if already up or workspace not available yet
    if (clientRef.current) return;
    if (!workspaceIdRef.current) throw new Error('Workspace ID not available — user may not be logged in');

    if (mountedRef.current) setStatus('connecting');
    dockSnRef.current = dockSn;
    clientIdRef.current = DRC_CLIENT_ID;

    try {
      // Best-effort exit of any stale session before opening a new one.
      // 514304 "DRC link is refused" is commonly caused by a previous session
      // that was never properly closed (e.g. page refresh, dropped connection).
      await drcExit(workspaceIdRef.current, DRC_CLIENT_ID, dockSn).catch(() => {});

      // 1. Enter DRC mode — returns pub/sub topics and (on most servers) embedded
      //    MQTT broker credentials so the client can connect to the same broker.
      const enterResult = await drcEnter(workspaceIdRef.current, DRC_CLIENT_ID, dockSn);
      pubTopicRef.current = enterResult.pub[0] ?? '';

      // 2. Resolve MQTT broker credentials.
      //    Prefer credentials embedded in the /drc/enter response (Lawrence's server
      //    returns them there). Fall back to a separate /drc/connect call for servers
      //    that follow the older two-step pattern.
      let addr: string;
      let mqttUsername: string | undefined;
      let mqttPassword: string | undefined;

      if (enterResult.address) {
        addr          = toWsUrl(enterResult.address);
        mqttUsername  = enterResult.username;
        mqttPassword  = enterResult.password;
      } else {
        const broker  = await drcConnect(workspaceIdRef.current);
        addr          = toWsUrl(broker.address);
        mqttUsername  = broker.username;
        mqttPassword  = broker.password;
      }

      // 3. Connect MQTT — allow auto-reconnect so a network blip during flight
      //    doesn't silently kill the emergency stop channel.
      const client = mqtt.connect(addr, {
        clientId: DRC_CLIENT_ID,
        username: mqttUsername,
        password: mqttPassword,
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
          enterResult.sub.forEach((t: string) => client.subscribe(t, { qos: 0 }));

          // Heartbeat — required to keep the DRC session alive.
          // Only set up once; auto-reconnect reuses the same client and existing interval.
          if (!heartbeatRef.current) {
            heartbeatSeqRef.current = 0;
            heartbeatRef.current = setInterval(() => {
              if (!pubTopicRef.current || !clientRef.current) return;
              clientRef.current.publish(
                pubTopicRef.current,
                JSON.stringify({ method: 'heart_beat', data: { timestamp: Date.now() }, seq: heartbeatSeqRef.current++ }),
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
          // Guard: only update status if this client is still the active one.
          // After deactivate() force-closes a client, its stale events must not
          // override the status of the new connection being established.
          if (mountedRef.current && clientRef.current === client) setStatus('connecting');
        });

        client.on('close', () => {
          if (mountedRef.current && clientRef.current === client && !client.reconnecting) setStatus('idle');
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
      JSON.stringify({ method: 'drone_emergency_stop', data: {} }),
    );
    return true;
  }, []);

  /**
   * Send a stick_control frame via DRC MQTT (5-10 Hz).
   * Accepts normalized axes: -1.0 to +1.0 (already speed-scaled by the caller).
   *   x = roll     right + / left -
   *   y = pitch    fwd  + / back -
   *   h = throttle up   + / down -
   *   w = yaw      CW   + / CCW  -
   * Converted to RC PWM stick values: neutral 1024, range 364–1684 (±660).
   */
  const sendJoystick = useCallback((x: number, y: number, h: number, w: number): boolean => {
    if (!clientRef.current || !pubTopicRef.current) return false;
    const toStick = (v: number) => Math.round(Math.max(364, Math.min(1684, 1024 + v * 660)));
    clientRef.current.publish(
      pubTopicRef.current,
      JSON.stringify({
        seq: stickSeqRef.current++,
        method: 'stick_control',
        data: {
          roll: toStick(x),
          pitch: toStick(y),
          throttle: toStick(h),
          yaw: toStick(w),
          gimbal_pitch: 1024,
        },
      }),
    );
    return true;
  }, []);

  return { status, activate, deactivate, sendEmergencyStop, sendJoystick };
}
