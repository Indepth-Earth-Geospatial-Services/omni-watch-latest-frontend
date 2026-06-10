'use client';

import { useEffect, useRef } from 'react';

export type StreamState = 'connecting' | 'playing' | 'error';

interface WebRTCPlayerProps {
  url: string;
  onStateChange: (state: StreamState, errorMsg?: string) => void;
  onMediaStream: (stream: MediaStream | null) => void;
}

/**
 * Headless WebRTC / WHEP connection manager — renders nothing.
 * One instance lives for the lifetime of a stream; unmounting closes the connection.
 * The parent owns the persistent lifecycle; display is handled by VideoArea.
 */
export function WebRTCPlayer({ url, onStateChange, onMediaStream }: WebRTCPlayerProps) {
  const onStateChangeRef = useRef(onStateChange);
  const onMediaStreamRef = useRef(onMediaStream);
  onStateChangeRef.current = onStateChange;
  onMediaStreamRef.current = onMediaStream;

  useEffect(() => {
    let cancelled = false;

    // No STUN servers — DJI's WHEP server and drone are on the same local network.
    // Host candidates are sufficient; STUN would only add latency here.
    const pc = new RTCPeerConnection();

    onStateChangeRef.current('connecting');

    pc.ontrack = (e) => {
      if (cancelled) return;
      const [stream] = e.streams;
      if (stream) {
        onMediaStreamRef.current(stream);
        onStateChangeRef.current('playing');
      }
    };

    pc.onconnectionstatechange = () => {
      if (cancelled) return;
      const s = pc.connectionState;
      if (s === 'failed' || s === 'disconnected') {
        onStateChangeRef.current('error', 'Stream connection lost');
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });

    async function negotiate() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering, but cap at 5 s. If STUN is unreachable or
      // slow, we proceed with whatever candidates we have — the WHEP server
      // can complete ICE via trickle after the SDP exchange.
      await Promise.race([
        new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') { resolve(); return; }
          const handler = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', handler);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', handler);
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ]);

      // DJI's WHEP endpoint expects only Content-Type: application/sdp — no auth headers.
      // Adding Authorization triggers a CORS preflight that the DJI server rejects.
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription!.sdp,
      });

      if (res.status !== 201 && !res.ok) {
        throw new Error(`WHEP ${res.status} ${res.statusText}`);
      }

      const answerSdp = await res.text();
      if (!answerSdp.trim().startsWith('v=')) {
        throw new Error('Invalid SDP answer from server');
      }

      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    }

    negotiate().catch((err) => {
      if (cancelled) return;
      onStateChangeRef.current('error', err?.message ?? 'Failed to connect to stream');
    });

    return () => {
      cancelled = true;
      pc.close();
      onMediaStreamRef.current(null);
    };
  }, [url]);

  return null;
}
