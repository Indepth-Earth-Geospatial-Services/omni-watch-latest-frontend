'use client';

import React, { useState } from 'react';
import { Pause, AlertTriangle, Home, Play, Loader2, PauseCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { executeJob, cancelFlyToPoint } from '@/services/djiservice-layer/dji-service';

export interface FlightControlActionsProps {
  dockSn?: string;
  isFlying?: boolean;
  dockOnline?: boolean;
}

const FlightControlActions = ({ dockSn = '', isFlying = false, dockOnline = false }: FlightControlActionsProps) => {
  const [isPaused, setIsPaused] = useState(false);

  const canAct = !!dockSn && isFlying && dockOnline;

  // Pause / resume an active wayline mission (action 0 = pause, 1 = resume)
  const { mutate: execJob, isPending: isExecPending } = useMutation({
    mutationFn: ({ sn, action }: { sn: string; action: number }) =>
      executeJob(sn, 'wayline', { action }),
  });

  // Cancel active fly-to-point job — drone enters hover or lands
  const { mutate: cancelFly, isPending: isCancelPending } = useMutation({
    mutationFn: (sn: string) => cancelFlyToPoint(sn),
  });

  const isAnyPending = isExecPending || isCancelPending;

  const handlePauseResume = () => {
    if (!canAct || isAnyPending) return;
    execJob(
      { sn: dockSn, action: isPaused ? 1 : 0 },
      { onSuccess: () => setIsPaused((p) => !p) }
    );
  };

  // Hover — pause fly-to-point and hold position
  const handleHover = () => {
    if (!canAct || isAnyPending) return;
    cancelFly(dockSn);
  };

  // Emergency land — stop mission entirely
  const handleLand = () => {
    if (!canAct || isAnyPending) return;
    cancelFly(dockSn, {
      onSuccess: () => setIsPaused(false),
    });
  };

  // RTH — stop wayline mission, drone returns to dock (action 2 = stop)
  const handleRTH = () => {
    if (!canAct || isAnyPending) return;
    execJob({ sn: dockSn, action: 2 }, { onSuccess: () => setIsPaused(false) });
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
          {isExecPending && !isPaused ? (
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
          title={!canAct ? 'No active flight' : 'Hold current position'}
          className='relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            bg-amber-950/40 border-amber-900/50 text-amber-500/70 hover:bg-amber-900/40 hover:border-amber-400 hover:text-amber-300'
        >
          {isCancelPending ? (
            <Loader2 size={15} className='animate-spin text-amber-400' />
          ) : (
            <PauseCircle size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>Hover</span>
        </button>
      </div>

      {/* ── Emergency Land ──────────────────────────────────────────── */}
      <div className='relative flex-1 h-full'>
        {isCancelPending && (
          <ActiveGlow colorClass='ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]' />
        )}
        <button
          onClick={handleLand}
          disabled={!canAct || isAnyPending}
          title={!canAct ? 'No active flight' : 'Emergency land now'}
          className={`relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            ${
              isCancelPending
                ? 'bg-red-600 text-white border-red-400 scale-[0.98]'
                : 'bg-red-950/40 border-red-900/50 text-red-500/70 hover:bg-red-900/40 hover:text-red-400'
            }`}
        >
          {isCancelPending ? (
            <Loader2 size={15} className='animate-spin' />
          ) : (
            <AlertTriangle size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-black tracking-[0.15em] uppercase'>
            {isCancelPending ? 'Landing…' : 'Land'}
          </span>
        </button>
      </div>

      {/* ── Return to Home ──────────────────────────────────────────── */}
      <div className='relative flex-1 h-full'>
        {isExecPending && isPaused === false && (
          <ActiveGlow colorClass='ring-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]' />
        )}
        <button
          onClick={handleRTH}
          disabled={!canAct || isAnyPending}
          title={!canAct ? 'No active flight' : 'Return drone to dock'}
          className='relative z-10 w-full h-full flex items-center justify-center gap-2 rounded border transition-all outline-none select-none group
            focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed
            bg-indigo-950/40 border-indigo-900/50 text-indigo-500/70 hover:bg-indigo-900/40 hover:border-indigo-400 hover:text-indigo-300'
        >
          {isExecPending && !isPaused ? (
            <Loader2 size={15} className='animate-spin text-indigo-400' />
          ) : (
            <Home size={15} className='group-hover:scale-110 transition-transform' />
          )}
          <span className='text-[10px] font-bold tracking-[0.15em] uppercase'>RTH</span>
        </button>
      </div>
    </div>
  );
};

export default FlightControlActions;
