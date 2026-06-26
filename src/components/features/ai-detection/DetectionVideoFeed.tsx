'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Video, VideoOff, Loader2 } from 'lucide-react';
import { WebRTCPlayer, type StreamState } from '@/components/features/streams/WebRTCPlayer';
import type { ThreatDetection } from '@/lib/types/threats';
import type { StreamEntry } from '@/hooks/useStreamKeys';

interface DetectionVideoFeedProps {
  detections: ThreatDetection[];
  selectedStreamKeys: Set<string>;
  streams: StreamEntry[];
}

function buildWhepUrl(streamKey: string): string {
  const base = process.env.NEXT_PUBLIC_SRS_WHEP_URL || 'https://srs.jydestudios.com';
  return `${base}/rtc/v1/whep/?app=live&stream=${streamKey}`;
}

export function DetectionVideoFeed({
  detections,
  selectedStreamKeys,
  streams,
}: DetectionVideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamState, setStreamState] = useState<StreamState>('connecting');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const activeEntry = useMemo(() => {
    const keys = Array.from(selectedStreamKeys);
    if (keys.length === 0) return undefined;
    return streams.find((s) => s.streamKey === keys[0]);
  }, [selectedStreamKeys, streams]);

  const whepUrl = activeEntry ? buildWhepUrl(activeEntry.streamKey) : '';

  // Draw bounding boxes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let rafId: number;

    const draw = () => {
      if (video.readyState < 2) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const d of detections) {
        const x = d.boundingBox.x * canvas.width;
        const y = d.boundingBox.y * canvas.height;
        const w = d.boundingBox.width * canvas.width;
        const h = d.boundingBox.height * canvas.height;

        const color = d.isVerified ? '#ef4444' : '#f97316';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const label = `${d.type} ${(d.confidence * 100).toFixed(0)}%`;
        ctx.font = '11px Poppins, sans-serif';
        const metrics = ctx.measureText(label);
        const labelW = metrics.width + 8;
        const labelH = 16;
        const labelY = y > labelH ? y - labelH : y;

        ctx.fillStyle = color;
        ctx.fillRect(x, labelY, labelW, labelH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 4, labelY + 12);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [detections]);

  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const handleStateChange = useCallback((state: StreamState, err?: string) => {
    setStreamState(state);
    if (err) setErrorMsg(err);
  }, []);

  const handleMediaStream = useCallback((stream: MediaStream | null) => {
    setMediaStream(stream);
  }, []);

  const streamCount = selectedStreamKeys.size;

  return (
    <div className='relative bg-[#0C0E12] overflow-hidden flex flex-col flex-1 min-w-0 rounded-xl border border-zinc-800/50'>
      {whepUrl && (
        <WebRTCPlayer
          key={activeEntry?.streamKey}
          url={whepUrl}
          onStateChange={handleStateChange}
          onMediaStream={handleMediaStream}
        />
      )}

      <div className='flex items-center gap-2 px-3 py-2 bg-[#12151C] border-b border-zinc-800/60 flex-shrink-0'>
        <span className='text-xs font-semibold font-poppins uppercase tracking-wider text-[#8C90A0]'>
          Live Feed
        </span>
        {streamCount > 0 && (
          <span className='text-[10px] font-poppins text-zinc-600'>
            — {streamCount} stream{streamCount !== 1 ? 's' : ''} selected
          </span>
        )}
        <div className='flex-1' />
        <div className='flex items-center gap-1.5'>
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              streamState === 'playing'
                ? 'bg-[#2CAC73] shadow-[0px_0px_4px_0px_#45F0CF]'
                : streamState === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-zinc-600'
            }`}
          />
          <span className='text-[10px] font-poppins text-zinc-500'>
            {streamState === 'playing' ? 'Live' : streamState === 'connecting' ? 'Connecting' : 'Idle'}
          </span>
        </div>
      </div>

      <div className='relative flex-1 min-h-0 bg-black'>
        {activeEntry ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className='w-full h-full object-contain'
            />
            <canvas ref={canvasRef} className='absolute inset-0 pointer-events-none w-full h-full' />

            {streamState === 'connecting' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/60'>
                <Loader2 className='w-6 h-6 text-zinc-500 animate-spin mb-2' />
                <span className='text-xs font-poppins text-zinc-500'>Connecting to stream...</span>
              </div>
            )}

            {streamState === 'error' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/60'>
                <VideoOff className='w-6 h-6 text-red-500/60 mb-2' />
                <span className='text-xs font-poppins text-red-400/60'>
                  {errorMsg || 'Stream unavailable'}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <div
              className='absolute inset-0 opacity-5'
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
              }}
            />
            <Video className='w-8 h-8 text-zinc-700 mb-2' />
            <p className='text-xs font-poppins text-zinc-600'>Select a stream to begin monitoring</p>
          </div>
        )}

        {activeEntry && streamState === 'playing' && (
          <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent'>
            <span className='text-[10px] font-mono font-poppins text-zinc-500'>
              {activeEntry.deviceSn}
            </span>
            <span className='text-[10px] font-poppins text-zinc-600'>
              {detections.length} detection{detections.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
