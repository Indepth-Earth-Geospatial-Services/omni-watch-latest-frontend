'use client';

import React from 'react';
import { BatteryMedium, Camera, Wifi, WifiOff } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFlightTime(secs: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}
function batteryColor(pct: number): string {
  if (pct > 50) return 'text-emerald-400';
  if (pct > 20) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Divider = () => (
  <div className='w-px h-5 bg-zinc-700/60 flex-shrink-0' />
);

interface StatProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  valueClassName?: string;
}
const Stat = ({ label, value, icon: Icon, valueClassName = 'text-[#E2E2E8]' }: StatProps) => (
  <div className='flex items-center gap-1.5'>
    {Icon && <Icon size={13} className='text-zinc-500 flex-shrink-0' />}
    <span className='text-[10px] font-normal tracking-widest text-[#8C90A0] uppercase font-poppins'>
      {label}
    </span>
    <span className={`text-xs font-semibold font-poppins ${valueClassName}`}>
      {value}
    </span>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TelemetryHeaderProps {
  workspaceName?: string;
  dockName?: string;
  dockOnline?: boolean;
  /** Drone battery % (0-100) from drone OSD */
  droneBattery?: number;
  /** Remaining flight time in seconds from drone OSD */
  remainFlightTime?: number;
  /** Camera name from stream capacity */
  cameraName?: string;
  isStreaming?: boolean;
  elapsedTime?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TelemetryHeader = ({
  workspaceName,
  dockName,
  dockOnline = false,
  droneBattery,
  remainFlightTime,
  cameraName,
  isStreaming = false,
  elapsedTime = '00:00:00',
}: TelemetryHeaderProps) => {
  const hasBattery = droneBattery != null && droneBattery > 0;

  return (
    <div className='flex items-center justify-between w-full h-14 px-6 bg-[#1A1C20] border border-[#42475426]/15 rounded-lg gap-4'>

      {/* ── Left: Dock identity & status ── */}
      <div className='flex items-center gap-5 flex-1 min-w-0'>
        {workspaceName && (
          <>
            <Stat label='Workspace' value={workspaceName} />
            <Divider />
          </>
        )}

        {/* Dock name + online badge */}
        <div className='flex items-center gap-2 min-w-0'>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
            dockOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'
          }`}>
            {dockOnline
              ? <Wifi size={10} />
              : <WifiOff size={10} />
            }
            {dockOnline ? 'Online' : 'Offline'}
          </div>
          <span className='text-sm font-bold text-[#E2E2E8] font-poppins truncate'>
            {dockName ?? 'No Dock Selected'}
          </span>
        </div>

        <Divider />

        {/* Drone battery */}
        <div className='flex items-center gap-1.5 flex-shrink-0'>
          <BatteryMedium size={14} className={hasBattery ? batteryColor(droneBattery!) : 'text-zinc-600'} />
          <span className='text-[10px] font-normal tracking-widest text-[#8C90A0] uppercase font-poppins'>
            UAV Battery
          </span>
          <span className={`text-xs font-bold font-poppins ${hasBattery ? batteryColor(droneBattery!) : 'text-zinc-600'}`}>
            {hasBattery ? `${droneBattery}%` : '—'}
          </span>
          {remainFlightTime != null && remainFlightTime > 0 && (
            <span className='text-[10px] text-zinc-600 font-poppins'>
              ({formatFlightTime(remainFlightTime)})
            </span>
          )}
        </div>

        <Divider />

        {/* Dock camera */}
        <div className='flex items-center gap-1.5 flex-shrink-0'>
          <Camera size={13} className='text-zinc-500' />
          <span className='text-[10px] font-normal tracking-widest text-[#8C90A0] uppercase font-poppins'>
            Camera
          </span>
          <span className='text-xs font-semibold text-[#E2E2E8] font-poppins'>
            {cameraName ?? '—'}
          </span>
        </div>
      </div>

      {/* ── Right: Environmental + stream status ── */}
      <div className='flex items-center gap-5 flex-shrink-0'>
        {/* Elapsed stream time */}
        <div className='flex items-center gap-1.5'>
          <span className='text-[10px] font-normal font-poppins tracking-widest text-[#8C90A0] uppercase'>
            Elapsed
          </span>
          <span className='text-sm font-semibold font-poppins text-[#45F0CF]'>
            {isStreaming ? elapsedTime : '—'}
          </span>
        </div>

        <Divider />

        {/* Live indicator */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded border transition-colors ${
          isStreaming
            ? 'bg-[#FF0000]/10 border-[#FF0000]/30'
            : 'bg-zinc-800/50 border-zinc-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isStreaming
              ? 'bg-[#FF0000] animate-pulse shadow-[0px_0px_8px_0px_#FF000080]'
              : 'bg-zinc-600'
          }`} />
          <span className={`text-[10px] font-bold font-poppins tracking-widest uppercase ${
            isStreaming ? 'text-[#FF0000]' : 'text-zinc-500'
          }`}>
            {isStreaming ? 'Live' : 'Standby'}
          </span>
        </div>
      </div>

    </div>
  );
};

export default TelemetryHeader;
