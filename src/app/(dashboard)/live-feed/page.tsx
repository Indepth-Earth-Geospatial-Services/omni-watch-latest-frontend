'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Box,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Maximize2,
  Monitor,
  PlaneTakeoff,
  Square,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { useProject } from '@/providers/ProjectProvider';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { StreamControlPanel } from '@/components/features/streams/StreamControlPanel';
import { WebRTCPlayer } from '@/components/features/streams/WebRTCPlayer';
import type { DJIDevice } from '@/lib/types';

export const dynamic = 'force-dynamic';

const isDrone = (device: DJIDevice) => device.domain === '0';

// Shape expected by StreamControlPanel
const toStream = (device: DJIDevice) => ({
  ...device,
  id: device.deviceSn,
  type: isDrone(device) ? 'DRONE' : 'DOCK',
  feedType: isDrone(device) ? 'DRONE' : 'DOCK',
  isOnline: device.status,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveFeedPage() {
  const router = useRouter();
  const { activeProject } = useProject();
  const { data: djiDevices = [], isLoading } = useDJIDevices();

  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [selectedSn, setSelectedSn] = useState<string | null>(null);
  // Maps device SN → active video_id when streaming; absent = not streaming
  const [streamingDevices, setStreamingDevices] = useState<Map<string, string>>(new Map());
  // Counter per SN — incrementing tells that device's StreamControlPanel to stop
  const [stopSignals, setStopSignals] = useState<Map<string, number>>(new Map());

  const projectSnSet = useMemo(
    () => new Set(activeProject?.devices.map((d) => d.device_sn) ?? []),
    [activeProject]
  );

  const projectDevices = useMemo(
    () => djiDevices.filter((d) => projectSnSet.has(d.deviceSn)),
    [djiDevices, projectSnSet]
  );

  const selectedDevice =
    projectDevices.find((d) => d.deviceSn === selectedSn) ?? projectDevices[0] ?? null;

  const onlineCount = projectDevices.filter((d) => d.status).length;

  const handleSelectDevice = (sn: string, switchToSingle = false) => {
    setSelectedSn(sn);
    if (switchToSingle) setViewMode('single');
  };

  const handleStreamingChange = (sn: string, isStreaming: boolean, videoId?: string) => {
    setStreamingDevices((prev) => {
      const next = new Map(prev);
      if (isStreaming && videoId) {
        next.set(sn, videoId);
      } else {
        next.delete(sn);
      }
      return next;
    });
  };

  const stopDevice = (sn: string) => {
    setStopSignals((prev) => new Map(prev).set(sn, (prev.get(sn) ?? 0) + 1));
  };

  const stopAll = () => {
    setStopSignals((prev) => {
      const next = new Map(prev);
      streamingDevices.forEach((_, sn) => next.set(sn, (next.get(sn) ?? 0) + 1));
      return next;
    });
  };

  // ── No active project (layout guard redirects, but show fallback just in case) ──
  if (!activeProject) {
    return (
      <div className='bg-background text-foreground min-h-screen'>
        <MainLayout title='Live Feeds' subtitle=''>
          <EmptyPage
            icon={<PlaneTakeoff className='w-8 h-8 text-zinc-600' />}
            title='No project open'
            body='Open a project from the Projects page to begin monitoring.'
            action={{ label: 'Go to Projects', onClick: () => router.push('/projects') }}
          />
        </MainLayout>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className='bg-background text-foreground min-h-screen'>
        <MainLayout title='Live Feeds' subtitle={activeProject.name}>
          <div className='flex flex-col items-center justify-center gap-3 py-24'>
            <Loader2 className='w-8 h-8 text-[#1C93FF] animate-spin' />
            <span className='text-sm text-zinc-500 font-poppins'>Loading devices…</span>
          </div>
        </MainLayout>
      </div>
    );
  }

  // ── No devices assigned ────────────────────────────────────────────────────
  if (activeProject.devices.length === 0) {
    return (
      <div className='bg-background text-foreground min-h-screen'>
        <MainLayout title='Live Feeds' subtitle={activeProject.name}>
          <EmptyPage
            icon={<PlaneTakeoff className='w-8 h-8 text-zinc-600' />}
            title='No devices assigned'
            body={
              <>
                Assign at least one device to{' '}
                <span className='text-zinc-300 font-semibold'>{activeProject.name}</span> to start
                monitoring live feeds.
              </>
            }
            action={{ label: 'Assign Devices', onClick: () => router.push('/projects') }}
          />
        </MainLayout>
      </div>
    );
  }

  return (
    <div className='bg-background text-foreground min-h-screen'>
      <MainLayout title='Live Feeds' subtitle={activeProject.name}>
        <div className='flex gap-4 h-[calc(100vh-13rem)] font-poppins'>
          {/* ── Device panel ─────────────────────────────────────────────── */}
          <aside className='w-60 flex-shrink-0 bg-[#0C0D10] border border-zinc-800 rounded-xl flex flex-col overflow-hidden'>
            {/* Panel header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0'>
              <p className='text-[9px] font-black tracking-[0.16em] uppercase text-zinc-600'>
                Devices
              </p>
              <div className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                <span className='text-[10px] font-semibold text-emerald-400'>{onlineCount}</span>
                <span className='text-[10px] text-zinc-700'>/ {projectDevices.length}</span>
              </div>
            </div>

            {/* Device list */}
            <div className='flex-1 overflow-y-auto p-2 space-y-1'>
              {projectDevices.length === 0
                ? activeProject.devices.map((d) => (
                    <div
                      key={d.id}
                      className='flex items-center gap-3 px-3 py-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40'
                    >
                      <div className='w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0'>
                        <PlaneTakeoff size={12} className='text-zinc-600' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-[10px] font-mono text-zinc-500 truncate'>
                          {d.device_sn}
                        </p>
                        <p className='text-[9px] text-zinc-700'>Not bound</p>
                      </div>
                    </div>
                  ))
                : projectDevices.map((device) => {
                    const drone = isDrone(device);
                    const isActive =
                      viewMode === 'single' &&
                      (selectedSn ?? projectDevices[0]?.deviceSn) === device.deviceSn;

                    return (
                      <div
                        key={device.deviceSn}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors group/row ${
                          isActive
                            ? 'bg-[#1C93FF]/10 border-[#1C93FF]/30'
                            : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-700/60'
                        }`}
                      >
                        {/* Click area — selects the device */}
                        <button
                          onClick={() => handleSelectDevice(device.deviceSn, true)}
                          className='flex items-center gap-2.5 flex-1 min-w-0 text-left'
                        >
                          <div
                            className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
                              drone
                                ? 'bg-blue-500/10 border-blue-500/20'
                                : 'bg-cyan-500/10 border-cyan-500/20'
                            }`}
                          >
                            {drone ? (
                              <Activity size={12} className='text-blue-400' />
                            ) : (
                              <Box size={12} className='text-cyan-400' />
                            )}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p
                              className={`text-xs font-bold truncate ${isActive ? 'text-[#1C93FF]' : 'text-zinc-300'}`}
                            >
                              {device.nickname || device.deviceName || device.deviceSn}
                            </p>
                            <p className='text-[9px] font-mono text-zinc-600 truncate'>
                              {device.deviceSn}
                            </p>
                          </div>
                        </button>

                        {/* Right-side indicators */}
                        <div className='flex items-center gap-1 flex-shrink-0'>
                          {streamingDevices.has(device.deviceSn) ? (
                            <>
                              {/* Streaming pulse dot */}
                              <span
                                className='w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse'
                                title='Streaming'
                              />
                              {/* Per-device stop button — visible on hover */}
                              <button
                                onClick={() => stopDevice(device.deviceSn)}
                                title='Stop stream'
                                className='p-1 rounded opacity-0 group-hover/row:opacity-100 text-red-400 hover:bg-red-500/20 transition-all'
                              >
                                <Square size={10} />
                              </button>
                            </>
                          ) : device.status ? (
                            <Wifi size={10} className='text-emerald-400' />
                          ) : (
                            <WifiOff size={10} className='text-zinc-700' />
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </aside>

          {/* ── Feed area ─────────────────────────────────────────────────── */}
          <div className='flex-1 flex flex-col bg-[#0C0D10] border border-zinc-800 rounded-xl overflow-hidden min-w-0'>
            {/* Feed toolbar */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0'>
              <p className='text-xs font-bold text-zinc-300'>
                {viewMode === 'single' && selectedDevice
                  ? selectedDevice.nickname || selectedDevice.deviceName || selectedDevice.deviceSn
                  : 'All Feeds'}
              </p>
              <div className='flex items-center gap-2'>
                {/* Stop / Stop All */}
                {viewMode === 'single' &&
                  selectedDevice &&
                  streamingDevices.has(selectedDevice.deviceSn) && (
                    <button
                      onClick={() => stopDevice(selectedDevice.deviceSn)}
                      className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'
                    >
                      <Square size={11} />
                      Stop
                    </button>
                  )}
                {viewMode === 'multi' && streamingDevices.size > 0 && (
                  <button
                    onClick={stopAll}
                    className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'
                  >
                    <Square size={11} />
                    Stop All
                    <span className='ml-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300'>
                      {streamingDevices.size}
                    </span>
                  </button>
                )}

                {/* View mode toggle */}
                <div className='flex items-center gap-0.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg'>
                  <button
                    onClick={() => setViewMode('single')}
                    title='Single feed'
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                      viewMode === 'single'
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Monitor size={11} />
                    Single
                  </button>
                  <button
                    onClick={() => setViewMode('multi')}
                    title='All feeds'
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                      viewMode === 'multi'
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <LayoutGrid size={11} />
                    All Feeds
                  </button>
                </div>
              </div>
            </div>

            {/* Feed content */}
            <div className={`flex-1 min-h-0 ${viewMode === 'multi' ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'}`}>
              {viewMode === 'single' ? (
                selectedDevice ? (
                  <SingleFeedView
                    device={selectedDevice}
                    allDevices={projectDevices}
                    onSwitch={(sn) => handleSelectDevice(sn)}
                    stopSignal={stopSignals.get(selectedDevice.deviceSn) ?? 0}
                    onStreamingChange={(s, vid) =>
                      handleStreamingChange(selectedDevice.deviceSn, s, vid)
                    }
                    videoId={streamingDevices.get(selectedDevice.deviceSn) ?? null}
                  />
                ) : (
                  <div className='flex flex-col items-center justify-center h-full gap-3 text-center'>
                    <PlaneTakeoff className='w-8 h-8 text-zinc-700' />
                    <p className='text-sm text-zinc-600'>Select a device from the panel.</p>
                  </div>
                )
              ) : (
                <MultiFeedView
                  devices={projectDevices}
                  onExpand={(sn) => handleSelectDevice(sn, true)}
                  stopSignals={stopSignals}
                  onStreamingChange={handleStreamingChange}
                  streamingDevices={streamingDevices}
                />
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}

// ─── Single feed view ─────────────────────────────────────────────────────────

function SingleFeedView({
  device,
  allDevices,
  onSwitch,
  stopSignal,
  onStreamingChange,
  videoId,
}: {
  device: DJIDevice;
  allDevices: DJIDevice[];
  onSwitch: (sn: string) => void;
  stopSignal: number;
  onStreamingChange: (isStreaming: boolean, videoId?: string) => void;
  videoId: string | null;
}) {
  const drone = isDrone(device);

  return (
    <div className='flex flex-col h-full p-5 gap-4'>
      {/* Device header + switcher */}
      <div className='flex items-center justify-between gap-4 flex-wrap flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              drone ? 'bg-blue-500/10 border-blue-500/20' : 'bg-cyan-500/10 border-cyan-500/20'
            }`}
          >
            {drone ? (
              <Activity size={15} className='text-blue-400' />
            ) : (
              <Box size={15} className='text-cyan-400' />
            )}
          </div>
          <div>
            <p className='text-sm font-bold text-zinc-100'>
              {device.nickname || device.deviceName || device.deviceSn}
            </p>
            <p className='text-[10px] font-mono text-zinc-600'>{device.deviceSn}</p>
          </div>
          <span
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              device.status
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-zinc-600 bg-zinc-800/60 border-zinc-700/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${device.status ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}
            />
            {device.status ? 'Online' : 'Offline'}
          </span>
        </div>

        {allDevices.length > 1 && (
          <div className='flex items-center gap-1 flex-wrap'>
            <span className='text-[10px] text-zinc-600 mr-0.5'>Switch:</span>
            {allDevices.map((d) => (
              <button
                key={d.deviceSn}
                onClick={() => onSwitch(d.deviceSn)}
                title={d.nickname || d.deviceName || d.deviceSn}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  device.deviceSn === d.deviceSn
                    ? 'bg-[#1C93FF] border-[#1C93FF] text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {d.nickname || d.deviceSn.slice(-6)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video area — fills remaining height */}
      <div className='flex-1 min-h-0'>
        <VideoArea device={device} streamUrl={videoId} large />
      </div>

      {/* Controls */}
      <div className='flex-shrink-0 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-4'>
        <p className='text-[9px] font-black tracking-[0.16em] uppercase text-zinc-600 mb-3'>
          Stream Controls
        </p>
        {drone ? (
          <StreamControlPanel
            stream={toStream(device)}
            externalStopSignal={stopSignal}
            onStreamingChange={onStreamingChange}
          />
        ) : (
          <p className='text-xs text-zinc-600 italic'>
            Live streaming is only available for drone-type devices.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Multi feed grid ──────────────────────────────────────────────────────────

function MultiFeedView({
  devices,
  onExpand,
  stopSignals,
  onStreamingChange,
  streamingDevices,
}: {
  devices: DJIDevice[];
  onExpand: (sn: string) => void;
  stopSignals: Map<string, number>;
  onStreamingChange: (sn: string, isStreaming: boolean, videoId?: string) => void;
  streamingDevices: Map<string, string>;
}) {
  if (devices.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-3 py-16 text-center'>
        <PlaneTakeoff className='w-8 h-8 text-zinc-700' />
        <p className='text-sm text-zinc-600'>
          Devices are assigned but not yet bound to the DJI workspace.
        </p>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
        {devices.map((device) => (
          <FeedCard
            key={device.deviceSn}
            device={device}
            onExpand={() => onExpand(device.deviceSn)}
            stopSignal={stopSignals.get(device.deviceSn) ?? 0}
            onStreamingChange={(s, vid) => onStreamingChange(device.deviceSn, s, vid)}
            videoId={streamingDevices.get(device.deviceSn) ?? null}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Feed card (multi-view) ───────────────────────────────────────────────────

function FeedCard({
  device,
  onExpand,
  stopSignal,
  onStreamingChange,
  videoId,
}: {
  device: DJIDevice;
  onExpand: () => void;
  stopSignal: number;
  onStreamingChange: (isStreaming: boolean, videoId?: string) => void;
  videoId: string | null;
}) {
  const drone = isDrone(device);

  return (
    <div
      className={`flex flex-col bg-zinc-900/40 border rounded-xl overflow-hidden transition-colors ${
        device.status ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/40'
      }`}
    >
      {/* Card header */}
      <div className='flex items-center justify-between px-3.5 py-3 border-b border-zinc-800/60'>
        <div className='flex items-center gap-2 min-w-0'>
          <div
            className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 ${
              drone ? 'bg-blue-500/10 border-blue-500/20' : 'bg-cyan-500/10 border-cyan-500/20'
            }`}
          >
            {drone ? (
              <Activity size={11} className='text-blue-400' />
            ) : (
              <Box size={11} className='text-cyan-400' />
            )}
          </div>
          <div className='min-w-0'>
            <p className='text-xs font-bold text-zinc-200 truncate'>
              {device.nickname || device.deviceName || device.deviceSn}
            </p>
            <p className='text-[9px] font-mono text-zinc-600 truncate'>{device.deviceSn}</p>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
              device.status
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-zinc-600 bg-zinc-800/50 border-zinc-700/50'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${device.status ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}
            />
            {device.status ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={onExpand}
            title='Expand to single feed'
            className='p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors'
          >
            <Maximize2 size={11} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <VideoArea device={device} streamUrl={videoId} />

      {/* Controls */}
      <div className='px-3.5 py-3 border-t border-zinc-800/40'>
        {drone ? (
          <StreamControlPanel
            stream={toStream(device)}
            externalStopSignal={stopSignal}
            onStreamingChange={onStreamingChange}
          />
        ) : (
          <p className='text-[10px] text-zinc-700 italic text-center py-0.5'>
            Streaming not available for docks
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Video placeholder ────────────────────────────────────────────────────────

function VideoArea({
  device,
  streamUrl = null,
  large = false,
}: {
  device: DJIDevice;
  streamUrl?: string | null;
  large?: boolean;
}) {
  const containerCls = `relative bg-zinc-950 overflow-hidden ${
    large ? 'h-full w-full rounded-xl border border-zinc-800' : 'aspect-video'
  }`;

  return (
    <div className={containerCls}>
      {streamUrl ? (
        /* Active stream — WHEP URL returned by the API */
        <WebRTCPlayer url={streamUrl} className='absolute inset-0 w-full h-full' />
      ) : device.status ? (
        /* Online but not yet streaming */
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4'>
          <div className='w-9 h-9 rounded-xl bg-[#1C93FF]/10 border border-[#1C93FF]/20 flex items-center justify-center'>
            <Activity size={large ? 20 : 15} className='text-[#1C93FF]/60' />
          </div>
          <p className={`font-bold text-zinc-500 ${large ? 'text-sm' : 'text-[11px]'}`}>
            Stream Ready
          </p>
          {large && (
            <p className='text-[11px] text-zinc-700'>Use the controls below to start streaming</p>
          )}
        </div>
      ) : (
        /* Device offline */
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2'>
          <WifiOff size={large ? 26 : 18} className='text-zinc-800' />
          <p className={`font-semibold text-zinc-700 ${large ? 'text-sm' : 'text-[11px]'}`}>
            Device Offline
          </p>
        </div>
      )}

      {/* LIVE badge — only shown while the WebRTC player is active */}
      {streamUrl && (
        <div className='absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 bg-red-600/90 rounded-md z-10'>
          <span className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
          <span className='text-[9px] font-black tracking-widest text-white uppercase'>Live</span>
        </div>
      )}

      <span className='absolute bottom-2 right-2.5 text-[9px] font-mono text-zinc-800 select-none z-10'>
        {device.deviceSn}
      </span>
    </div>
  );
}

// ─── Generic empty state ──────────────────────────────────────────────────────

function EmptyPage({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 py-24 text-center font-poppins'>
      <div className='w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center'>
        {icon}
      </div>
      <div className='max-w-xs'>
        <h2 className='text-base font-bold text-zinc-200'>{title}</h2>
        <p className='text-sm text-zinc-500 mt-1.5 leading-relaxed'>{body}</p>
      </div>
      <button
        onClick={action.onClick}
        className='flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-bold rounded-xl transition-colors'
      >
        <ChevronRight size={13} />
        {action.label}
      </button>
    </div>
  );
}
