'use client';

import React, { useState } from 'react';
import { Pause, AlertTriangle, Home, Play, Loader2, PauseCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  executeJob,
  cancelFlyToPoint,
  cancelTakeoffToPoint,
} from '@/services/djiservice-layer/dji-service';

export interface FlightControlActionsProps {
  dockSn?: string;
  isFlying?: boolean;
  dockOnline?: boolean;
}

const FlightControlActions = ({
  dockSn = '',
  isFlying = false,
  dockOnline = false,
}: FlightControlActionsProps) => {
  const [isPaused, setIsPaused] = useState(false);

  const canAct = !!dockSn && isFlying && dockOnline;

  // ── Wayline pause / resume (action 0 = pause, 1 = resume) ────────────────
  const { mutate: execWayline, isPending: isWaylinePending } = useMutation({
    mutationFn: ({ sn, action }: { sn: string; action: number }) =>
      executeJob(sn, 'wayline', { action }),
    onSuccess: (_data, vars) => {
      const resumed = vars.action === 1;
      setIsPaused(!resumed);
      toast.success(resumed ? 'Mission resumed' : 'Mission paused');
    },
    onError: (err: Error) => toast.error(`Wayline command failed: ${err.message}`),
  });

  // ── Hover — cancel fly-to-point, drone holds position ────────────────────
  const { mutate: doHover, isPending: isHoverPending } = useMutation({
    mutationFn: (sn: string) => cancelFlyToPoint(sn),
    onSuccess: () => toast.success('Drone holding position'),
    onError: (err: Error) => toast.error(`Hover failed: ${err.message}`),
  });

  // ── Land — stop all active missions then return to dock ───────────────────
  const { mutate: doLand, isPending: isLandPending } = useMutation({
    mutationFn: async (sn: string) => {
      // Cancel fly-to and takeoff missions first, then issue RTH
      await Promise.allSettled([cancelFlyToPoint(sn), cancelTakeoffToPoint(sn)]);
      await executeJob(sn, 'return_home');
    },
    onSuccess: () => {
      setIsPaused(false);
      toast.success('Returning to dock to land');
    },
    onError: (err: Error) => toast.error(`Land command failed: ${err.message}`),
  });

  // ── RTH — explicit return-to-home ─────────────────────────────────────────
  const { mutate: doRTH, isPending: isRthPending } = useMutation({
    mutationFn: (sn: string) => executeJob(sn, 'return_home'),
    onSuccess: () => {
      setIsPaused(false);
      toast.success('Return to home initiated');
    },
    onError: (err: Error) => toast.error(`RTH failed: ${err.message}`),
  });

  const isAnyPending = isWaylinePending || isHoverPending || isLandPending || isRthPending;

  const handlePauseResume = () => {
    if (!canAct || isAnyPending) return;
    execWayline({ sn: dockSn, action: isPaused ? 1 : 0 });
  };

  const handleHover = () => {
    if (!canAct || isAnyPending) return;
    doHover(dockSn);
  };

  const handleLand = () => {
    if (!canAct || isAnyPending) return;
    doLand(dockSn);
  };

  const handleRTH = () => {
    if (!canAct || isAnyPending) return;
    doRTH(dockSn);
  };

  const ActiveGlow = ({ colorClass }: { colorClass: string }) => (
    <div
      className={`absolute inset-0 rounded-md z-0 pointer-events-none animate-active-glow ring-2 ${colorClass}`}
    />
  );

  return (
    <div
      className='flex items-center gap-[8px] bg-[#333539E5] border-t border-[#42475426] w-full p-4 rounded-b-lg'
      style={{ height: '65px' }}
    >
      {/* ── Pause / Resume ──────────────────────────────────────────── */}
      <div className='relative flex-1 h-full'>
        {isPaused && canAct && (
          <ActiveGlow colorClass='ring-zinc-400/30 shadow-[0_0_15px_rgba(161,161,170,0.2)]' />
        )}
        <button
          onClick={handlePauseResume}
          disabled={!canAct || isAnyPending}
          title={!canAct ? 'No active flight' : isPaused ? 'Resume mission' : 'Pause mission'}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            ${
              isPaused && canAct
                ? 'bg-[#1E2024] text-white border-zinc-400 shadow-inner'
                : 'bg-[#1E2024]/60 border-zinc-700/50 text-white hover:text-zinc-300 hover:border-zinc-600'
            }`}
        >
          {isWaylinePending ? (
            <Loader2 size={15} className='animate-spin' />
          ) : isPaused ? (
            <Play size={15} fill='white' />
          ) : (
            <Pause size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>
            {isPaused ? 'Resume' : 'Pause'}
          </span>
        </button>
      </div>

      {/* ── Hover ───────────────────────────────────────────────────── */}
      <div className='relative flex-1 h-full'>
        <button
          onClick={handleHover}
          disabled={!canAct || isAnyPending}
          title={!canAct ? 'No active flight' : 'Cancel fly-to and hold position'}
          className='relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            bg-amber-950/40 border-amber-900/50 text-amber-500/70 hover:bg-amber-900/40 hover:border-amber-400 hover:text-amber-300'
        >
          {isHoverPending ? (
            <Loader2 size={15} className='animate-spin text-amber-400' />
          ) : (
            <PauseCircle size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>Hover</span>
        </button>
      </div>

      {/* ── Land ────────────────────────────────────────────────────── */}
      <div className='relative flex-1 h-full'>
        {isLandPending && (
          <ActiveGlow colorClass='ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]' />
        )}
        <button
          onClick={handleLand}
          disabled={!canAct || isAnyPending}
          title={!canAct ? 'No active flight' : 'Stop all missions and return to dock'}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            ${
              isLandPending
                ? 'bg-red-600 text-white border-red-400 scale-[0.98]'
                : 'bg-red-950/40 border-red-900/50 text-red-500/70 hover:bg-red-900/40 hover:text-red-400'
            }`}
        >
          {isLandPending ? (
            <Loader2 size={15} className='animate-spin' />
          ) : (
            <AlertTriangle size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-black tracking-[0.15em] uppercase'>
            {isLandPending ? 'Landing…' : 'Land'}
          </span>
        </button>
      </div>

      {/* ── Return to Home ──────────────────────────────────────────── */}
      <div className='relative flex-1 h-full'>
        {isRthPending && (
          <ActiveGlow colorClass='ring-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]' />
        )}
        <button
          onClick={handleRTH}
          disabled={!canAct || isAnyPending}
          title={!canAct ? 'No active flight' : 'Return drone to dock'}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            ${
              isRthPending
                ? 'bg-indigo-600 text-white border-indigo-400 scale-[0.98]'
                : 'bg-indigo-950/40 border-indigo-900/50 text-indigo-500/70 hover:bg-indigo-900/40 hover:border-indigo-400 hover:text-indigo-300'
            }`}
        >
          {isRthPending ? (
            <Loader2 size={15} className='animate-spin text-indigo-200' />
          ) : (
            <Home size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>
            {isRthPending ? 'Returning…' : 'RTH'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FlightControlActions;
