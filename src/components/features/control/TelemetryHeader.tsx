'use client';

import React from 'react';
import { BatteryMedium, DoorClosed, DoorOpen, Wind, Wifi } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function batteryColor(pct: number): string {
  if (pct > 50) return 'text-emerald-400';
  if (pct > 20) return 'text-amber-400';
  return 'text-red-400';
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
function degToCompass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Divider = () => <div className='w-px h-5 bg-border/60 flex-shrink-0' />;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TelemetryHeaderProps {
  workspaceName?: string;
  dockName?: string;
  dockOnline?: boolean;
  /** Dock's own power/battery % from OSD */
  dockBattery?: number;
  /** Wind speed in m/s from dock environment sensor */
  windSpeed?: number;
  /** Wind direction in degrees 0-360 from dock environment sensor */
  windDirection?: number;
  /** Physical cover/door state — undefined hides the badge entirely */
  coverOpen?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TelemetryHeader = ({
  workspaceName,
  dockName,
  dockOnline = false,
  dockBattery,
  windSpeed,
  windDirection,
  coverOpen,
}: TelemetryHeaderProps) => {
  // Only visible when dock is online
  if (!dockOnline) return null;

  const hasBattery = dockBattery != null && dockBattery >= 0;
  const hasWind = windSpeed != null && windSpeed > 0;

  return (
    <div className='flex items-center justify-between w-full h-14 px-6 bg-card border border-border/15 rounded-lg gap-4'>

      {/* ── Left: identity + stats ── */}
      <div className='flex items-center gap-5 flex-1 min-w-0'>

        {workspaceName && (
          <>
            <div className='flex items-center gap-1.5'>
              <span className='text-[10px] font-normal tracking-widest text-muted-foreground uppercase font-ui'>
                Workspace
              </span>
              <span className='text-xs font-semibold text-foreground font-ui'>
                {workspaceName}
              </span>
            </div>
            <Divider />
          </>
        )}

        {/* Dock name + online pill */}
        <div className='flex items-center gap-2 min-w-0'>
          <div className='flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex-shrink-0'>
            <Wifi size={10} />
            Online
          </div>
          <span className='text-sm font-bold text-foreground font-ui truncate'>
            {dockName ?? 'Dock'}
          </span>
        </div>

        <Divider />

        {/* Dock power */}
        <div className='flex items-center gap-1.5 flex-shrink-0'>
          <BatteryMedium
            size={14}
            className={hasBattery ? batteryColor(dockBattery!) : 'text-zinc-600'}
          />
          <span className='text-[10px] font-normal tracking-widest text-muted-foreground uppercase font-ui'>
            Dock Pwr
          </span>
          <span
            className={`text-xs font-bold font-ui ${
              hasBattery ? batteryColor(dockBattery!) : 'text-zinc-600'
            }`}
          >
            {hasBattery ? `${dockBattery}%` : '—'}
          </span>
        </div>

        {/* Wind — only shown when the dock is reporting environment data */}
        {hasWind && (
          <>
            <Divider />
            <div className='flex items-center gap-1.5 flex-shrink-0'>
              <Wind size={13} className='text-zinc-500' />
              <span className='text-[10px] font-normal tracking-widest text-muted-foreground uppercase font-ui'>
                Wind
              </span>
              <span className='text-xs font-semibold text-foreground font-ui'>
                {windSpeed!.toFixed(1)} m/s
              </span>
              {windDirection != null && (
                <span className='text-[10px] text-zinc-500 font-ui'>
                  {degToCompass(windDirection)}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right: cover / door status badge ── */}
      {coverOpen !== undefined && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors flex-shrink-0 ${
            coverOpen
              ? 'bg-theme-accent/10 border-theme-accent/50 text-theme-accent'
              : 'bg-secondary/50 border-border text-muted-foreground'
          }`}
        >
          {coverOpen ? <DoorOpen size={13} /> : <DoorClosed size={13} />}
          <span className='text-[10px] font-bold uppercase tracking-wider font-ui'>
            {coverOpen ? 'Cover Open' : 'Cover Closed'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TelemetryHeader;
