'use client';

import React, { useCallback, useRef } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ChevronsDown,
} from 'lucide-react';
import { grabPayloadAuthority, gimbalLookAt, gimbalReset } from '@/services/djiservice-layer/dji-service';
import { useTelemetry } from '@/hooks/useTelemetry';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GimbalControlsProps {
  dockSn: string;
  droneSn: string;
  payloadIndex: string;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Target point placed this far in front of the drone (metres); small enough to
// avoid coord precision issues, large enough for smooth angular deltas.
const LOOK_DIST_M = 50;

// How much the look-at target shifts per 150 ms tick while a button is held.
const ALT_STEP_M = 3;       // metres/tick  →  ~18°/s pitch
const BEARING_STEP_DEG = 6; // degrees/tick →  ~40°/s yaw

const INTERVAL_MS = 150;

// ─── Button ───────────────────────────────────────────────────────────────────

interface DirButtonProps {
  icon: React.ReactNode;
  title: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

const DirButton = ({ icon, title, onHoldStart, onHoldEnd }: DirButtonProps) => (
  <button
    title={title}
    className='w-7 h-7 flex items-center justify-center rounded border border-white/10 bg-white/5 hover:bg-cyan-400/20 hover:border-cyan-400/30 active:bg-cyan-400/30 active:scale-90 text-white/50 hover:text-white/90 transition-all select-none touch-none'
    onMouseDown={onHoldStart}
    onMouseUp={onHoldEnd}
    onMouseLeave={onHoldEnd}
    onTouchStart={(e) => { e.preventDefault(); onHoldStart(); }}
    onTouchEnd={onHoldEnd}
    onTouchCancel={onHoldEnd}
  >
    {icon}
  </button>
);

// ─── GimbalControls ───────────────────────────────────────────────────────────

const GimbalControls = ({ dockSn, droneSn, payloadIndex, className }: GimbalControlsProps) => {
  const { getProcessedDroneData } = useTelemetry();

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const altOffsetRef   = useRef(0);   // metres accumulated since last reset
  const bearOffsetRef  = useRef(0);   // degrees accumulated since last reset

  const startMove = useCallback(
    (altStep: number, bearingStep: number) => {
      const idx = payloadIndex || '99-0-0';

      const tick = () => {
        altOffsetRef.current  += altStep;
        bearOffsetRef.current += bearingStep;

        const drone = getProcessedDroneData(droneSn);
        if (!drone || (drone.latitude === 0 && drone.longitude === 0)) return;

        const bearingDeg = ((drone.heading + bearOffsetRef.current) % 360 + 360) % 360;
        const bearingRad = bearingDeg * (Math.PI / 180);
        const latDelta   = (LOOK_DIST_M / 111111) * Math.cos(bearingRad);
        const lngDelta   = (LOOK_DIST_M / 111111) * Math.sin(bearingRad)
                           / Math.cos((drone.latitude * Math.PI) / 180);

        gimbalLookAt(
          dockSn,
          idx,
          drone.latitude  + latDelta,
          drone.longitude + lngDelta,
          drone.altitude  + altOffsetRef.current,
        ).catch(() => {});
      };

      // Grab payload authority once per hold, then fire the first tick immediately.
      grabPayloadAuthority(dockSn, idx).finally(() => {
        tick();
        intervalRef.current = setInterval(tick, INTERVAL_MS);
      });
    },
    [dockSn, droneSn, payloadIndex, getProcessedDroneData],
  );

  const stopMove = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleReset = useCallback(
    (resetMode: number) => {
      // Resets also zero out the accumulated offsets so the next hold starts fresh.
      altOffsetRef.current  = 0;
      bearOffsetRef.current = 0;
      gimbalReset(dockSn, payloadIndex || '99-0-0', resetMode).catch(() => {});
    },
    [dockSn, payloadIndex],
  );

  return (
    <div
      className={`flex flex-col items-center gap-1.5 bg-black/25 backdrop-blur-md border border-white/[0.07] rounded-xl px-2.5 py-2 shadow-2xl ${className ?? ''}`}
    >
      <span className='text-[7px] font-mono uppercase tracking-[0.2em] text-white/25 leading-none'>
        Gimbal
      </span>

      {/* D-pad */}
      <div className='grid grid-cols-3 gap-[3px]'>
        {/* Row 1 */}
        <div />
        <DirButton
          icon={<ChevronUp size={12} />}
          title='Tilt up'
          onHoldStart={() => startMove(ALT_STEP_M, 0)}
          onHoldEnd={stopMove}
        />
        <div />
        {/* Row 2 */}
        <DirButton
          icon={<ChevronLeft size={12} />}
          title='Pan left'
          onHoldStart={() => startMove(0, -BEARING_STEP_DEG)}
          onHoldEnd={stopMove}
        />
        <div className='w-7 h-7 flex items-center justify-center'>
          <div className='w-1.5 h-1.5 rounded-full bg-white/15' />
        </div>
        <DirButton
          icon={<ChevronRight size={12} />}
          title='Pan right'
          onHoldStart={() => startMove(0, BEARING_STEP_DEG)}
          onHoldEnd={stopMove}
        />
        {/* Row 3 */}
        <div />
        <DirButton
          icon={<ChevronDown size={12} />}
          title='Tilt down'
          onHoldStart={() => startMove(-ALT_STEP_M, 0)}
          onHoldEnd={stopMove}
        />
        <div />
      </div>

      {/* Action row: recenter + look-down */}
      <div className='flex gap-[3px]'>
        <button
          title='Recenter gimbal (level)'
          onClick={() => handleReset(0)}
          className='w-7 h-7 flex items-center justify-center rounded border border-white/10 bg-white/5 hover:bg-cyan-400/20 hover:border-cyan-400/30 active:scale-90 text-white/50 hover:text-white/90 transition-all select-none'
        >
          <RotateCcw size={10} />
        </button>
        <button
          title='Look straight down'
          onClick={() => handleReset(1)}
          className='w-7 h-7 flex items-center justify-center rounded border border-white/10 bg-white/5 hover:bg-cyan-400/20 hover:border-cyan-400/30 active:scale-90 text-white/50 hover:text-white/90 transition-all select-none'
        >
          <ChevronsDown size={10} />
        </button>
      </div>
    </div>
  );
};

export default GimbalControls;
