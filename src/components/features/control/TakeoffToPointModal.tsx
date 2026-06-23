'use client';

import React, { useState } from 'react';
import { ArrowUp, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTakeoffToPoint } from '@/hooks/useDockController';
import { FormInput, FormSelect } from './ControlShared';

interface TakeoffToPointModalProps {
  dockSn: string;
  onClose: () => void;
}

export const TakeoffToPointModal = ({ dockSn, onClose }: TakeoffToPointModalProps) => {
  // Target GPS
  const [lat,       setLat]       = useState('');
  const [lng,       setLng]       = useState('');
  const [height,    setHeight]    = useState('50');
  const [maxSpeed,  setMaxSpeed]  = useState('8');

  // Flight settings
  const [secHeight, setSecHeight] = useState('20');
  const [rthAlt,    setRthAlt]    = useState('100');
  const [cmdMode,   setCmdMode]   = useState('0');

  // Fail-safe
  const [rcLost,   setRcLost]   = useState('2');
  const [cmdLost,  setCmdLost]  = useState('1');

  // Error detail visible in the modal (toast alone is too brief)
  const [lastError, setLastError] = useState<string | null>(null);

  const { mutate: takeoff, isPending } = useTakeoffToPoint(dockSn);

  const handleSubmit = () => {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!lat || !lng || isNaN(latNum) || isNaN(lngNum)) {
      setLastError('Target latitude and longitude are required.');
      return;
    }

    const heightNum = Number(height);

    const payload = {
      // flightId intentionally omitted — DJI server ignores it and it's absent in working reference impl
      targetLatitude:          latNum,
      targetLongitude:         lngNum,
      targetHeight:            heightNum,
      securityTakeoffHeight:   Number(secHeight),
      commanderFlightHeight:   heightNum,   // match reference impl: same as target height
      commanderFlightMode:     cmdMode,
      rthAltitude:             Number(rthAlt),
      rthMode:                 '0',          // match reference impl: 0
      rcLostAction:            rcLost,
      exitWaylineWhenRcLost:   '1',
      commanderModeLostAction: cmdLost,
      maxSpeed:                Number(maxSpeed),
    };

    console.log('[TakeoffToPoint] Sending payload →', JSON.stringify(payload, null, 2));
    setLastError(null);

    takeoff(payload, {
      onSuccess: () => {
        console.log('[TakeoffToPoint] ✅ Command accepted by DJI server');
        toast.success('Takeoff command sent successfully');
        onClose();
      },
      onError: (err) => {
        const detail = (err as { message?: string; response?: { data?: unknown } }).message ?? 'Unknown error';
        const responseData = (err as { response?: { data?: unknown } }).response?.data;
        console.error('[TakeoffToPoint] ❌ Failed:', err);
        if (responseData) {
          console.error('[TakeoffToPoint] Server response:', JSON.stringify(responseData, null, 2));
        }
        const displayMsg = responseData
          ? `${detail} — ${JSON.stringify(responseData)}`
          : detail;
        setLastError(displayMsg);
        toast.error(`Takeoff failed: ${detail}`);
      },
    });
  };

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal card */}
      <div className='relative z-10 w-full max-w-lg mx-4 bg-[#0F1117] border border-emerald-500/30 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.12)] overflow-hidden'>

        {/* Accent bar */}
        <div className='h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent' />

        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-5 pb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0'>
              <ArrowUp size={16} className='text-emerald-400' />
            </div>
            <div>
              <h2 className='text-sm font-black uppercase tracking-widest text-zinc-100'>One-Key Takeoff</h2>
              <p className='text-[10px] text-emerald-500/60 font-mono tracking-wide mt-0.5'>
                takeoff-to-point · {dockSn.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-zinc-600 hover:text-zinc-300 transition-colors p-1'
            aria-label='Close'
          >
            <X size={15} />
          </button>
        </div>

        <div className='h-px bg-zinc-800/80 mx-6' />

        {/* Form body */}
        <div className='px-6 py-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto'>

          {/* Target GPS */}
          <div>
            <p className='text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2.5'>
              Target GPS Point
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <FormInput
                label='Latitude'
                value={lat}
                onChange={setLat}
                type='number'
                min={-90}
                max={90}
                step={0.000001}
                placeholder='e.g. 1.3521'
              />
              <FormInput
                label='Longitude'
                value={lng}
                onChange={setLng}
                type='number'
                min={-180}
                max={180}
                step={0.000001}
                placeholder='e.g. 103.8198'
              />
            </div>
            <div className='grid grid-cols-2 gap-3 mt-3'>
              <FormInput label='Target Height' value={height}   onChange={setHeight}   min={2}  max={1500} step={1} unit='m'   />
              <FormInput label='Max Speed'     value={maxSpeed} onChange={setMaxSpeed} min={1}  max={15}   step={1} unit='m/s' />
            </div>
          </div>

          <div className='h-px bg-zinc-800/60' />

          {/* Flight settings */}
          <div>
            <p className='text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2.5'>
              Flight Settings
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <FormInput
                label='Safe Takeoff Height'
                value={secHeight}
                onChange={setSecHeight}
                min={20}
                max={1500}
                step={1}
                unit='m'
              />
              <FormInput
                label='RTH Altitude'
                value={rthAlt}
                onChange={setRthAlt}
                min={2}
                max={1500}
                step={1}
                unit='m'
              />
            </div>
            <div className='mt-3'>
              <FormSelect
                label='Commander Flight Mode'
                value={cmdMode}
                onChange={setCmdMode}
                options={[
                  { value: '0', label: 'Optimal Height' },
                  { value: '1', label: 'Preset Height'  },
                ]}
              />
            </div>
            <p className='text-[8px] text-zinc-700 mt-1.5'>
              RTH mode locked to preset · Commander height tracks target height
            </p>
          </div>

          <div className='h-px bg-zinc-800/60' />

          {/* Fail-safe */}
          <div>
            <p className='text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2.5'>
              Fail-safe Actions
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <FormSelect
                label='RC Lost Action'
                value={rcLost}
                onChange={setRcLost}
                options={[
                  { value: '0', label: 'Hover'       },
                  { value: '1', label: 'Land'        },
                  { value: '2', label: 'Return Home' },
                ]}
              />
              <FormSelect
                label='Mission Loss'
                value={cmdLost}
                onChange={setCmdLost}
                options={[
                  { value: '0', label: 'Continue Mission' },
                  { value: '1', label: 'Normal Behavior'  },
                ]}
              />
            </div>
          </div>

          {/* Inline error panel — visible when API returns an error */}
          {lastError && (
            <div className='rounded-lg bg-red-950/50 border border-red-800/50 px-3 py-2.5 flex gap-2.5'>
              <AlertTriangle size={13} className='text-red-400 flex-shrink-0 mt-0.5' />
              <div className='min-w-0'>
                <p className='text-[9px] font-black uppercase tracking-widest text-red-400 mb-1'>
                  API Error
                </p>
                <p className='text-[10px] text-red-300/80 font-mono break-all leading-relaxed'>
                  {lastError}
                </p>
                <p className='text-[8px] text-zinc-600 mt-1'>Full details logged to browser console.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex gap-3 px-6 py-4 border-t border-zinc-800/60'>
          <button
            onClick={onClose}
            className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className='flex-1 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/30 hover:border-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          >
            {isPending
              ? <span className='flex items-center justify-center gap-2'><Loader2 size={12} className='animate-spin' /> Launching…</span>
              : 'Launch Takeoff'}
          </button>
        </div>
      </div>
    </div>
  );
};
