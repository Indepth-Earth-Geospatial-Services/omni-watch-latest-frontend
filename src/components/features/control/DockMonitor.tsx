'use client';

import React, { useState } from 'react';
import { DoorOpen, DoorClosed, Wifi, WifiOff, HardDrive, Send, VideoOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { executeJob } from '@/services/djiservice-layer/dji-service';
import { toast } from 'sonner';
import type { DJIDevice } from '@/lib/types';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';

export interface DockMonitorProps {
  dockDevice?: DJIDevice;
  droneData?: ProcessedDroneData | null;
  className?: string;
}

const DockMonitor = ({ dockDevice, droneData, className }: DockMonitorProps) => {
  const [isDoorOpen, setIsDoorOpen] = useState(false);

  const { mutate: openCover, isPending: isOpening } = useMutation({
    mutationFn: (sn: string) => executeJob(sn, 'cover_open', { action: 0 }),
  });
  const { mutate: closeCover, isPending: isClosing } = useMutation({
    mutationFn: (sn: string) => executeJob(sn, 'cover_close', { action: 0 }),
  });
  const isPending = isOpening || isClosing;

  const dockOnline = dockDevice?.status ?? false;
  const dockName = dockDevice?.nickname || dockDevice?.deviceName || 'No Dock';
  const dockSn = dockDevice?.deviceSn ?? '—';
  const firmware = dockDevice?.firmwareVersion ?? '—';
  // modeCode 0 = standby / in dock; anything else = airborne
  const droneInDock = droneData ? droneData.modeCode === 0 : null;

  const handleOpen = () => {
    if (!dockDevice || isPending) return;
    openCover(dockDevice.deviceSn, {
      onSuccess: () => setIsDoorOpen(true),
      onError: (err) => toast.error(`Cover open failed: ${err.message}`),
    });
  };

  const handleClose = () => {
    if (!dockDevice || isPending) return;
    closeCover(dockDevice.deviceSn, {
      onSuccess: () => setIsDoorOpen(false),
      onError: (err) => toast.error(`Cover close failed: ${err.message}`),
    });
  };

  return (
    <div
      className={`relative flex flex-col bg-[#1A1C20] border border-zinc-800/50 rounded-lg overflow-hidden shadow-2xl${className ? ` ${className}` : ''}`}
      style={className ? undefined : { width: '301px', height: '336px' }}
    >
      {/* ── Camera viewport ───────────────────────────────────────────── */}
      <div className='relative flex-1 bg-black overflow-hidden'>
        <div className='absolute inset-0 bg-[#0A0C10] flex flex-col items-center justify-center gap-2'>
          <VideoOff size={28} className='text-zinc-700' strokeWidth={1.5} />
          <span className='text-[10px] font-mono text-zinc-700 uppercase tracking-widest'>
            No Feed
          </span>
          <span className='text-[8px] font-mono text-zinc-800 uppercase tracking-wider'>
            CAM-02
          </span>
          <div className='absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.015)_2px,rgba(255,255,255,0.015)_4px)] pointer-events-none' />
        </div>

        {/* Door state badge */}
        <div
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 border rounded transition-colors ${
            isDoorOpen
              ? 'bg-[#45F0CF1A] border-[#45F0CF80] text-[#45F0CF]'
              : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
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
              <span className='text-[10px] font-semibold text-zinc-200 truncate max-w-[140px]'>
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
            <span className='text-[8px] font-mono text-zinc-600 truncate max-w-[160px]'>
              {dockSn !== '—' ? `SN: ${dockSn.slice(-8)}` : 'No dock linked'}
            </span>
            {firmware !== '—' && (
              <span className='text-[8px] font-mono text-zinc-600'>fw {firmware}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hardware controls ─────────────────────────────────────────── */}
      <div className='flex gap-2 p-4 bg-[#333539E5] border-t border-zinc-800/50'>
        <button
          onClick={handleOpen}
          disabled={!dockOnline || isPending || isDoorOpen}
          className={`flex-1 py-2 text-xs font-bold rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed
            ${
              isDoorOpen
                ? 'bg-[#45F0CF33] border-[#45F0CF80] text-[#45F0CF] shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-[#1E2024] border-[#424754] text-white hover:text-zinc-300 hover:border-zinc-600'
            }`}
        >
          {isPending && isDoorOpen ? '…' : 'Open'}
        </button>
        <button
          onClick={handleClose}
          disabled={!dockOnline || isPending || !isDoorOpen}
          className={`flex-1 py-2 text-xs font-bold rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed
            ${
              !isDoorOpen
                ? 'bg-[#45F0CF33] border-[#45F0CF80] text-[#45F0CF] shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-[#1E2024] border-[#424754] text-white hover:text-zinc-300 hover:border-zinc-600'
            }`}
        >
          {isPending && !isDoorOpen ? '…' : 'Close'}
        </button>
      </div>
    </div>
  );
};

export default DockMonitor;
