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

    // No ICE servers — DJI's WHEP server sits on a public IP; host candidates suffice.
    const pc = new RTCPeerConnection();

    onStateChangeRef.current('connecting');

    // Stash the remote stream as soon as the track arrives so the video element
    // can receive frames the moment ICE connects.
    pc.ontrack = (e) => {
      if (cancelled) return;
      const stream = e.streams[0];
      if (stream) onMediaStreamRef.current(stream);
    };

    pc.onconnectionstatechange = () => {
      if (cancelled) return;
      const s = pc.connectionState;
      if (s === 'connected') {
        // ICE + DTLS complete — frames are now flowing.
        onStateChangeRef.current('playing');
      } else if (s === 'failed' || s === 'disconnected') {
        onStateChangeRef.current('error', 'Stream connection lost');
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });

    async function negotiate() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer.sdp immediately — before ICE gathering runs.
      // This matches drone_tracker.html's working approach: DJI's WHEP server
      // expects a bare offer without embedded client candidates; including them
      // causes the server's answer to not properly negotiate ICE.
      // Local candidates are still gathered in the background; they pair with
      // the server's candidates that arrive in the SDP answer.
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });

      if (!res.ok) {
        throw new Error(`WHEP ${res.status} ${res.statusText}`);
      }

      const answerSdp = await res.text();
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
