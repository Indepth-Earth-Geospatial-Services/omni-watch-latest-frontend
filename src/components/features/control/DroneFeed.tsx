'use client';

import React, { useRef, useEffect } from 'react';
import { AlertTriangle, ChevronDown, Crosshair, Navigation, RefreshCw } from 'lucide-react';
import GimbalControls from './GimbalControls';
import { ManualFlightControls } from './ManualFlightControls';
import type { StreamState } from '@/components/features/streams/WebRTCPlayer';
import type { LiveCapacity } from '@/lib/types';
import type { DRCStatus } from '@/hooks/useDRC';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DroneFeedProps {
  devices: LiveCapacity[];
  videoTypes: string[];
  selectedSn: string;
  selectedVideoId: string;
  selectedVideoType: string;
  streamQuality: number;
  isStreaming: boolean;
  isStarting: boolean;
  isStopping: boolean;
  capacityLoading: boolean;
  activeStreamUrl: string;
  // Stream state lifted to Control so it survives panel swaps
  mediaStream: MediaStream | null;
  streamConnectState: StreamState | null;
  onReconnect: () => void;
  dockSn?: string;
  payloadIndex?: string;
  onDeviceChange: (sn: string) => void;
  onVideoTypeChange: (type: string) => void;
  onQualityChange: (quality: number) => void;
  onStart: () => void;
  onStop: () => void;
  latitude?: number;
  longitude?: number;
  className?: string;
  isMini?: boolean;
  // Manual flight — only rendered when not mini
  isManualActive?: boolean;
  drcStatus?: DRCStatus;
  sendJoystick?: (x: number, y: number, h: number, w: number) => boolean;
  onManualDeactivate?: () => void;
}

const QUALITY_LABELS: Record<string, string> = {
  '0': 'Auto',
  '1': 'Smooth',
  '2': 'SD',
  '3': 'HD',
  '4': 'Ultra HD',
};

const selectCls =
  'appearance-none w-full bg-[#16181D] border border-zinc-700/70 text-zinc-200 text-[11px] font-medium rounded-md pl-2.5 pr-7 py-1.5 cursor-pointer transition-colors hover:border-zinc-500 hover:bg-[#1E2127] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed';

// ─── Component ────────────────────────────────────────────────────────────────

const DroneFeed = ({
  devices,
  videoTypes,
  selectedSn,
  selectedVideoId,
  selectedVideoType,
  streamQuality,
  isStreaming,
  isStarting,
  isStopping,
  capacityLoading,
  activeStreamUrl,
  mediaStream,
  streamConnectState,
  onReconnect,
  dockSn,
  payloadIndex,
  onDeviceChange,
  onVideoTypeChange,
  onQualityChange,
  onStart,
  onStop,
  latitude,
  longitude,
  className,
  isMini = false,
  isManualActive = false,
  drcStatus = 'idle',
  sendJoystick,
  onManualDeactivate,
}: DroneFeedProps) => {
  const heading = 247;

  const fmtLat = (v?: number) => {
    if (v == null || v === 0) return '—';
    const dir = v >= 0 ? 'N' : 'S';
    return `${Math.abs(v).toFixed(5)}° ${dir}`;
  };
  const fmtLng = (v?: number) => {
    if (v == null || v === 0) return '—';
    const dir = v >= 0 ? 'E' : 'W';
    return `${Math.abs(v).toFixed(5)}° ${dir}`;
  };
  const canStart = !!selectedVideoId && !isStreaming;
  const canStop = !!selectedVideoId && isStreaming;

  const videoRef = useRef<HTMLVideoElement>(null);

  // Set srcObject and muted imperatively — React's `muted` JSX prop doesn't reliably
  // set the DOM property, blocking autoplay. Call play() after srcObject is assigned so
  // the browser starts rendering frames even when the element was previously display:none.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.srcObject = mediaStream;
    if (mediaStream) video.play().catch(() => {});
  }, [mediaStream]);

  return (
    <div
      className={`relative bg-[#0C0E12] overflow-hidden flex flex-col ${isMini ? '' : 'w-full'}${className ? ` ${className}` : ''}`}
      style={
        isMini
          ? { width: '301px', height: '342px', borderRadius: '8px' }
          : className
            ? undefined
            : { padding: '0px 0px', height: '633px' }
      }
    >
      {/* ── Stream Control Bar ─────────────────────────────────────────────── */}
      {!isMini && (
        <div className='flex items-center gap-2 py-2 flex-wrap'>
          {/* Device */}
          <div className='relative'>
            <select
              value={selectedSn}
              onChange={(e) => onDeviceChange(e.target.value)}
              disabled={capacityLoading || isStreaming}
              className={selectCls}
            >
              <option value=''>{capacityLoading ? 'Loading devices…' : 'Select device'}</option>
              {devices.map((d) => (
                <option key={d.sn} value={d.sn}>
                  {d.name || d.sn}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
            />
          </div>

          {/* Lens / video type */}
          {videoTypes.length > 0 && (
            <div className='relative'>
              <select
                value={selectedVideoType}
                onChange={(e) => onVideoTypeChange(e.target.value)}
                disabled={!selectedVideoId}
                className={selectCls}
              >
                {videoTypes
                  .filter((t) => t.toLowerCase() !== 'normal')
                  .map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={11}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
              />
            </div>
          )}

          {/* Quality */}
          <div className='relative'>
            <select
              value={streamQuality}
              onChange={(e) => onQualityChange(Number(e.target.value))}
              disabled={!selectedVideoId}
              className={selectCls}
            >
              {Object.entries(QUALITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
            />
          </div>

          {/* Start / Stop */}
          <button
            onClick={canStart ? onStart : onStop}
            disabled={(!canStart && !canStop) || isStarting || isStopping}
            className={`ml-auto px-4 py-1.5 text-[11px] font-bold rounded border transition-all disabled:opacity-40 ${
              isStreaming
                ? 'bg-red-600/20 border-red-500/60 text-red-400 hover:bg-red-600/30'
                : 'bg-emerald-600/20 border-emerald-500/60 text-emerald-400 hover:bg-emerald-600/30'
            }`}
          >
            {isStarting
              ? 'Starting…'
              : isStopping
                ? 'Stopping…'
                : isStreaming
                  ? 'Stop Stream'
                  : 'Start Stream'}
          </button>
        </div>
      )}

      {/* ── Primary Feed Area ──────────────────────────────────────────────── */}
      <div className='relative w-full flex-1 overflow-hidden bg-black border rounded-t-md border-zinc-800/90'>
        {/* Video element — srcObject set imperatively from lifted mediaStream prop */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${mediaStream ? 'block' : 'hidden'}`}
        />

        {/* Connecting spinner */}
        {activeStreamUrl && streamConnectState === 'connecting' && !mediaStream && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#050709]'>
            <div className='w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin' />
            <span className='text-[11px] font-medium text-zinc-500 tracking-wide'>Connecting…</span>
          </div>
        )}

        {/* Error state */}
        {streamConnectState === 'error' && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#050709]'>
            <AlertTriangle size={22} className='text-red-500' strokeWidth={1.5} />
            <span className='text-[11px] font-semibold text-red-400'>Stream connection lost</span>
            <button
              onClick={onReconnect}
              className='flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-zinc-300 border border-zinc-600 rounded hover:bg-zinc-700 transition-colors'
            >
              <RefreshCw size={9} /> Reconnect
            </button>
          </div>
        )}

        {/* No-stream placeholder */}
        {!activeStreamUrl && (
          <div className='absolute inset-0 bg-[#050709]'>
            <div className='absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.012)_2px,rgba(255,255,255,0.012)_4px)] pointer-events-none' />
          </div>
        )}

        {/* Streaming active overlay */}
        {isStreaming && <div className='absolute inset-0 border-x-1 pointer-events-none' />}

        {/* HUD: Crosshair */}
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='relative flex items-center justify-center'>
            <Crosshair className='text-emerald-500/50 w-16 h-16 stroke-[1px]' />
            <div className='absolute w-48 h-[1px] bg-emerald-500/20' />
            <div className='absolute h-24 w-[1px] bg-emerald-500/20' />
          </div>
        </div>

        {/* Manual flight controls — full viewport only, positions itself absolutely */}
        {!isMini && (
          <ManualFlightControls
            isActive={isManualActive}
            drcStatus={drcStatus}
            sendJoystick={sendJoystick ?? (() => false)}
            onDeactivate={onManualDeactivate ?? (() => {})}
          />
        )}

        {/* Compass inset */}
        <div
          className={`absolute rounded-full border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden ${
            isMini ? 'bottom-3 left-3 w-16 h-16' : 'bottom-6 left-6 w-20 h-20'
          }`}
        >
          <div
            className={`absolute inset-0 rounded-full border-[1px] border-white/5 ${isMini ? 'm-1' : 'm-2'}`}
          />
          <div
            className={`absolute inset-0 flex flex-col justify-between items-center font-bold text-white/40 pointer-events-none ${
              isMini ? 'p-1.5 text-[8px]' : 'p-3 text-[10px]'
            }`}
          >
            <span>N</span>
            <span>S</span>
          </div>
          <div
            className={`absolute inset-0 flex justify-between items-center font-bold text-white/40 pointer-events-none ${
              isMini ? 'p-1.5 text-[8px]' : 'p-3 text-[10px]'
            }`}
          >
            <span>W</span>
            <span>E</span>
          </div>
          <div
            className='relative transition-transform duration-700 ease-out'
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <div className='flex flex-col items-center'>
              <Navigation
                className='text-emerald-400 fill-emerald-400/20'
                size={isMini ? 14 : 18}
              />
              <div
                className={`absolute font-mono font-bold text-emerald-400 ${isMini ? '-top-4 text-[8px]' : '-top-6 text-[10px]'}`}
              >
                {heading}°
              </div>
            </div>
          </div>
          <div className='absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent animate-spin [animation-duration:4s]' />
        </div>

        {/* Bottom-right cluster: gimbal controls (full only) + stream HUD */}
        <div
          className={`absolute flex flex-col items-end ${
            isMini ? 'bottom-3 right-3 gap-1.5' : 'bottom-6 right-6 gap-2'
          }`}
        >
          {/* Gimbal controls — full viewport only, requires a dockSn to send commands */}
          {!isMini && dockSn && (
            <GimbalControls
              dockSn={dockSn}
              droneSn={selectedSn}
              payloadIndex={payloadIndex ?? '99-0-0'}
            />
          )}

          {/* Stream status HUD */}
          <div
            className={`flex flex-col items-end bg-white/5 backdrop-blur-md border border-white/10 rounded-md shadow-xl pointer-events-none ${
              isMini ? 'px-2 py-1 gap-0.5' : 'px-3 py-2 gap-1'
            }`}
          >
            <div className='flex items-center gap-2 mb-1'>
              <div
                className={`rounded-full ${isMini ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}
              />
              <span
                className={`font-bold uppercase tracking-widest ${isMini ? 'text-[7px]' : 'text-[8px]'} ${isStreaming ? 'text-emerald-500' : 'text-zinc-500'}`}
              >
                {isStreaming ? 'Stream Active' : 'Stream Idle'}
              </span>
            </div>
            <span
              className={`font-mono text-white/90 tracking-tighter leading-none ${isMini ? 'text-[8px]' : 'text-[10px]'}`}
            >
              Lat: {fmtLat(latitude)}
            </span>
            <span
              className={`font-mono text-white/90 tracking-tighter leading-none ${isMini ? 'text-[8px]' : 'text-[10px]'}`}
            >
              Lon: {fmtLng(longitude)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneFeed;
