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
import { useExecuteJob } from '@/hooks/useDockController';
import type { JoystickInvalidState } from '@/hooks/useDockMQTT';
import { CmdButton, SectionHeader, JOYSTICK_INVALID_REASONS } from './ControlShared';
import { TakeoffToPointModal } from './TakeoffToPointModal';
import { FlyToPointModal } from './FlyToPointModal';

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
  droneAltitude?: number;
  onTakeoffSucceeded?: (lat: number, lng: number) => void;
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
  isPending, onToggle, exec, droneAltitude = 0, onTakeoffSucceeded,
}: FlightAuthorityTabProps) => {
  const [expanded, setExpanded] = useState<'flyto' | 'takeoff' | 'stop' | null>(null);
  const toggle = (section: 'flyto' | 'takeoff' | 'stop') =>
    setExpanded((prev) => (prev === section ? null : section));

  const [showTakeoffModal, setShowTakeoffModal] = useState(false);
  const [showFlyToModal,   setShowFlyToModal]   = useState(false);

  const { mutate: runJob, isPending: isStoppingDrc } = useExecuteJob(dockSn);

  const noAuth = !flightAuth || !dockOnline;
  // Mirror the HTML reference: drone is "airborne" when altitude > 60m.
  // takeoff_to_point requires the drone to be in the dock (not airborne).
  // fly_to_point requires the drone to already be flying (airborne).
  const isAirborne = droneAltitude > 60;

  const handleEmergencyStop = () => {
    runJob(
      { serviceIdentifier: 'drone_emergency_stop', body: { action: 0 } },
      {
        onSuccess: () => toast.success('Emergency stop sent'),
        onError:   (err) => {
          console.error('[EmergencyStop] ❌', err);
          toast.error(`Emergency stop failed: ${err.message}`);
        },
      },
    );
  };

  return (
    <>
      {showFlyToModal && (
        <FlyToPointModal dockSn={dockSn} onClose={() => setShowFlyToModal(false)} />
      )}
      {showTakeoffModal && (
        <TakeoffToPointModal
          dockSn={dockSn}
          onClose={() => setShowTakeoffModal(false)}
          onTakeoffSucceeded={onTakeoffSucceeded}
        />
      )}
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
          subtitle={isAirborne ? 'Redirect airborne drone to GPS coords' : 'Drone must be airborne (alt > 60 m)'}
          icon={Send}
          expanded={expanded === 'flyto'}
          disabled={noAuth || !isAirborne}
          colorClass='bg-blue-500/10 border-blue-500/40 text-blue-300'
          onToggle={() => toggle('flyto')}
        />
        {expanded === 'flyto' && (
          <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
            <p className='text-[9px] text-zinc-500 leading-relaxed'>
              Redirect an airborne drone to one or more GPS waypoints. Supports multi-point routes — the drone visits each point in order.
            </p>
            <ul className='text-[8px] text-zinc-600 list-disc list-inside space-y-0.5'>
              <li>One or more target waypoints (lat, lng, height)</li>
              <li>Max flight speed</li>
              <li>Full error details shown on failure</li>
            </ul>
            <button
              onClick={() => setShowFlyToModal(true)}
              className='w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/30 hover:border-blue-400 transition-colors'
            >
              Open Fly-To Form
            </button>
          </div>
        )}
      </div>

      {/* ── One-Key Takeoff accordion ── */}
      <div>
        <AccordionHeader
          id='takeoff'
          title='One-Key Takeoff'
          subtitle={isAirborne ? 'Drone is airborne — use Fly-To instead' : 'Autonomous launch from dock to waypoint'}
          icon={ArrowUp}
          expanded={expanded === 'takeoff'}
          disabled={noAuth || isAirborne}
          colorClass='bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
          onToggle={() => toggle('takeoff')}
        />
        {expanded === 'takeoff' && (
          <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
            <p className='text-[9px] text-zinc-500 leading-relaxed'>
              Configure target GPS, flight parameters, and fail-safe actions. The full form opens in a modal so all settings are visible before launch.
            </p>
            <ul className='text-[8px] text-zinc-600 list-disc list-inside space-y-0.5'>
              <li>Target GPS point + height</li>
              <li>Commander flight mode &amp; RTH altitude</li>
              <li>RC-lost and mission-loss fail-safe actions</li>
            </ul>
            <button
              onClick={() => setShowTakeoffModal(true)}
              className='w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 hover:border-emerald-400 transition-colors'
            >
              Open Launch Form
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
    </>
  );
};
