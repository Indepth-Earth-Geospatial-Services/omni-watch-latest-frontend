'use client';

import React, { useState } from 'react';
import {
  Home,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Send,
  ArrowUp,
  StopCircle,
  Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useFlyToPoint, useTakeoffToPoint, useExecuteJob } from '@/hooks/useDockController';
import type { JoystickInvalidState } from '@/hooks/useDockMQTT';
import { CmdButton, SectionHeader, FormInput, FormSelect, JOYSTICK_INVALID_REASONS } from './ControlShared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlightAuthorityTabProps {
  dockSn: string;
  flightAuth: boolean;
  isGrabbingAuth: boolean;
  dockOnline: boolean;
  joystickInvalidState?: JoystickInvalidState | null;
  isPending: boolean;
  onToggle: (on: boolean) => void;
  exec: (serviceIdentifier: string, body?: object) => void;
}

// ─── Accordion header ─────────────────────────────────────────────────────────

interface AccordionHeaderProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  expanded: boolean;
  disabled?: boolean;
  colorClass: string;
  onToggle: () => void;
}

const AccordionHeader = ({
  title, subtitle, icon: Icon, expanded, disabled, colorClass, onToggle,
}: AccordionHeaderProps) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
      expanded ? colorClass : 'bg-[#13151A] border-zinc-800/50 hover:border-zinc-600'
    }`}
  >
    <div className='flex items-center gap-2'>
      <Icon size={12} className={expanded ? '' : 'text-zinc-500'} />
      <div className='text-left'>
        <p className='text-[10px] font-black uppercase tracking-widest leading-none'>{title}</p>
        <p className='text-[8px] text-zinc-600 mt-0.5'>{subtitle}</p>
      </div>
    </div>
    {expanded ? <ChevronUp size={10} className='text-zinc-500 flex-shrink-0' /> : <ChevronDown size={10} className='text-zinc-600 flex-shrink-0' />}
  </button>
);

// ─── FlightAuthorityTab ───────────────────────────────────────────────────────

export const FlightAuthorityTab = ({
  dockSn, flightAuth, isGrabbingAuth, dockOnline, joystickInvalidState,
  isPending, onToggle, exec,
}: FlightAuthorityTabProps) => {
  const [expanded, setExpanded] = useState<'flyto' | 'takeoff' | 'stop' | null>(null);
  const toggle = (section: 'flyto' | 'takeoff' | 'stop') =>
    setExpanded((prev) => (prev === section ? null : section));

  // Fly-to form state
  const [flyToLat,    setFlyToLat]    = useState('');
  const [flyToLng,    setFlyToLng]    = useState('');
  const [flyToHeight, setFlyToHeight] = useState('50');
  const [flyToSpeed,  setFlyToSpeed]  = useState('8');

  // Takeoff form state
  const [toLat,              setToLat]              = useState('');
  const [toLng,              setToLng]              = useState('');
  const [toHeight,           setToHeight]           = useState('100');
  const [toSecurityHeight,   setToSecurityHeight]   = useState('50');
  const [toCommanderHeight,  setToCommanderHeight]  = useState('100');
  const [toCommanderMode,    setToCommanderMode]    = useState('1');
  const [toRthAltitude,      setToRthAltitude]      = useState('100');
  const [toRcLostAction,     setToRcLostAction]     = useState('2');
  const [toLostAction,       setToLostAction]       = useState('1');
  const [toMaxSpeed,         setToMaxSpeed]         = useState('8');

  const { mutate: flyTo,   isPending: isFlyingTo }   = useFlyToPoint(dockSn);
  const { mutate: takeoff, isPending: isTakingOff }  = useTakeoffToPoint(dockSn);
  const { mutate: runJob,  isPending: isStoppingDrc } = useExecuteJob(dockSn);

  const noAuth = !flightAuth || !dockOnline;

  const handleFlyTo = () => {
    const lat = Number(flyToLat), lng = Number(flyToLng);
    if (!flyToLat || !flyToLng || isNaN(lat) || isNaN(lng)) {
      toast.error('Enter valid latitude and longitude');
      return;
    }
    flyTo(
      {
        flyToId: crypto.randomUUID(),
        maxSpeed: Number(flyToSpeed),
        points: [{ latitude: lat, longitude: lng, height: Number(flyToHeight) }],
      },
      {
        onSuccess: () => toast.success('Fly-to command sent'),
        onError:   (err) => toast.error(`Fly-to failed: ${err.message}`),
      },
    );
  };

  const handleTakeoff = () => {
    const lat = Number(toLat), lng = Number(toLng);
    if (!toLat || !toLng || isNaN(lat) || isNaN(lng)) {
      toast.error('Enter valid target latitude and longitude');
      return;
    }
    takeoff(
      {
        flightId:              crypto.randomUUID(),
        targetLatitude:        lat,
        targetLongitude:       lng,
        targetHeight:          Number(toHeight),
        securityTakeoffHeight: Number(toSecurityHeight),
        commanderFlightHeight: Number(toCommanderHeight),
        commanderFlightMode:   toCommanderMode,
        rthAltitude:           Number(toRthAltitude),
        rthMode:               '1', // dock only supports preset altitude
        rcLostAction:          toRcLostAction,
        exitWaylineWhenRcLost: toLostAction,
        commanderModeLostAction: toLostAction,
        maxSpeed:              Number(toMaxSpeed),
      },
      {
        onSuccess: () => toast.success('Takeoff command sent'),
        onError:   (err) => toast.error(`Takeoff failed: ${err.message}`),
      },
    );
  };

  const handleEmergencyStop = () => {
    runJob(
      { serviceIdentifier: 'drone_emergency_stop', body: { action: 0 } },
      {
        onSuccess: () => toast.success('Emergency stop sent'),
        onError:   (err) => toast.error(`Emergency stop failed: ${err.message}`),
      },
    );
  };

  return (
    <div className='flex flex-col gap-3'>

      {/* ── Authority toggle card ── */}
      <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
        flightAuth ? 'bg-blue-500/10 border-blue-500/40' : 'bg-[#13151A] border-zinc-800/50'
      }`}>
        <div className='flex-1 min-w-0 mr-3'>
          <p className='text-[11px] font-black text-zinc-200 uppercase tracking-wide'>Flight Authority</p>
          <p className='text-[9px] text-zinc-600 mt-0.5'>
            {!dockOnline
              ? 'Dock offline'
              : flightAuth
                ? 'Cloud has control — enables fly-to & DRC'
                : 'Grab to enable cloud flight commands'}
          </p>
          {joystickInvalidState && (
            <p className='text-[9px] font-mono text-red-400/70 mt-0.5'>
              Lost: {JOYSTICK_INVALID_REASONS[joystickInvalidState.reason] ?? `reason ${joystickInvalidState.reason}`}
            </p>
          )}
          {!joystickInvalidState && flightAuth && (
            <p className='text-[9px] font-mono text-zinc-500 mt-0.5'>Pilot reclaims via stick input</p>
          )}
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          {isGrabbingAuth
            ? <Loader2 size={11} className='animate-spin text-zinc-500' />
            : <span className={`text-[9px] font-bold uppercase ${flightAuth ? 'text-blue-400' : 'text-zinc-600'}`}>
                {flightAuth ? 'Granted' : 'Not held'}
              </span>
          }
          <Switch
            checked={flightAuth}
            onCheckedChange={onToggle}
            disabled={!dockOnline || isGrabbingAuth}
            aria-label='Toggle flight authority'
          />
        </div>
      </div>

      {/* ── Fly-To Point accordion ── */}
      <div>
        <AccordionHeader
          id='flyto'
          title='Fly-To Point'
          subtitle='Redirect airborne drone to GPS coords'
          icon={Send}
          expanded={expanded === 'flyto'}
          disabled={noAuth}
          colorClass='bg-blue-500/10 border-blue-500/40 text-blue-300'
          onToggle={() => toggle('flyto')}
        />
        {expanded === 'flyto' && (
          <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
            <p className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>Target GPS Point</p>
            <div className='grid grid-cols-2 gap-2'>
              <FormInput label='Latitude'  value={flyToLat} onChange={setFlyToLat} type='number' min={-90}  max={90}  step={0.000001} placeholder='e.g. 1.3521' />
              <FormInput label='Longitude' value={flyToLng} onChange={setFlyToLng} type='number' min={-180} max={180} step={0.000001} placeholder='e.g. 103.8198' />
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <FormInput label='Height'    value={flyToHeight} onChange={setFlyToHeight} min={20}  max={10000} step={1} unit='m'   />
              <FormInput label='Max Speed' value={flyToSpeed}  onChange={setFlyToSpeed}  min={1}   max={15}    step={1} unit='m/s' />
            </div>
            <p className='text-[8px] text-zinc-700'>Min height 20 m — DJI safety floor</p>
            <button
              onClick={handleFlyTo}
              disabled={isFlyingTo}
              className='w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/30 transition-colors disabled:opacity-40'
            >
              {isFlyingTo
                ? <span className='flex items-center justify-center gap-1.5'><Loader2 size={11} className='animate-spin' /> Sending…</span>
                : 'Send Fly-To'}
            </button>
          </div>
        )}
      </div>

      {/* ── One-Key Takeoff accordion ── */}
      <div>
        <AccordionHeader
          id='takeoff'
          title='One-Key Takeoff'
          subtitle='Autonomous launch from dock to waypoint'
          icon={ArrowUp}
          expanded={expanded === 'takeoff'}
          disabled={noAuth}
          colorClass='bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
          onToggle={() => toggle('takeoff')}
        />
        {expanded === 'takeoff' && (
          <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>

            {/* Target point */}
            <p className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>Target Point</p>
            <div className='grid grid-cols-2 gap-2'>
              <FormInput label='Latitude'  value={toLat} onChange={setToLat} type='number' min={-90}  max={90}  step={0.000001} placeholder='e.g. 1.3521' />
              <FormInput label='Longitude' value={toLng} onChange={setToLng} type='number' min={-180} max={180} step={0.000001} placeholder='e.g. 103.8198' />
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <FormInput label='Target Height' value={toHeight} onChange={setToHeight} min={2} max={1500} step={1} unit='m' />
              <FormInput label='Max Speed'     value={toMaxSpeed} onChange={setToMaxSpeed} min={1} max={15} step={1} unit='m/s' />
            </div>

            <div className='h-px bg-zinc-800/60' />

            {/* Flight params */}
            <p className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>Flight Params</p>
            <div className='grid grid-cols-2 gap-2'>
              <FormInput label='Commander Height' value={toCommanderHeight} onChange={setToCommanderHeight} min={2} max={3000} step={1} unit='m' />
              <FormInput label='Safe Takeoff Ht'  value={toSecurityHeight}  onChange={setToSecurityHeight}  min={20} max={1500} step={1} unit='m' />
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <FormSelect
                label='Commander Mode'
                value={toCommanderMode}
                onChange={setToCommanderMode}
                options={[
                  { value: '0', label: 'Optimal Height' },
                  { value: '1', label: 'Preset Height'  },
                ]}
              />
              <FormInput label='RTH Altitude' value={toRthAltitude} onChange={setToRthAltitude} min={2} max={1500} step={1} unit='m' />
            </div>
            <p className='text-[8px] text-zinc-700'>RTH mode locked to Preset Altitude (dock requirement)</p>

            <div className='h-px bg-zinc-800/60' />

            {/* Loss of control */}
            <p className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>Loss of Control</p>
            <div className='grid grid-cols-2 gap-2'>
              <FormSelect
                label='RC Lost Action'
                value={toRcLostAction}
                onChange={setToRcLostAction}
                options={[
                  { value: '0', label: 'Hover'          },
                  { value: '1', label: 'Land'           },
                  { value: '2', label: 'Return Home'    },
                ]}
              />
              <FormSelect
                label='Mission Loss'
                value={toLostAction}
                onChange={setToLostAction}
                options={[
                  { value: '0', label: 'Continue Mission' },
                  { value: '1', label: 'Normal Behavior'  },
                ]}
              />
            </div>

            <button
              onClick={handleTakeoff}
              disabled={isTakingOff}
              className='w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors disabled:opacity-40'
            >
              {isTakingOff
                ? <span className='flex items-center justify-center gap-1.5'><Loader2 size={11} className='animate-spin' /> Launching…</span>
                : 'Launch Takeoff'}
            </button>
          </div>
        )}
      </div>

      {/* ── Emergency Stop accordion ── */}
      <div>
        <AccordionHeader
          id='stop'
          title='Emergency Stop'
          subtitle='Immediately halt drone mid-flight'
          icon={StopCircle}
          expanded={expanded === 'stop'}
          disabled={!dockOnline}
          colorClass='bg-red-500/10 border-red-500/40 text-red-300'
          onToggle={() => toggle('stop')}
        />
        {expanded === 'stop' && (
          <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
            <p className='text-[9px] text-zinc-500 leading-relaxed'>
              Sends an emergency stop signal via the DRC channel. Use only when the drone must halt immediately — it will drop to a safe hover or land depending on firmware behavior.
            </p>
            <button
              onClick={handleEmergencyStop}
              disabled={isStoppingDrc}
              className='w-full py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors disabled:opacity-40'
            >
              {isStoppingDrc
                ? <span className='flex items-center justify-center gap-1.5'><Loader2 size={11} className='animate-spin' /> Sending…</span>
                : '⚠  Emergency Stop'}
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation (always available when dock online) ── */}
      <div>
        <SectionHeader title='Navigation' />
        <div className='flex flex-wrap gap-1.5'>
          <CmdButton label='Return Home' icon={Home}      onClick={() => exec('return_home')}        disabled={!dockOnline || isPending} />
          <CmdButton label='Cancel RTH'  icon={RotateCcw} onClick={() => exec('return_home_cancel')} disabled={!dockOnline || isPending} />
        </div>
      </div>

      {/* ── Auto-revocation reference ── */}
      <div className='rounded-lg bg-zinc-900/50 border border-zinc-800/40 px-3 py-2.5'>
        <p className='text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 mb-2'>Auto-revocation reasons</p>
        <div className='flex flex-col gap-1'>
          {Object.entries(JOYSTICK_INVALID_REASONS).map(([code, label]) => (
            <div key={code} className='flex items-center gap-2'>
              <span className='text-[9px] font-mono text-zinc-700 w-3 flex-shrink-0'>{code}</span>
              <span className='text-[9px] text-zinc-500'>{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
