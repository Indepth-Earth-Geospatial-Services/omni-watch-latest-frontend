'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  DoorClosed,
  DoorOpen,
  HardDrive,
  Radio,
  RefreshCw,
  Send,
  VideoOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { executeJob } from '@/services/djiservice-layer/dji-service';
import { toast } from 'sonner';
import type { DJIDevice, LiveCapacity } from '@/lib/types';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';
import { useStartStream, useStopStream } from '@/hooks/useLiveStreams';
import { WebRTCPlayer, type StreamState } from '@/components/features/streams/WebRTCPlayer';

export interface DockMonitorProps {
  dockDevice?: DJIDevice;
  droneData?: ProcessedDroneData | null;
  dockCapacity?: LiveCapacity;
  className?: string;
  /** MQTT cover_state: 0 = closed, 1 = open, null = no data yet */
  coverState?: number | null;
  /** MQTT dock mode_code — cover control requires Debug Mode (mode_code=2) */
  dockModeCode?: number;
  /** Called whenever the physical cover is opened or closed */
  onCoverChange?: (open: boolean) => void;
}

const DockMonitor = ({
  dockDevice,
  droneData,
  dockCapacity,
  className,
  coverState,
  dockModeCode = -1,
  onCoverChange,
}: DockMonitorProps) => {
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamState, setStreamState] = useState<StreamState | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const activeIdRef = useRef('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync cover state from MQTT whenever it changes (authoritative source of truth)
  useEffect(() => {
    if (coverState !== null && coverState !== undefined) {
      setIsDoorOpen(coverState === 1);
    }
  }, [coverState]);

  // DJI backend requires `action` on every /jobs/* endpoint, even for null-data services.
  const { mutate: openCover, isPending: isOpening } = useMutation<void, Error, string>({
    mutationFn: (sn) => executeJob(sn, 'cover_open', { action: 0 }),
  });
  const { mutate: closeCover, isPending: isClosing } = useMutation<void, Error, string>({
    mutationFn: (sn) => executeJob(sn, 'cover_close', { action: 0 }),
  });
  const { mutate: startDockStream, isPending: isStarting } = useStartStream();
  const { mutate: stopDockStream } = useStopStream();

  const isPending = isOpening || isClosing;
  const dockOnline = dockDevice?.status ?? false;
  const dockName = dockDevice?.nickname || dockDevice?.deviceName || 'No Dock';
  const dockSn = dockDevice?.deviceSn ?? '';
  const firmware = dockDevice?.firmwareVersion ?? '—';
  const droneInDock = droneData ? droneData.modeCode === 0 : null;

  // Find the dock's wide-angle camera from capacity
  const dockCamera = dockCapacity?.cameras_list?.[0];
  const dockVideo =
    dockCamera?.videos_list?.find((v) => v.type === 'wide') ?? dockCamera?.videos_list?.[0];
  const dockCompositeId =
    dockSn && dockCamera && dockVideo ? `${dockSn}/${dockCamera.index}/${dockVideo.index}` : '';

  // Sync mediaStream → video element
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = mediaStream;
    if (mediaStream) el.play().catch(() => undefined);
  }, [mediaStream]);

  // Auto-start dock camera when online and capacity is available
  useEffect(() => {
    if (!dockCompositeId || !dockOnline || isStreaming || isStarting || streamUrl) return;
    startDockStream(
      { url: '', video_id: dockCompositeId, url_type: 4, video_quality: 0, video_type: 'wide' },
      {
        onSuccess: (data) => {
          const url = data?.url ?? '';
          if (!url) return;
          activeIdRef.current = dockCompositeId;
          setStreamUrl(url);
          setIsStreaming(true);
        },
        onError: (err) => {
          console.error('[DockMonitor] stream start failed:', err.message);
        },
      }
    );
  }, [dockCompositeId, dockOnline, isStreaming, isStarting, streamUrl, startDockStream]);

  // Stop stream when dock goes offline
  useEffect(() => {
    if (dockOnline || !activeIdRef.current) return;
    stopDockStream({
      url: '',
      video_id: activeIdRef.current,
      url_type: 4,
      video_quality: 0,
      video_type: 'wide',
    });
    activeIdRef.current = '';
    setStreamUrl('');
    setIsStreaming(false);
    setMediaStream(null);
    setStreamState(null);
  }, [dockOnline, stopDockStream]);

  const handleReconnect = useCallback(() => {
    if (activeIdRef.current) {
      stopDockStream({
        url: '',
        video_id: activeIdRef.current,
        url_type: 4,
        video_quality: 0,
        video_type: 'wide',
      });
      activeIdRef.current = '';
    }
    setStreamUrl('');
    setIsStreaming(false);
    setMediaStream(null);
    setStreamState(null);
  }, [stopDockStream]);

  const isDebugMode = dockModeCode === 2;

  const handleOpen = () => {
    if (!dockDevice || isPending) return;
    if (!isDebugMode) {
      toast.warning(
        'Debug Mode required — go to Command & Control → Debug Mode tab and enable it first.',
        { duration: 5000 }
      );
      return;
    }
    openCover(dockDevice.deviceSn, {
      onSuccess: () => {
        setIsDoorOpen(true);
        onCoverChange?.(true);
      },
      onError: (err) => toast.error(`Cover open failed: ${err.message}`),
    });
  };

  const handleClose = () => {
    if (!dockDevice || isPending) return;
    if (!isDebugMode) {
      toast.warning(
        'Debug Mode required — go to Command & Control → Debug Mode tab and enable it first.',
        { duration: 5000 }
      );
      return;
    }
    closeCover(dockDevice.deviceSn, {
      onSuccess: () => {
        setIsDoorOpen(false);
        onCoverChange?.(false);
      },
      onError: (err) => toast.error(`Cover close failed: ${err.message}`),
    });
  };

  return (
    <div
      className={`relative flex flex-col bg-card border border-border/50 rounded-lg overflow-hidden shadow-2xl${className ? ` ${className}` : ''}`}
      style={className ? undefined : { width: '301px', height: '336px' }}
    >
      {/* ── Camera viewport ───────────────────────────────────────────── */}
      <div className='relative flex-1 bg-background overflow-hidden'>
        {/* Video element always in DOM — opacity reveals it when playing */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            streamState === 'playing' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Dock offline */}
        {!dockOnline && (
          <div className='absolute inset-0 bg-background flex flex-col items-center justify-center gap-2'>
            <VideoOff size={28} className='text-zinc-700' strokeWidth={1.5} />
            <span className='text-[10px] font-logs text-zinc-700 uppercase tracking-widest'>
              Dock Offline
            </span>
            <div className='absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.015)_2px,rgba(255,255,255,0.015)_4px)] pointer-events-none' />
          </div>
        )}

        {/* Connecting / buffering */}
        {dockOnline && (isStarting || streamState === 'connecting') && (
          <div className='absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2'>
            <div className='w-6 h-6 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin' />
            <span className='text-[10px] font-logs text-zinc-500 uppercase tracking-widest'>
              Connecting…
            </span>
          </div>
        )}

        {/* Stream error */}
        {dockOnline && streamState === 'error' && (
          <div className='absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-2'>
            <AlertTriangle size={22} className='text-red-500' strokeWidth={1.5} />
            <span className='text-[10px] font-logs text-red-500 uppercase tracking-widest'>
              Stream Error
            </span>
            <button
              onClick={handleReconnect}
              className='flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-muted-foreground border border-zinc-600 rounded hover:bg-zinc-700 transition-colors'
            >
              <RefreshCw size={9} /> Reconnect
            </button>
          </div>
        )}

        {/* No feed / waiting for capacity */}
        {dockOnline && !streamUrl && !isStarting && !streamState && (
          <div className='absolute inset-0 bg-background flex flex-col items-center justify-center gap-2'>
            <VideoOff size={28} className='text-zinc-700' strokeWidth={1.5} />
            <span className='text-[10px] font-logs text-zinc-700 uppercase tracking-widest'>
              No Feed
            </span>
            <span className='text-[8px] font-logs text-zinc-800 uppercase tracking-wider'>
              CAM-02
            </span>
            <div className='absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.015)_2px,rgba(255,255,255,0.015)_4px)] pointer-events-none' />
          </div>
        )}

        {/* Live badge */}
        {streamState === 'playing' && (
          <div className='absolute top-3 right-[72px] flex items-center gap-1 px-1.5 py-0.5 bg-red-600/90 rounded'>
            <Radio size={8} className='text-white' />
            <span className='text-[8px] font-black text-white uppercase tracking-widest'>Live</span>
          </div>
        )}

        {/* Door state badge */}
        <div
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 border rounded transition-colors ${
            isDoorOpen
              ? 'bg-theme-accent/10 border-theme-accent/50 text-theme-accent'
              : 'bg-secondary/50 border-border text-muted-foreground'
          }`}
        >
          {isDoorOpen ? <DoorOpen size={12} /> : <DoorClosed size={12} />}
          <span className='text-[9px] font-black tracking-widest uppercase'>
            {isDoorOpen ? 'Door Open' : 'Door Closed'}
          </span>
        </div>

        {/* Online/offline badge */}
        <div className='absolute top-3 right-3 flex items-center gap-1.5'>
          {dockOnline ? (
            <Wifi size={12} className='text-emerald-400' />
          ) : (
            <WifiOff size={12} className='text-zinc-500' />
          )}
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${dockOnline ? 'text-emerald-400' : 'text-zinc-500'}`}
          >
            {dockOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Info overlay — bottom */}
        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <HardDrive size={11} className='text-zinc-400' />
              <span className='text-[10px] font-semibold text-foreground truncate max-w-[140px]'>
                {dockName}
              </span>
            </div>
            {droneInDock !== null && (
              <div className='flex items-center gap-1'>
                <Send size={10} className={droneInDock ? 'text-emerald-400' : 'text-blue-400'} />
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${droneInDock ? 'text-emerald-400' : 'text-blue-400'}`}
                >
                  {droneInDock ? 'Docked' : 'Airborne'}
                </span>
              </div>
            )}
          </div>
          <div className='flex items-center justify-between mt-0.5'>
            <span className='text-[8px] font-logs text-zinc-600 truncate max-w-[160px]'>
              {dockSn ? `SN: ${dockSn.slice(-8)}` : 'No dock linked'}
            </span>
            {firmware !== '—' && (
              <span className='text-[8px] font-logs text-zinc-600'>fw {firmware}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hardware controls ─────────────────────────────────────────── */}
      <div className='flex flex-col gap-2 p-2 bg-muted border-t border-border/50'>
        {!isDebugMode && (
          <p className='text-[9px] text-amber-400/70 font-logs text-center'>
            ⚠ Debug Mode required to control the cover
          </p>
        )}
        <div className='flex gap-2'>
          <button
            onClick={handleOpen}
            disabled={!dockOnline || isPending || isDoorOpen}
            className={`flex-1 py-2 text-xs font-bold rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isDoorOpen
                ? 'bg-theme-accent/20 border-theme-accent/50 text-theme-accent shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-secondary border-border text-white hover:text-muted-foreground hover:border-zinc-600'
            }`}
          >
            {isPending && isDoorOpen ? '…' : 'Open'}
          </button>
          <button
            onClick={handleClose}
            disabled={!dockOnline || isPending || !isDoorOpen}
            className={`flex-1 py-2 text-xs font-bold rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              !isDoorOpen
                ? 'bg-theme-accent/20 border-theme-accent/50 text-theme-accent shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-secondary border-border text-white hover:text-muted-foreground hover:border-zinc-600'
            }`}
          >
            {isPending && !isDoorOpen ? '…' : 'Close'}
          </button>
        </div>
      </div>

      {/* Headless WebRTC player — only mounts when we have a WHEP URL */}
      {isStreaming && streamUrl && (
        <WebRTCPlayer
          url={streamUrl}
          onStateChange={(state, errMsg) => {
            setStreamState(state);
            if (state === 'error') {
              console.error(`[DockMonitor] WebRTC error: ${errMsg}`);
              toast.error(`[Dock Camera] ${errMsg ?? 'Stream error'}`, { id: 'dock-stream-error' });
            }
          }}
          onMediaStream={setMediaStream}
        />
      )}
    </div>
  );
};

export default DockMonitor;
