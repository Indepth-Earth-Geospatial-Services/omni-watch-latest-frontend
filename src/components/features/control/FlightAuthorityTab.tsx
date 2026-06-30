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
  Wifi,
  WifiOff,
  XCircle,
  Gamepad2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import type { JoystickInvalidState } from '@/hooks/useDockMQTT';
import type { DRCStatus } from '@/hooks/useDRC';
import { cancelAllJobs } from '@/services/djiservice-layer/dji-service';
import { CmdButton, SectionHeader, JOYSTICK_INVALID_REASONS } from './ControlShared';
import { ManualFlightActivateModal } from './ManualFlightActivateModal';

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
  /** Opens the unified FlightCommandModal; lat/lng are pre-filled from the caller */
  onOpenFlightCommand?: (lat: number | null, lng: number | null) => void;
  // DRC — owned by DebugCommandsPanel so the channel persists across tab switches
  drcStatus: DRCStatus;
  drcActivate: (dockSn: string) => Promise<void>;
  drcDeactivate: () => void;
  sendEmergencyStop: () => boolean;
  // Manual flight
  isManualFlightActive: boolean;
  onManualFlightToggle: (on: boolean) => void;
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
  title,
  subtitle,
  icon: Icon,
  expanded,
  disabled,
  colorClass,
  onToggle,
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
    {expanded ? (
      <ChevronUp size={10} className='text-zinc-500 flex-shrink-0' />
    ) : (
      <ChevronDown size={10} className='text-zinc-600 flex-shrink-0' />
    )}
  </button>
);

// ─── FlightAuthorityTab ───────────────────────────────────────────────────────

export const FlightAuthorityTab = ({
  dockSn,
  flightAuth,
  isGrabbingAuth,
  dockOnline,
  joystickInvalidState,
  isPending,
  onToggle,
  exec,
  droneAltitude = 0,
  onTakeoffSucceeded: _onTakeoffSucceeded,
  onOpenFlightCommand,
  drcStatus,
  drcActivate,
  drcDeactivate,
  sendEmergencyStop,
  isManualFlightActive,
  onManualFlightToggle,
}: FlightAuthorityTabProps) => {
  const [expanded, setExpanded] = useState<'flyto' | 'takeoff' | 'stop' | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const toggle = (section: 'flyto' | 'takeoff' | 'stop') =>
    setExpanded((prev) => (prev === section ? null : section));

  // Cancel all active dock jobs — clears stuck job state that blocks DRC connection
  const { mutate: cancelJobs, isPending: isCancellingJobs } = useMutation({
    mutationFn: () => cancelAllJobs(dockSn),
    onSuccess: () =>
      toast.success('Job cancel commands sent — dock should return to idle shortly.'),
    onError: (err: Error) => toast.error(`Cancel failed: ${err.message}`),
  });

  const noAuth = !flightAuth || !dockOnline;
  // Mirror the HTML reference: drone is "airborne" when altitude > 60m.
  // takeoff_to_point requires the drone to be in the dock (not airborne).
  // fly_to_point requires the drone to already be flying (airborne).
  const isAirborne = droneAltitude > 60;

  const handleEmergencyStop = () => {
    // Emergency stop MUST go via DRC MQTT — the REST /jobs endpoint does not work for this
    const sent = sendEmergencyStop();
    if (sent) {
      toast.success('Emergency stop sent via DRC channel');
    } else {
      toast.error(
        drcStatus === 'connecting'
          ? 'DRC channel is still connecting — try again in a moment.'
          : 'DRC channel not connected. Grant flight authority first to establish the DRC link.',
        { duration: 6000 }
      );
    }
  };

  return (
    <>
      <div className='flex flex-col gap-3'>
        {/* ── Authority toggle card ── */}
        <div
          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
            flightAuth ? 'bg-blue-500/10 border-blue-500/40' : 'bg-[#13151A] border-zinc-800/50'
          }`}
        >
          <div className='flex-1 min-w-0 mr-3'>
            <p className='text-[11px] font-black text-zinc-200 uppercase tracking-wide'>
              Flight Authority
            </p>
            <p className='text-[9px] text-zinc-600 mt-0.5'>
              {!dockOnline
                ? 'Dock offline'
                : flightAuth
                  ? 'Cloud has control — enables fly-to & DRC'
                  : 'Grab to enable cloud flight commands'}
            </p>
            {joystickInvalidState && (
              <p className='text-[9px] font-mono text-red-400/70 mt-0.5'>
                Lost:{' '}
                {JOYSTICK_INVALID_REASONS[joystickInvalidState.reason] ??
                  `reason ${joystickInvalidState.reason}`}
              </p>
            )}
            {!joystickInvalidState && flightAuth && (
              <p className='text-[9px] font-mono text-zinc-500 mt-0.5'>
                Pilot reclaims via stick input
              </p>
            )}
          </div>
          <div className='flex items-center gap-2 flex-shrink-0'>
            {isGrabbingAuth ? (
              <Loader2 size={11} className='animate-spin text-zinc-500' />
            ) : (
              <span
                className={`text-[9px] font-bold uppercase ${flightAuth ? 'text-blue-400' : 'text-zinc-600'}`}
              >
                {flightAuth ? 'Granted' : 'Not held'}
              </span>
            )}
            <Switch
              checked={flightAuth}
              onCheckedChange={onToggle}
              disabled={!dockOnline || isGrabbingAuth}
              aria-label='Toggle flight authority'
            />
          </div>
        </div>

        {/* ── Manual Flight Mode toggle card ── */}
        <div
          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
            isManualFlightActive
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-[#13151A] border-zinc-800/50'
          }`}
        >
          <div className='flex-1 min-w-0 mr-3'>
            <div className='flex items-center gap-1.5'>
              <Gamepad2 size={10} className={isManualFlightActive ? 'text-amber-400' : 'text-zinc-600'} />
              <p className='text-[11px] font-black text-zinc-200 uppercase tracking-wide'>
                Manual Flight
              </p>
            </div>
            <p className='text-[9px] text-zinc-600 mt-0.5'>
              {isManualFlightActive
                ? 'Active — keyboard/mouse controls enabled'
                : !flightAuth
                  ? 'Requires flight authority'
                  : drcStatus !== 'active'
                    ? 'Requires active DRC channel'
                    : 'Activate to take direct control via DRC'}
            </p>
          </div>
          <Switch
            checked={isManualFlightActive}
            onCheckedChange={(on) => {
              if (on) {
                setShowManualModal(true);
              } else {
                onManualFlightToggle(false);
              }
            }}
            disabled={!flightAuth || !dockOnline || drcStatus !== 'active'}
            aria-label='Toggle manual flight mode'
          />
        </div>

        {/* ── Fly-To Point accordion ── */}
        <div>
          <AccordionHeader
            id='flyto'
            title='Fly-To Point'
            subtitle={
              isAirborne
                ? 'Redirect airborne drone to GPS coords'
                : 'Drone must be airborne (alt > 60 m)'
            }
            icon={Send}
            expanded={expanded === 'flyto'}
            disabled={noAuth || !isAirborne}
            colorClass='bg-blue-500/10 border-blue-500/40 text-blue-300'
            onToggle={() => toggle('flyto')}
          />
          {expanded === 'flyto' && (
            <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
              <p className='text-[9px] text-zinc-500 leading-relaxed'>
                Redirect an airborne drone to one or more GPS waypoints. Supports multi-point routes
                — the drone visits each point in order.
              </p>
              <ul className='text-[8px] text-zinc-600 list-disc list-inside space-y-0.5'>
                <li>One or more target waypoints (lat, lng, height)</li>
                <li>Max flight speed</li>
                <li>Full error details shown on failure</li>
              </ul>
              <button
                onClick={() => onOpenFlightCommand?.(null, null)}
                className='w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/30 hover:border-blue-400 transition-colors'
              >
                Open Flight Command
              </button>
              <p className='text-[8px] text-zinc-600 text-center leading-relaxed'>
                Tip: right-click the tactical map to pre-fill coordinates
              </p>
            </div>
          )}
        </div>

        {/* ── One-Key Takeoff accordion ── */}
        <div>
          <AccordionHeader
            id='takeoff'
            title='One-Key Takeoff'
            subtitle={
              isAirborne
                ? 'Drone is airborne — use Fly-To instead'
                : 'Autonomous launch from dock to waypoint'
            }
            icon={ArrowUp}
            expanded={expanded === 'takeoff'}
            disabled={noAuth || isAirborne}
            colorClass='bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            onToggle={() => toggle('takeoff')}
          />
          {expanded === 'takeoff' && (
            <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
              <p className='text-[9px] text-zinc-500 leading-relaxed'>
                Configure target GPS, flight parameters, and fail-safe actions. The full form opens
                in a modal so all settings are visible before launch.
              </p>
              <ul className='text-[8px] text-zinc-600 list-disc list-inside space-y-0.5'>
                <li>Target GPS point + height</li>
                <li>Commander flight mode &amp; RTH altitude</li>
                <li>RC-lost and mission-loss fail-safe actions</li>
              </ul>
              {drcStatus !== 'active' && (
                <div className='flex items-start gap-1.5 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1.5'>
                  <span className='text-amber-400 text-[10px] leading-none mt-px'>⚠</span>
                  <p className='text-[8px] text-amber-400/80 leading-relaxed'>
                    DRC {drcStatus === 'connecting' ? 'is connecting' : 'not connected'} — Emergency
                    Stop will be unavailable in-flight.
                  </p>
                </div>
              )}
              <button
                onClick={() => onOpenFlightCommand?.(null, null)}
                className='w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 hover:border-emerald-400 transition-colors'
              >
                Open Flight Command
              </button>
              <p className='text-[8px] text-zinc-600 text-center leading-relaxed'>
                Tip: right-click the tactical map to pre-fill coordinates
              </p>
            </div>
          )}
        </div>

        {/* ── Emergency Stop accordion ── */}
        <div>
          <AccordionHeader
            id='stop'
            title='Emergency Stop'
            subtitle='Immediately halt drone mid-flight via DRC channel'
            icon={StopCircle}
            expanded={expanded === 'stop'}
            disabled={!dockOnline}
            colorClass='bg-red-500/10 border-red-500/40 text-red-300'
            onToggle={() => toggle('stop')}
          />
          {expanded === 'stop' && (
            <div className='mt-1.5 bg-[#0A0C10] rounded-lg border border-zinc-800/40 p-3 flex flex-col gap-2.5'>
              {/* DRC channel status row */}
              <div className='flex items-center gap-2'>
                {drcStatus === 'active' ? (
                  <Wifi size={10} className='text-emerald-400 flex-shrink-0' />
                ) : drcStatus === 'connecting' ? (
                  <Loader2 size={10} className='animate-spin text-amber-400 flex-shrink-0' />
                ) : (
                  <WifiOff size={10} className='text-zinc-600 flex-shrink-0' />
                )}
                <span
                  className={`text-[9px] font-mono uppercase tracking-wide ${
                    drcStatus === 'active'
                      ? 'text-emerald-400'
                      : drcStatus === 'connecting'
                        ? 'text-amber-400'
                        : drcStatus === 'error'
                          ? 'text-red-400'
                          : 'text-zinc-600'
                  }`}
                >
                  DRC{' '}
                  {drcStatus === 'active'
                    ? 'Connected'
                    : drcStatus === 'connecting'
                      ? 'Connecting…'
                      : drcStatus === 'error'
                        ? 'Error'
                        : 'Not Connected'}
                </span>

                {/* Exit button when active; manual re-connect when idle/errored */}
                {drcStatus === 'active' ? (
                  <button
                    onClick={() => drcDeactivate()}
                    className='ml-auto text-[8px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 border border-zinc-600/40 hover:border-zinc-400/60 rounded px-1.5 py-0.5 transition-colors'
                  >
                    Exit DRC
                  </button>
                ) : drcStatus !== 'connecting' && dockSn ? (
                  <button
                    onClick={() => {
                      drcActivate(dockSn).catch((err: Error) => {
                        toast.error(`DRC connect failed: ${err.message}`, { duration: 6000 });
                      });
                    }}
                    className='ml-auto text-[8px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/50 rounded px-1.5 py-0.5 transition-colors'
                  >
                    Connect
                  </button>
                ) : null}
              </div>

              <p className='text-[9px] text-zinc-500 leading-relaxed'>
                Publishes a stop command directly to the drone via the DRC MQTT channel. Use only
                when the drone must halt immediately.
              </p>
              <button
                onClick={handleEmergencyStop}
                className='w-full py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors'
              >
                ⚠ Emergency Stop
              </button>
            </div>
          )}
        </div>

        {/* ── Navigation (always available when dock online) ── */}
        <div>
          <SectionHeader title='Navigation' />
          <div className='flex flex-wrap gap-1.5'>
            <CmdButton
              label='Return Home'
              icon={Home}
              onClick={() => exec('return_home')}
              disabled={!dockOnline || isPending}
            />
            <CmdButton
              label='Cancel RTH'
              icon={RotateCcw}
              onClick={() => exec('return_home_cancel')}
              disabled={!dockOnline || isPending}
            />
            <CmdButton
              label={isCancellingJobs ? 'Cancelling…' : 'Cancel Active Job'}
              icon={isCancellingJobs ? Loader2 : XCircle}
              onClick={() => cancelJobs()}
              disabled={!dockOnline || isCancellingJobs}
            />
          </div>
          <p className='text-[8px] text-zinc-700 mt-1.5 leading-relaxed'>
            Cancel Active Job clears stuck fly-to-point, takeoff, and wayline missions. Use this if
            DRC refuses to connect or the dock appears stalled.
          </p>
        </div>

        {/* ── Auto-revocation reference ── */}
        <div className='rounded-lg bg-zinc-900/50 border border-zinc-800/40 px-3 py-2.5'>
          <p className='text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 mb-2'>
            Auto-revocation reasons
          </p>
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

      {/* ── Manual flight confirmation modal ── */}
      <ManualFlightActivateModal
        isOpen={showManualModal}
        onCancel={() => setShowManualModal(false)}
        onConfirm={() => {
          setShowManualModal(false);
          onManualFlightToggle(true);
        }}
      />
    </>
  );
};
//4.84194, 6.97565, 4.83356, 6.97606
// 4.838386, 6.976387