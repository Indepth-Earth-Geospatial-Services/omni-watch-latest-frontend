'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Crosshair, Navigation, VideoOff } from 'lucide-react';
import SensorToolbar from './SensorToolBar';
import FlightControlActions from './FlightControlActions';
import { WebRTCPlayer } from '@/components/features/streams/WebRTCPlayer';
import type { StreamState } from '@/components/features/streams/WebRTCPlayer';
import type { LiveCapacity, CameraCapacity, VideoCapacity } from '@/lib/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MissionControlViewportProps {
  devices: LiveCapacity[];
  cameras: CameraCapacity[];
  videos: VideoCapacity[];
  videoTypes: string[];
  selectedSn: string;
  selectedCameraId: string;
  selectedVideoId: string;
  selectedVideoType: string;
  streamQuality: number;
  isStreaming: boolean;
  isStarting: boolean;
  isStopping: boolean;
  capacityLoading: boolean;
  isFlying: boolean;
  activeStreamUrl: string;
  onDeviceChange: (sn: string) => void;
  onCameraChange: (cameraId: string) => void;
  onVideoChange: (videoId: string) => void;
  onVideoTypeChange: (type: string) => void;
  onQualityChange: (quality: number) => void;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

const QUALITY_LABELS: Record<string, string> = {
  '0': 'Auto',
  '1': 'Smooth',
  '2': 'SD',
  '3': 'HD',
  '4': 'Ultra HD',
};

const selectCls =
  'bg-[#1A1C20] border border-zinc-700 text-zinc-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40';

// ─── Component ────────────────────────────────────────────────────────────────

const MissionControlViewport = ({
  devices,
  cameras,
  videos,
  videoTypes,
  selectedSn,
  selectedCameraId,
  selectedVideoId,
  selectedVideoType,
  streamQuality,
  isStreaming,
  isStarting,
  isStopping,
  capacityLoading,
  isFlying,
  activeStreamUrl,
  onDeviceChange,
  onCameraChange,
  onVideoChange,
  onVideoTypeChange,
  onQualityChange,
  onStart,
  onStop,
  className,
}: MissionControlViewportProps) => {
  const heading = 247;
  const canStart = !!selectedVideoId && !isStreaming;
  const canStop = !!selectedVideoId && isStreaming;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [streamConnectState, setStreamConnectState] = useState<StreamState | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  // Reset player state when stream URL is cleared
  useEffect(() => {
    if (!activeStreamUrl) {
      setMediaStream(null);
      setStreamConnectState(null);
    }
  }, [activeStreamUrl]);

  return (
    <div
      className={`relative bg-[#0C0E12] overflow-hidden flex flex-col w-full mb-2${className ? ` ${className}` : ''}`}
      style={className ? undefined : { padding: '0px 0px', height: '700px' }}
    >
      {/* <SensorToolbar
        selectedVideoType={selectedVideoType}
        onVideoTypeChange={onVideoTypeChange}
        isStreaming={isStreaming}
      /> */}

      {/* ── Stream Control Bar ─────────────────────────────────────────────── */}
      <div className='flex items-center gap-2 px-3 py-2 bg-[#12151C] border-b border-zinc-800/60 flex-wrap'>
        {/* Device */}
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

        {/* Camera */}
        <select
          value={selectedCameraId}
          onChange={(e) => onCameraChange(e.target.value)}
          disabled={!selectedSn || isStreaming}
          className={selectCls}
        >
          <option value=''>Camera</option>
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.index}
            </option>
          ))}
        </select>

        {/* Video source */}
        <select
          value={selectedVideoId}
          onChange={(e) => onVideoChange(e.target.value)}
          disabled={!selectedCameraId || isStreaming}
          className={selectCls}
        >
          <option value=''>Video</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.type || v.index}
            </option>
          ))}
        </select>

        {/* Lens / video type */}
        {videoTypes.length > 0 && (
          <select
            value={selectedVideoType}
            onChange={(e) => onVideoTypeChange(e.target.value)}
            disabled={!selectedVideoId}
            className={selectCls}
          >
            {videoTypes.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        )}

        {/* Quality */}
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

      {/* ── Primary Feed Area ──────────────────────────────────────────────── */}
      <div className='relative w-full flex-1 rounded-t-lg overflow-hidden bg-black'>
        {/* WebRTC player — headless, mounts only while a stream URL is active */}
        {activeStreamUrl && (
          <WebRTCPlayer
            url={activeStreamUrl}
            onStateChange={(state) => setStreamConnectState(state)}
            onMediaStream={setMediaStream}
          />
        )}

        {/* Video element — hidden until track arrives */}
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
            <VideoOff size={26} className='text-red-500/60' />
            <span className='text-[11px] font-semibold text-red-400'>Stream connection lost</span>
          </div>
        )}

        {/* No-stream placeholder */}
        {!activeStreamUrl && (
          <div className='absolute inset-0 bg-[#050709]'>
            <div className='absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.012)_2px,rgba(255,255,255,0.012)_4px)] pointer-events-none' />
          </div>
        )}

        {/* Streaming active overlay */}
        {isStreaming && (
          <div className='absolute inset-0 border-2 border-emerald-500/40 pointer-events-none' />
        )}

        {/* HUD: Crosshair */}
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='relative flex items-center justify-center'>
            <Crosshair className='text-emerald-500/50 w-16 h-16 stroke-[1px]' />
            <div className='absolute w-48 h-[1px] bg-emerald-500/20' />
            <div className='absolute h-24 w-[1px] bg-emerald-500/20' />
          </div>
        </div>

        {/* Compass inset */}
        <div className='absolute bottom-6 left-6 w-40 h-40 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden'>
          <div className='absolute inset-0 rounded-full border-[1px] border-white/5 m-2' />
          <div className='absolute inset-0 p-3 flex flex-col justify-between items-center text-[10px] font-bold text-white/40 pointer-events-none'>
            <span>N</span>
            <span>S</span>
          </div>
          <div className='absolute inset-0 p-3 flex justify-between items-center text-[10px] font-bold text-white/40 pointer-events-none'>
            <span>W</span>
            <span>E</span>
          </div>
          <div
            className='relative transition-transform duration-700 ease-out'
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <div className='flex flex-col items-center'>
              <Navigation className='text-emerald-400 fill-emerald-400/20' size={24} />
              <div className='absolute -top-6 text-[10px] font-mono font-bold text-emerald-400'>
                {heading}°
              </div>
            </div>
          </div>
          <div className='absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent animate-spin [animation-duration:4s]' />
        </div>

        {/* HUD: Stream status (bottom right) */}
        <div className='absolute bottom-6 right-6 flex flex-col items-end gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2 rounded-md shadow-xl pointer-events-none'>
          <div className='flex items-center gap-2 mb-1'>
            <div
              className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}
            />
            <span
              className={`text-[8px] font-bold uppercase tracking-widest ${isStreaming ? 'text-emerald-500' : 'text-zinc-500'}`}
            >
              {isStreaming ? 'Stream Active' : 'Stream Idle'}
            </span>
          </div>
          {selectedSn && (
            <span className='text-[10px] font-mono text-white/70 tracking-tighter'>
              {selectedSn}
            </span>
          )}
          <span className='text-[10px] font-mono text-white/90 tracking-tighter leading-none'>
            Lat: 6.5244° N
          </span>
          <span className='text-[10px] font-mono text-white/90 tracking-tighter leading-none'>
            Lon: 3.3792° E
          </span>
        </div>
      </div>

      <FlightControlActions selectedSn={selectedSn} isFlying={isFlying} />
    </div>
  );
};

export default MissionControlViewport;
