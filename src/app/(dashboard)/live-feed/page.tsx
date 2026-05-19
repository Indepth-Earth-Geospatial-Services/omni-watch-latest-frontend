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
  Wifi,
  WifiOff,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { useProject } from '@/providers/ProjectProvider';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { StreamControlPanel } from '@/components/features/streams/StreamControlPanel';
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
                        <p className='text-[10px] font-mono text-zinc-500 truncate'>{d.device_sn}</p>
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
                      <button
                        key={device.deviceSn}
                        onClick={() => handleSelectDevice(device.deviceSn, true)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                          isActive
                            ? 'bg-[#1C93FF]/10 border-[#1C93FF]/30'
                            : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-700/60'
                        }`}
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
                        {device.status ? (
                          <Wifi size={10} className='text-emerald-400 flex-shrink-0' />
                        ) : (
                          <WifiOff size={10} className='text-zinc-700 flex-shrink-0' />
                        )}
                      </button>
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

            {/* Feed content */}
            <div className='flex-1 overflow-y-auto'>
              {viewMode === 'single' ? (
                selectedDevice ? (
                  <SingleFeedView
                    device={selectedDevice}
                    allDevices={projectDevices}
                    onSwitch={(sn) => handleSelectDevice(sn)}
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
}: {
  device: DJIDevice;
  allDevices: DJIDevice[];
  onSwitch: (sn: string) => void;
}) {
  const drone = isDrone(device);

  return (
    <div className='p-5 space-y-4'>
      {/* Device header + switcher */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
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

      {/* Video area */}
      <VideoArea device={device} large />

      {/* Controls */}
      <div className='bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-4'>
        <p className='text-[9px] font-black tracking-[0.16em] uppercase text-zinc-600 mb-3'>
          Stream Controls
        </p>
        {drone ? (
          <StreamControlPanel stream={toStream(device)} />
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
}: {
  devices: DJIDevice[];
  onExpand: (sn: string) => void;
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
          />
        ))}
      </div>
    </div>
  );
}

// ─── Feed card (multi-view) ───────────────────────────────────────────────────

function FeedCard({ device, onExpand }: { device: DJIDevice; onExpand: () => void }) {
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
      <VideoArea device={device} />

      {/* Controls */}
      <div className='px-3.5 py-3 border-t border-zinc-800/40'>
        {drone ? (
          <StreamControlPanel stream={toStream(device)} />
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

function VideoArea({ device, large = false }: { device: DJIDevice; large?: boolean }) {
  return (
    <div
      className={`relative bg-zinc-950 flex items-center justify-center ${
        large ? 'aspect-video w-full rounded-xl border border-zinc-800' : 'aspect-video'
      }`}
    >
      {device.status ? (
        <div className='flex flex-col items-center gap-2 text-center px-4'>
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
        <div className='flex flex-col items-center gap-2'>
          <WifiOff size={large ? 26 : 18} className='text-zinc-800' />
          <p className={`font-semibold text-zinc-700 ${large ? 'text-sm' : 'text-[11px]'}`}>
            Device Offline
          </p>
        </div>
      )}

      {device.status && (
        <div className='absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 bg-red-600/90 rounded-md'>
          <span className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
          <span className='text-[9px] font-black tracking-widest text-white uppercase'>Live</span>
        </div>
      )}
      <span className='absolute bottom-2 right-2.5 text-[9px] font-mono text-zinc-800 select-none'>
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
