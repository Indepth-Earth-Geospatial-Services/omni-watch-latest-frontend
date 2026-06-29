'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Loader2,
  AlertTriangle,
  Navigation,
  ArrowUp,
  Key,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTakeoffToPoint,
  useFlyToPoint,
  useRequestFlightAuthority,
} from '@/hooks/useDockController';
import { FormInput, FormSelect } from './ControlShared';
import type { TakeoffToPointRequest, DockFlyToPointRequest } from '@/lib/types/dock';

const DJI_MAX_RANGE_M = 7000;

export interface FlightCommandModalProps {
  dockSn: string;
  isAirborne: boolean;
  initialLat: number;
  initialLng: number;
  dockLat?: number;
  dockLng?: number;
  onClose: () => void;
  onTakeoffSucceeded?: (lat: number, lng: number) => void;
  onFlyToSucceeded?: (lat: number, lng: number) => void;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Mode = 'takeoff' | 'flyto';

const RC_LOST_OPTIONS = [
  { value: '0', label: 'Hover' },
  { value: '1', label: 'Land' },
  { value: '2', label: 'Return Home' },
];

const CMD_MODE_OPTIONS = [
  { value: '0', label: 'Smart RTH' },
  { value: '1', label: 'Altitude-First RTH' },
];

const CMD_LOST_OPTIONS = [
  { value: '0', label: 'Continue Wayline' },
  { value: '1', label: 'Execute Lost Action' },
];

export const FlightCommandModal = ({
  dockSn,
  isAirborne,
  initialLat,
  initialLng,
  dockLat,
  dockLng,
  onClose,
  onTakeoffSucceeded,
  onFlyToSucceeded,
}: FlightCommandModalProps) => {
  const [mode, setMode] = useState<Mode>(isAirborne ? 'flyto' : 'takeoff');
  const [authGranted, setAuthGranted] = useState(false);

  // Editable coordinate fields — pre-filled from right-click but user can change them
  const [editLat, setEditLat] = useState(initialLat.toFixed(6));
  const [editLng, setEditLng] = useState(initialLng.toFixed(6));
  const parsedLat = parseFloat(editLat);
  const parsedLng = parseFloat(editLng);
  const validCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

  const [height, setHeight] = useState('120');
  const [maxSpeed, setMaxSpeed] = useState('10');

  // Takeoff-only fields
  const [secHeight, setSecHeight] = useState('20');
  const [rthAlt, setRthAlt] = useState('100');
  const [cmdMode, setCmdMode] = useState('0');
  const [rcLost, setRcLost] = useState('2');
  const [cmdLost, setCmdLost] = useState('1');

  const [lastError, setLastError] = useState<string | null>(null);

  const { mutate: grabAuth, isPending: isGrabbing } = useRequestFlightAuthority(dockSn);
  const { mutate: takeoff, isPending: isTakingOff } = useTakeoffToPoint(dockSn);
  const { mutate: flyTo, isPending: isFlying } = useFlyToPoint(dockSn);

  const isAnyPending = isGrabbing || isTakingOff || isFlying;
  const isTakeoffMode = mode === 'takeoff';

  const distanceM = useMemo(() => {
    if (!dockLat || !dockLng || !validCoords) return null;
    return haversineM(dockLat, dockLng, parsedLat, parsedLng);
  }, [dockLat, dockLng, parsedLat, parsedLng, validCoords]);

  const isOutOfRange = distanceM != null && distanceM > DJI_MAX_RANGE_M;

  const handleGrabAuth = () => {
    grabAuth(undefined, {
      onSuccess: () => {
        setAuthGranted(true);
        toast.success('Flight authority acquired');
      },
      onError: (err) => {
        toast.error(`Authority failed: ${err.message}`);
      },
    });
  };

  const handleSubmit = useCallback(() => {
    setLastError(null);

    if (isTakeoffMode) {
      const payload: TakeoffToPointRequest = {
        targetLatitude: parsedLat,
        targetLongitude: parsedLng,
        targetHeight: Number(height),
        securityTakeoffHeight: Number(secHeight),
        commanderFlightHeight: Number(height),
        commanderFlightMode: cmdMode,
        rthAltitude: Number(rthAlt),
        rthMode: '0',
        rcLostAction: rcLost,
        exitWaylineWhenRcLost: '1',
        commanderModeLostAction: cmdLost,
        maxSpeed: Number(maxSpeed),
      };
      takeoff(payload, {
        onSuccess: () => {
          toast.success('Takeoff command sent');
          onTakeoffSucceeded?.(parsedLat, parsedLng);
          onClose();
        },
        onError: (err) => {
          setLastError(err.message);
          toast.error(`Takeoff failed: ${err.message}`);
        },
      });
    } else {
      const payload: DockFlyToPointRequest = {
        maxSpeed: Number(maxSpeed),
        points: [{ latitude: parsedLat, longitude: parsedLng, height: Number(height) }],
      };
      flyTo(payload, {
        onSuccess: () => {
          toast.success('Fly-to command sent');
          onFlyToSucceeded?.(parsedLat, parsedLng);
          onClose();
        },
        onError: (err) => {
          setLastError(err.message);
          toast.error(`Fly-to failed: ${err.message}`);
        },
      });
    }
  }, [
    isTakeoffMode,
    parsedLat,
    parsedLng,
    height,
    maxSpeed,
    secHeight,
    rthAlt,
    cmdMode,
    rcLost,
    cmdLost,
    takeoff,
    flyTo,
    onClose,
    onTakeoffSucceeded,
    onFlyToSucceeded,
  ]);

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />

      <div
        className={`relative z-10 w-full max-w-md mx-4 bg-[#0F1117] border rounded-2xl shadow-2xl overflow-hidden ${
          isTakeoffMode ? 'border-emerald-500/30' : 'border-blue-500/30'
        }`}
      >
        {/* Accent top line */}
        <div
          className={`h-0.5 w-full bg-gradient-to-r from-transparent to-transparent ${
            isTakeoffMode ? 'via-emerald-500/70' : 'via-blue-500/70'
          }`}
        />

        {/* Header */}
        <div className='flex items-center justify-between px-5 pt-4 pb-3'>
          <div className='flex items-center gap-2'>
            <Navigation size={14} className='text-zinc-400' />
            <span className='text-[11px] font-black uppercase tracking-widest text-zinc-200'>
              Flight Command
            </span>
          </div>
          <button onClick={onClose} className='text-zinc-600 hover:text-zinc-300 transition-colors'>
            <X size={14} />
          </button>
        </div>

        {/* Target coordinates — editable */}
        <div className='mx-5 mb-3 px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg'>
          <p className='text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1.5'>
            Target Coordinates
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-0.5'>
              <label className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>Latitude</label>
              <input
                type='number'
                value={editLat}
                onChange={(e) => setEditLat(e.target.value)}
                step='0.000001'
                className='w-full bg-[#0A0C10] border border-zinc-700/50 rounded text-[11px] font-mono text-zinc-300 px-2 py-1 focus:outline-none focus:border-zinc-500'
              />
            </div>
            <div className='flex flex-col gap-0.5'>
              <label className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>Longitude</label>
              <input
                type='number'
                value={editLng}
                onChange={(e) => setEditLng(e.target.value)}
                step='0.000001'
                className='w-full bg-[#0A0C10] border border-zinc-700/50 rounded text-[11px] font-mono text-zinc-300 px-2 py-1 focus:outline-none focus:border-zinc-500'
              />
            </div>
          </div>
          {!validCoords && (
            <p className='text-[9px] text-red-400 mt-1'>Enter valid coordinates</p>
          )}
          {distanceM != null && (
            <p className={`text-[9px] font-mono mt-1 ${isOutOfRange ? 'text-red-400' : 'text-emerald-400/70'}`}>
              {(distanceM / 1000).toFixed(2)} km from dock
              {isOutOfRange && ' — exceeds 7 km safe range'}
            </p>
          )}
        </div>

        {/* Authority grab */}
        <div className='mx-5 mb-3'>
          {authGranted ? (
            <div className='flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border border-emerald-500/20 rounded-lg'>
              <CheckCircle2 size={12} className='text-emerald-400' />
              <span className='text-[9px] font-bold text-emerald-400 uppercase tracking-widest'>
                Authority Held
              </span>
            </div>
          ) : (
            <button
              onClick={handleGrabAuth}
              disabled={isGrabbing}
              className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-400 text-[9px] font-black uppercase tracking-widest hover:bg-amber-950/60 hover:border-amber-500/50 transition-all disabled:opacity-40'
            >
              {isGrabbing ? <Loader2 size={11} className='animate-spin' /> : <Key size={11} />}
              Grab Flight Authority
            </button>
          )}
        </div>

        <div className='h-px bg-zinc-800/60 mx-5 mb-3' />

        {/* Mode tabs */}
        <div className='mx-5 mb-3 flex rounded-lg overflow-hidden border border-zinc-800'>
          <button
            onClick={() => !isAirborne && setMode('takeoff')}
            disabled={isAirborne}
            title={isAirborne ? 'Drone is airborne — use Fly-To instead' : undefined}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-r border-zinc-800 ${
              isAirborne
                ? 'opacity-30 cursor-not-allowed text-zinc-600'
                : isTakeoffMode
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <ArrowUp size={10} /> Takeoff
          </button>
          <button
            onClick={() => setMode('flyto')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${
              !isTakeoffMode ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Send size={10} /> Fly-To
          </button>
        </div>

        {/* Warnings */}
        {isTakeoffMode && isAirborne && (
          <div className='mx-5 mb-2 flex items-center gap-1.5 px-2 py-1.5 bg-amber-950/30 border border-amber-800/30 rounded text-amber-500/80 text-[8px] font-bold'>
            <AlertTriangle size={9} /> Drone is airborne — Fly-To is recommended instead
          </div>
        )}
        {!isTakeoffMode && !isAirborne && (
          <div className='mx-5 mb-2 flex items-center gap-1.5 px-2 py-1.5 bg-amber-950/30 border border-amber-800/30 rounded text-amber-500/80 text-[8px] font-bold'>
            <AlertTriangle size={9} /> Drone is grounded — Takeoff to Point is recommended instead
          </div>
        )}
        {isOutOfRange && (
          <div className='mx-5 mb-2 flex items-center gap-1.5 px-2 py-1.5 bg-red-950/40 border border-red-800/40 rounded text-red-400 text-[8px] font-bold'>
            <AlertTriangle size={9} /> Target exceeds 7 km safe range — command may be rejected
          </div>
        )}

        {/* Form fields */}
        <div className='px-5 pb-3 flex flex-col gap-3'>
          <div className='grid grid-cols-2 gap-2'>
            <FormInput
              label='Target Height'
              value={height}
              onChange={setHeight}
              min={isTakeoffMode ? 20 : 2}
              max={1500}
              step={1}
              unit='m'
            />
            <FormInput
              label='Max Speed'
              value={maxSpeed}
              onChange={setMaxSpeed}
              min={1}
              max={15}
              step={1}
              unit='m/s'
            />
          </div>

          {isTakeoffMode && (
            <>
              <div className='grid grid-cols-2 gap-2'>
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
              <div className='grid grid-cols-2 gap-2'>
                <FormSelect
                  label='RC Lost Action'
                  value={rcLost}
                  onChange={setRcLost}
                  options={RC_LOST_OPTIONS}
                />
                <FormSelect
                  label='RTH Mode'
                  value={cmdMode}
                  onChange={setCmdMode}
                  options={CMD_MODE_OPTIONS}
                />
              </div>
              <FormSelect
                label='Commander Lost Action'
                value={cmdLost}
                onChange={setCmdLost}
                options={CMD_LOST_OPTIONS}
              />
            </>
          )}

          {lastError && (
            <div className='rounded-lg bg-red-950/50 border border-red-800/50 px-3 py-2 flex gap-2'>
              <AlertTriangle size={12} className='text-red-400 flex-shrink-0 mt-0.5' />
              <p className='text-[9px] text-red-300/80 font-mono break-all'>{lastError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex gap-2 px-5 py-3 border-t border-zinc-800/60'>
          <button
            onClick={onClose}
            className='flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:border-zinc-500 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!authGranted || isAnyPending || !validCoords}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isTakeoffMode
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400'
                : 'bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400'
            }`}
          >
            {isAnyPending ? (
              <span className='flex items-center justify-center gap-1.5'>
                <Loader2 size={11} className='animate-spin' /> Sending…
              </span>
            ) : isTakeoffMode ? (
              'Launch Takeoff'
            ) : (
              'Send Fly-To'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
