'use client';

import { useEffect, useRef } from 'react';
import { getToken } from '@/lib/config/token-store';

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

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

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

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
          return;
        }
        const handler = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', handler);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', handler);
      });

      const token = getToken();
      const headers: HeadersInit = { 'Content-Type': 'application/sdp' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const res = await fetch(url, { method: 'POST', headers, body: pc.localDescription!.sdp });

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
