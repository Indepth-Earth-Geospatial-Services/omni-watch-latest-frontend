'use client';

import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { VideoOff, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { WebRTCPlayer, type StreamState } from '@/components/features/streams/WebRTCPlayer';
import type { ThreatDetection } from '@/lib/types/threats';
import type { DJIDevice } from '@/lib/types';

interface StreamVideoCardProps {
  streamKey: string;
  deviceSn: string;
  device?: DJIDevice;
  detections: ThreatDetection[];
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

function buildWhepUrl(streamKey: string): string {
  const base = process.env.NEXT_PUBLIC_SRS_WHEP_URL || 'https://srs.jydestudios.com';
  return `${base}/rtc/v1/whep/?app=live&stream=${streamKey}`;
}

export const StreamVideoCard = memo(function StreamVideoCard({
  streamKey,
  deviceSn,
  device,
  detections,
  isExpanded = false,
  onExpand,
  onCollapse,
}: StreamVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionsRef = useRef<ThreatDetection[]>(detections);
  const [streamState, setStreamState] = useState<StreamState>('connecting');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  detectionsRef.current = detections;

  const whepUrl = buildWhepUrl(streamKey);

  // Canvas overlay — draw bounding boxes at 60fps using refs (no re-renders)
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

      for (const d of detectionsRef.current) {
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
  }, []);

  // Attach mediaStream to video element
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

  const deviceLabel = device?.nickname || device?.deviceName || deviceSn;

  return (
    <div className={`relative flex flex-col bg-[#0C0E12] overflow-hidden rounded-xl border border-zinc-800/50 ${isExpanded ? 'w-full h-full' : ''}`}>
      {/* Headless WebRTC connection */}
      <WebRTCPlayer
        key={streamKey}
        url={whepUrl}
        onStateChange={handleStateChange}
        onMediaStream={handleMediaStream}
      />

      {/* Device name label */}
      <div className='flex items-center gap-2 px-3 py-2 bg-[#12151C] border-b border-zinc-800/60 flex-shrink-0'>
        <span className='text-[11px] font-bold font-poppins text-zinc-300 truncate'>
          {deviceLabel}
        </span>
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
            {streamState === 'playing' ? 'Live' : streamState === 'connecting' ? 'Connecting' : 'Error'}
          </span>
        </div>
        {/* Expand / Collapse button */}
        {isExpanded ? (
          <button
            onClick={onCollapse}
            className='ml-1 p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors'
            title='Collapse to grid'
          >
            <Minimize2 size={13} />
          </button>
        ) : onExpand ? (
          <button
            onClick={onExpand}
            className='ml-1 p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors'
            title='Expand to fill'
          >
            <Maximize2 size={13} />
          </button>
        ) : null}
      </div>

      {/* Video area with canvas overlay */}
      <div className='relative flex-1 min-h-0 bg-black'>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className='w-full h-full object-contain'
        />
        <canvas ref={canvasRef} className='absolute inset-0 pointer-events-none w-full h-full' />

        {/* Connecting overlay */}
        {streamState === 'connecting' && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/60'>
            <Loader2 className='w-5 h-5 text-zinc-500 animate-spin mb-2' />
            <span className='text-[10px] font-poppins text-zinc-500'>Connecting...</span>
          </div>
        )}

        {/* Error overlay */}
        {streamState === 'error' && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/60'>
            <VideoOff className='w-5 h-5 text-red-500/60 mb-2' />
            <span className='text-[10px] font-poppins text-red-400/60'>
              {errorMsg || 'Stream unavailable'}
            </span>
          </div>
        )}

        {/* Bottom HUD — detection count */}
        {streamState === 'playing' && (
          <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent'>
            <span className='text-[10px] font-mono text-zinc-500'>
              {deviceSn}
            </span>
            <span className='text-[10px] font-poppins text-zinc-600'>
              {detections.length} detection{detections.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
