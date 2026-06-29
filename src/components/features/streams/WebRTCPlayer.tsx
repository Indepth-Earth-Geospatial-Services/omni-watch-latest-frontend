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

    console.log('[WebRTC] ▶ Starting WHEP session', { url });

    const pc = new RTCPeerConnection();

    onStateChangeRef.current('connecting');

    pc.ontrack = (e) => {
      if (cancelled) return;
      const stream = e.streams[0];
      console.log('[WebRTC] ontrack fired', {
        tracks: e.track.kind,
        streamId: stream?.id,
        trackReadyState: e.track.readyState,
        trackEnabled: e.track.enabled,
        trackMuted: e.track.muted,
      });
      if (stream) onMediaStreamRef.current(stream);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('[WebRTC] ICE candidate (local):', e.candidate.candidate);
      } else {
        console.log('[WebRTC] ICE gathering complete (all local candidates sent)');
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state →', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state →', pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      if (cancelled) return;
      const s = pc.connectionState;
      console.log('[WebRTC] Connection state →', s);
      if (s === 'connected') {
        console.log('[WebRTC] ✅ ICE + DTLS connected — frames should be flowing');
        onStateChangeRef.current('playing');
      } else if (s === 'failed') {
        console.error('[WebRTC] ❌ Connection failed — ICE could not connect');
        onStateChangeRef.current('error', 'Stream connection failed');
      } else if (s === 'disconnected') {
        console.warn('[WebRTC] ⚠ Connection disconnected');
        onStateChangeRef.current('error', 'Stream connection lost');
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });

    async function negotiate() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('[WebRTC] Offer created, sending to WHEP endpoint immediately (bare SDP, no candidates)');
      console.log('[WebRTC] Offer SDP (first 3 lines):', offer.sdp?.split('\n').slice(0, 3).join(' | '));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });

      console.log('[WebRTC] WHEP response status:', res.status, res.statusText);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[WebRTC] WHEP error response body:', body);
        throw new Error(`WHEP ${res.status} ${res.statusText}`);
      }

      const answerSdp = await res.text();
      console.log('[WebRTC] Answer SDP received (first 5 lines):', answerSdp.split('\n').slice(0, 5).join(' | '));

      // Log ICE candidates in the answer (server-side candidates the browser will try to reach)
      const serverCandidates = answerSdp.split('\n').filter((l) => l.startsWith('a=candidate'));
      console.log('[WebRTC] Server ICE candidates in answer:', serverCandidates.length, serverCandidates);

      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log('[WebRTC] Remote description set — ICE checks starting');
    }

    negotiate().catch((err) => {
      if (cancelled) return;
      console.error('[WebRTC] ❌ Negotiate failed:', err);
      onStateChangeRef.current('error', err?.message ?? 'Failed to connect to stream');
    });

    return () => {
      cancelled = true;
      console.log('[WebRTC] ■ Closing peer connection');
      pc.close();
      onMediaStreamRef.current(null);
    };
  }, [url]);

  return null;
}
