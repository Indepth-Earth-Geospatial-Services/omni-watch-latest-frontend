'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';
import type { DRCStatus } from '@/hooks/useDRC';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManualFlightControlsProps {
  isActive: boolean;
  drcStatus: DRCStatus;
  sendJoystick: (x: number, y: number, h: number, w: number) => boolean;
  onDeactivate: () => void;
}

// ─── Axes ─────────────────────────────────────────────────────────────────────

interface Axes {
  x: number;
  y: number;
  h: number;
  w: number;
}
const NEUTRAL: Axes = { x: 0, y: 0, h: 0, w: 0 };

// Mode-2 keyboard map
const KEY_MAP: Record<string, Partial<Axes>> = {
  KeyW: { y: 1 },
  ArrowUp: { y: 1 },
  KeyS: { y: -1 },
  ArrowDown: { y: -1 },
  KeyA: { x: -1 },
  ArrowLeft: { x: -1 },
  KeyD: { x: 1 },
  ArrowRight: { x: 1 },
  KeyI: { h: 1 },
  Space: { h: 1 },
  KeyK: { h: -1 },
  KeyJ: { w: -1 },
  KeyL: { w: 1 },
};

// Speed presets: 20 / 40 / 60 / 80 %
const SPEEDS = [20, 40, 60, 80] as const;

// ─── Dir button (same look as GimbalControls) ─────────────────────────────────

interface DirBtnProps {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onPress: () => void;
  onRelease: () => void;
}

const DirBtn = ({ icon, title, active, onPress, onRelease }: DirBtnProps) => (
  <button
    title={title}
    onPointerDown={(e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onPress();
    }}
    onPointerUp={onRelease}
    onPointerLeave={onRelease}
    className={`w-7 h-7 flex items-center justify-center rounded border select-none touch-none transition-all ${
      active
        ? 'bg-cyan-400/25 border-cyan-400/50 text-cyan-300'
        : 'bg-white/5 border-white/10 text-white/50 hover:bg-cyan-400/20 hover:border-cyan-400/30 hover:text-white/90 active:scale-90'
    }`}
  >
    {icon}
  </button>
);

// ─── ManualFlightControls ─────────────────────────────────────────────────────

export function ManualFlightControls({
  isActive,
  drcStatus,
  sendJoystick,
  onDeactivate,
}: ManualFlightControlsProps) {
  const [speed, setSpeed] = useState<number>(40);

  const buttonAxes = useRef<Axes>({ ...NEUTRAL });
  const keyAxes = useRef<Axes>({ ...NEUTRAL });
  const activeKeysRef = useRef<Set<string>>(new Set());
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Merge button + key axes, clamped to ±1
  const getAxes = useCallback((): Axes => {
    const cl = (v: number) => Math.max(-1, Math.min(1, v));
    return {
      x: cl(buttonAxes.current.x + keyAxes.current.x),
      y: cl(buttonAxes.current.y + keyAxes.current.y),
      h: cl(buttonAxes.current.h + keyAxes.current.h),
      w: cl(buttonAxes.current.w + keyAxes.current.w),
    };
  }, []);

  // 10 Hz broadcast while active — axes are normalized -1..1, scaled by speed %
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      const a = getAxes();
      const s = speed / 100;
      sendJoystick(a.x * s, a.y * s, a.h * s, a.w * s);
    }, 100);
    return () => {
      clearInterval(id);
      sendJoystick(0, 0, 0, 0);
    };
  }, [isActive, speed, sendJoystick, getAxes]);

  // Keyboard
  const applyKey = useCallback((code: string, pressed: boolean) => {
    if (!KEY_MAP[code]) return;
    const next = new Set(activeKeysRef.current);
    pressed ? next.add(code) : next.delete(code);
    activeKeysRef.current = next;
    setActiveKeys(new Set(next));
    keyAxes.current = { ...NEUTRAL };
    for (const k of next) {
      const d = KEY_MAP[k];
      if (!d) continue;
      if (d.x) keyAxes.current.x += d.x;
      if (d.y) keyAxes.current.y += d.y;
      if (d.h) keyAxes.current.h += d.h;
      if (d.w) keyAxes.current.w += d.w;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const down = (e: KeyboardEvent) => {
      if (e.repeat || !KEY_MAP[e.code]) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
        e.preventDefault();
      applyKey(e.code, true);
    };
    const up = (e: KeyboardEvent) => applyKey(e.code, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      activeKeysRef.current = new Set();
      keyAxes.current = { ...NEUTRAL };
      setActiveKeys(new Set());
    };
  }, [isActive, applyKey]);

  // Button axis helpers
  const press = (delta: Partial<Axes>) => {
    buttonAxes.current = { x: delta.x ?? 0, y: delta.y ?? 0, h: delta.h ?? 0, w: delta.w ?? 0 };
  };
  const release = () => {
    buttonAxes.current = { ...NEUTRAL };
  };

  const isKey = (...codes: string[]) => codes.some((c) => activeKeys.has(c));

  if (!isActive) return null;

  return (
    // Positioned just above the compass (compass: bottom-6 left-6, h-40 = 160px → controls at bottom ~208px)
    <div className='absolute left-0 bottom-[120px] z-40 pointer-events-auto'>
      <div className='flex flex-col items-start gap-1.5 bg-black/25 border border-white/[0.07] rounded-xl px-3 py-2.5 shadow-2xl'>
        {/* Header row */}
        <div className='flex items-center justify-between w-full gap-3'>
          <div className='flex items-center gap-1.5'>
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${drcStatus === 'active' ? 'bg-emerald-400' : 'bg-red-500'}`}
            />
            <span className='text-[7px] font-mono uppercase tracking-[0.2em] text-white/30 leading-none'>
              Manual
            </span>
          </div>
          <button
            onClick={onDeactivate}
            className='w-4 h-4 flex items-center justify-center rounded text-white/25 hover:text-white/70 hover:bg-white/10 transition-all'
          >
            <X size={8} />
          </button>
        </div>

        {/* DRC warning (compact) */}
        {drcStatus !== 'active' && (
          <div className='flex items-center gap-1 px-1.5 py-1 rounded bg-red-500/10 border border-red-500/15 w-full'>
            <AlertTriangle size={8} className='text-red-400 flex-shrink-0' />
            <span className='text-[7px] text-red-400/70'>DRC inactive</span>
          </div>
        )}

        {/* Two D-pads side by side */}
        <div className='flex items-center gap-3'>
          {/* Left stick — Throttle (I/K) + Yaw (J/L) */}
          <div className='flex flex-col items-center gap-0.5'>
            <span className='text-[6px] font-mono tracking-widest text-white/20 uppercase'>
              Alt · Yaw
            </span>
            <div className='grid grid-cols-3 gap-[8px]'>
              <div />
              <DirBtn
                icon={<ChevronUp size={10} />}
                title='Throttle up [I]'
                active={isKey('KeyI', 'Space')}
                onPress={() => press({ h: 1 })}
                onRelease={release}
              />
              <div />
              <DirBtn
                icon={<ChevronLeft size={10} />}
                title='Yaw left [J]'
                active={isKey('KeyJ')}
                onPress={() => press({ w: -1 })}
                onRelease={release}
              />
              <div className='w-7 h-7 flex items-center justify-center'>
                <div className='w-1.5 h-1.5 rounded-full bg-white/10' />
              </div>
              <DirBtn
                icon={<ChevronRight size={10} />}
                title='Yaw right [L]'
                active={isKey('KeyL')}
                onPress={() => press({ w: 1 })}
                onRelease={release}
              />
              <div />
              <DirBtn
                icon={<ChevronDown size={10} />}
                title='Throttle down [K]'
                active={isKey('KeyK')}
                onPress={() => press({ h: -1 })}
                onRelease={release}
              />
              <div />
            </div>
          </div>

          {/* Vertical divider */}
          <div className='w-px h-12 bg-white/[0.06]' />

          {/* Right stick — Pitch (W/S) + Roll (A/D) */}
          <div className='flex flex-col items-center gap-0.5'>
            <span className='text-[6px] font-mono tracking-widest text-white/20 uppercase'>
              Pitch · Roll
            </span>
            <div className='grid grid-cols-3 gap-[8px]'>
              <div />
              <DirBtn
                icon={<ChevronUp size={10} />}
                title='Pitch fwd [W/↑]'
                active={isKey('KeyW', 'ArrowUp')}
                onPress={() => press({ y: 1 })}
                onRelease={release}
              />
              <div />
              <DirBtn
                icon={<ChevronLeft size={10} />}
                title='Roll left [A/←]'
                active={isKey('KeyA', 'ArrowLeft')}
                onPress={() => press({ x: -1 })}
                onRelease={release}
              />
              <div className='w-7 h-7 flex items-center justify-center'>
                <div className='w-1.5 h-1.5 rounded-full bg-white/10' />
              </div>
              <DirBtn
                icon={<ChevronRight size={10} />}
                title='Roll right [D/→]'
                active={isKey('KeyD', 'ArrowRight')}
                onPress={() => press({ x: 1 })}
                onRelease={release}
              />
              <div />
              <DirBtn
                icon={<ChevronDown size={10} />}
                title='Pitch back [S/↓]'
                active={isKey('KeyS', 'ArrowDown')}
                onPress={() => press({ y: -1 })}
                onRelease={release}
              />
              <div />
            </div>
          </div>
        </div>

        {/* Speed dots */}
        <div className='flex items-center gap-1.5 w-full justify-between'>
          <span className='text-[6px] font-mono text-white/20 uppercase tracking-widest'>Spd</span>
          <div className='flex gap-1'>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                title={`Speed ${s}%`}
                className={`w-4 h-4 rounded-full border text-[6px] font-bold transition-all ${
                  speed === s
                    ? 'bg-cyan-400/30 border-cyan-400/60 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/25 hover:border-white/25'
                }`}
              >
                {s / 20}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
