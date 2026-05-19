'use client';

import { useEffect, useRef, useState } from 'react';
import { getToken } from '@/lib/config/token-store';

interface WebRTCPlayerProps {
  /** Full WHEP URL returned by the startStream API in res.data.url */
  url: string;
  className?: string;
}

type PlayerState = 'connecting' | 'playing' | 'error';

/**
 * WebRTC viewer using the WHEP protocol.
 * The URL comes directly from the startStream API response (res.data.url) —
 * no URL construction needed here.
 *
 * Flow:
 *   1. Create RTCPeerConnection with recvonly transceivers
 *   2. Create SDP offer, wait for full ICE gathering (Vanilla ICE)
 *   3. POST raw SDP (Content-Type: application/sdp) to the WHEP URL
 *   4. Server responds 201 with SDP answer in the body
 *   5. Set remote description → receive video track → render
 */
export function WebRTCPlayer({ url, className = '' }: WebRTCPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [state, setState] = useState<PlayerState>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;
    setState('connecting');
    setErrorMsg(null);

    pc.ontrack = (e) => {
      if (cancelled || !videoRef.current) return;
      const [stream] = e.streams;
      if (stream) {
        videoRef.current.srcObject = stream;
        setState('playing');
      }
    };

    pc.onconnectionstatechange = () => {
      if (cancelled) return;
      const s = pc.connectionState;
      if (s === 'failed' || s === 'disconnected') {
        setState('error');
        setErrorMsg('Stream connection lost');
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    async function negotiate() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for full ICE gathering before sending
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
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

      const res = await fetch(url, {
        method: 'POST',
        headers,
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
      setState('error');
      setErrorMsg(err?.message ?? 'Failed to connect to stream');
    });

    return () => {
      cancelled = true;
      pc.close();
      pcRef.current = null;
    };
  }, [url]);

  return (
    <div className={`relative bg-black overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${state === 'playing' ? 'block' : 'hidden'}`}
      />

      {state === 'connecting' && (
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-zinc-950'>
          <div className='w-6 h-6 rounded-full border-2 border-[#1C93FF] border-t-transparent animate-spin' />
          <p className='text-[11px] font-medium text-zinc-500'>Connecting…</p>
        </div>
      )}

      {state === 'error' && (
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center bg-zinc-950'>
          <p className='text-xs font-semibold text-red-400'>{errorMsg}</p>
          <p className='text-[10px] text-zinc-700'>Use stream controls to retry</p>
        </div>
      )}
    </div>
  );
}
