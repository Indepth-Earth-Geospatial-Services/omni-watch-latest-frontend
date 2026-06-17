'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Send,
  Home,
  Camera,
  Monitor,
  ShieldAlert,
  RotateCcw,
  Zap,
  Lightbulb,
  Power,
  ChevronDown,
  ChevronUp,
  Siren,
  BatteryCharging,
  Radio,
  Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useExecuteJob } from '@/hooks/useDockController';
import type { DJIDevice } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemStatusFooterProps {
  deviceList?: DJIDevice[];
  dockSn?: string;
  dockOnline?: boolean;
  dockModeCode?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deviceIcon(domain: string): React.ElementType {
  if (domain === '0') return Send;
  if (domain === '1' || domain === '3') return Home;
  if (domain === '2') return Monitor;
  return Camera;
}

function deviceTypeLabel(domain: string): string {
  if (domain === '0') return 'UAV Platform';
  if (domain === '1' || domain === '3') return 'Docking Station';
  if (domain === '2') return 'Remote Controller';
  return 'Payload';
}

// ─── Reusable: DeviceRow ──────────────────────────────────────────────────────

interface DeviceRowProps {
  name: string;
  type: string;
  online: boolean;
  icon: React.ElementType;
}

const DeviceRow = ({ name, type, online, icon: Icon }: DeviceRowProps) => (
  <div className='flex items-center gap-3 py-2.5 border-b bg-[#33353980]/50 border-zinc-800/60 last:border-0 rounded-lg px-2'>
    <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 flex-shrink-0'>
      <Icon size={15} className='text-zinc-400' strokeWidth={1.5} />
    </div>
    <div className='flex-1 min-w-0'>
      <p className='text-xs font-semibold text-[#E2E2E8] font-poppins leading-none mb-0.5 truncate'>
        {name}
      </p>
      <p className='text-[10px] text-zinc-500 font-poppins'>{type}</p>
    </div>
    <div className='flex items-center gap-2 flex-shrink-0'>
      <span
        className={`text-[10px] font-semibold font-poppins border px-2 py-0.5 rounded ${
          online ? 'text-[#45F0CF] border-[#45F0CF]/30' : 'text-zinc-600 border-zinc-700/40'
        }`}
      >
        {online ? 'Online' : 'Offline'}
      </span>
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'
        }`}
      />
    </div>
  </div>
);

// ─── Reusable: CmdButton ─────────────────────────────────────────────────────

interface CmdButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'confirm';
}

const CmdButton = ({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading,
  variant = 'default',
}: CmdButtonProps) => {
  const base =
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed';
  const styles: Record<string, string> = {
    default:
      'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 hover:border-zinc-500 hover:text-white',
    danger:
      'bg-red-950/40 border-red-800/50 text-red-400 hover:bg-red-900/50 hover:border-red-600 hover:text-red-200',
    confirm: 'bg-amber-900/50 border-amber-600/60 text-amber-300 animate-pulse',
  };
  return (
    <button
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 size={11} className='animate-spin' /> : <Icon size={11} />}
      {label}
    </button>
  );
};

// ─── Reusable: SectionHeader ──────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <p className='text-[9px] font-black tracking-[0.18em] text-zinc-600 uppercase mb-1.5'>{title}</p>
);

// ─── DebugCommandsPanel ───────────────────────────────────────────────────────

const DOCK_MODES: Record<number, string> = {
  0: 'IDLE',
  1: 'On-site Debug',
  2: 'Remote Debug',
  3: 'Upgrading',
  4: 'In Operation',
};

interface DebugCommandsPanelProps {
  dockSn: string;
  dockOnline: boolean;
  dockModeCode: number;
}

const DebugCommandsPanel = ({ dockSn, dockOnline, dockModeCode }: DebugCommandsPanelProps) => {
  // Primary source of truth: OSD mode_code=2 means Remote Debugging.
  const osdDebugActive = dockModeCode === 2;

  // Optimistic fallback — activated on API success, cleared once OSD catches up.
  // Without MQTT, the WS may not relay dock mode_code changes in real time.
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  const debugActive = osdDebugActive || (optimisticActive === true);

  // When OSD finally reflects the real state, drop the optimistic value.
  useEffect(() => {
    if (optimisticActive !== null) {
      console.log(`[debug:osd] mode_code=${dockModeCode} (${DOCK_MODES[dockModeCode] ?? 'Unknown'}) — clearing optimistic state`);
      setOptimisticActive(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dockModeCode]);

  const [isToggling, setIsToggling] = useState(false);
  const [confirmPending, setConfirmPending] = useState<string | null>(null);

  const { mutate: runJob, isPending } = useExecuteJob(dockSn);

  // Always include action:0 — backend rejects any /jobs/* body without it,
  // even for services the DJI thing-model marks as "Data: null".
  const exec = useCallback(
    (serviceIdentifier: string, body: object = {}) => {
      const payload = { action: 0, ...body };
      console.log(`[debug] → ${serviceIdentifier}`, payload);
      runJob(
        { serviceIdentifier, body: payload },
        {
          onSuccess: () => {
            console.log(`[debug] ${serviceIdentifier} OK`);
            toast.success(`${serviceIdentifier.replace(/_/g, ' ')} sent`);
          },
          onError: (err) => {
            console.warn(`[debug] ${serviceIdentifier} failed`, err.message);
            toast.error(`Command failed: ${err.message}`);
          },
        }
      );
    },
    [runJob]
  );

  const handleDangerClick = useCallback(
    (serviceIdentifier: string) => {
      if (confirmPending === serviceIdentifier) {
        setConfirmPending(null);
        exec(serviceIdentifier);
      } else {
        setConfirmPending(serviceIdentifier);
        setTimeout(() => setConfirmPending(null), 3000);
      }
    },
    [confirmPending, exec]
  );

  const handleDebugToggle = (on: boolean) => {
    if (!dockOnline) return;

    if (on && dockModeCode !== 0) {
      const modeLabel = DOCK_MODES[dockModeCode] ?? String(dockModeCode);
      const proceed = window.confirm(
        `Dock is in state "${modeLabel}" (mode_code=${dockModeCode}).\n\n` +
        `Remote debug mode usually only succeeds from IDLE (0). Send debug_mode_open anyway?`
      );
      if (!proceed) {
        console.log(`[debug:toggle] debug_mode_open cancelled by operator (dock mode_code=${dockModeCode})`);
        return;
      }
    }

    const serviceIdentifier = on ? 'debug_mode_open' : 'debug_mode_close';
    console.log(`[debug:toggle] → ${serviceIdentifier} (current mode_code=${dockModeCode})`);
    setIsToggling(true);

    runJob(
      { serviceIdentifier, body: { action: 0 } },
      {
        onSuccess: () => {
          setIsToggling(false);
          if (!on) {
            setConfirmPending(null);
            setOptimisticActive(false);
          } else {
            // OSD may not update in real time — set optimistic state so the UI
            // reflects active immediately while waiting for WS confirmation.
            setOptimisticActive(true);
          }
          console.log(`[debug:toggle] ${serviceIdentifier} sent — waiting for OSD mode_code confirmation`);
          toast.success(on ? 'Debug mode enabled — hardware commands unlocked' : 'Debug mode disabled');
        },
        onError: (err) => {
          setIsToggling(false);
          console.warn(`[debug:toggle] ${serviceIdentifier} failed`, err.message);
          toast.error(`Debug mode failed: ${err.message}`);
        },
      }
    );
  };

  const modeLabel = DOCK_MODES[dockModeCode] ?? 'Unknown';
  const restricted = !debugActive || !dockOnline;

  return (
    <div className='flex flex-col gap-3 pb-2'>
      {/* ── Debug Mode toggle ── */}
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
          debugActive ? 'bg-amber-500/10 border-amber-500/40' : 'bg-[#13151A] border-zinc-800/50'
        }`}
      >
        <div>
          <p className='text-[11px] font-black text-zinc-200 uppercase tracking-wide'>Debug Mode</p>
          <p className='text-[9px] text-zinc-600 mt-0.5'>
            {!dockOnline
              ? 'Dock must be online to enable'
              : debugActive
              ? '⚠ Hardware commands are live'
              : 'Required for hardware commands'}
          </p>
          <p className='text-[9px] text-zinc-700 mt-0.5 font-mono'>
            dock={modeLabel} ({dockModeCode})
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isToggling && <Loader2 size={13} className='animate-spin text-zinc-500' />}
          <Switch
            checked={debugActive}
            onCheckedChange={handleDebugToggle}
            disabled={!dockOnline || isToggling}
            aria-label='Toggle debug mode'
          />
        </div>
      </div>

      {/* ── Section A: Navigation (no debug required) ── */}
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
        </div>
      </div>

      {/* ── Section B: Dock Hardware ── */}
      <div>
        <SectionHeader title='Dock Hardware' />
        <div className='flex flex-wrap gap-1.5'>
          <CmdButton
            label='Open Cover'
            icon={ChevronUp}
            onClick={() => exec('cover_open')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Close Cover'
            icon={ChevronDown}
            onClick={() => exec('cover_close')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Charge On'
            icon={Zap}
            onClick={() => exec('charge_open')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Charge Off'
            icon={Zap}
            onClick={() => exec('charge_close')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Light On'
            icon={Lightbulb}
            onClick={() => exec('supplement_light_open')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Light Off'
            icon={Lightbulb}
            onClick={() => exec('supplement_light_close')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label={confirmPending === 'device_reboot' ? 'Confirm?' : 'Reboot Dock'}
            icon={RotateCcw}
            onClick={() => handleDangerClick('device_reboot')}
            disabled={restricted || isPending}
            variant={confirmPending === 'device_reboot' ? 'confirm' : 'danger'}
          />
          <CmdButton
            label={confirmPending === 'device_format' ? 'Confirm?' : 'Format Dock'}
            icon={ShieldAlert}
            onClick={() => handleDangerClick('device_format')}
            disabled={restricted || isPending}
            variant={confirmPending === 'device_format' ? 'confirm' : 'danger'}
          />
        </div>
      </div>

      {/* ── Section C: Drone Hardware ── */}
      <div>
        <SectionHeader title='Drone Hardware' />
        <div className='flex flex-wrap gap-1.5'>
          <CmdButton
            label='Power On'
            icon={Power}
            onClick={() => exec('drone_open')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Power Off'
            icon={Power}
            onClick={() => exec('drone_close')}
            disabled={restricted || isPending}
          />
          <CmdButton
            label={confirmPending === 'drone_format' ? 'Confirm?' : 'Format Drone'}
            icon={ShieldAlert}
            onClick={() => handleDangerClick('drone_format')}
            disabled={restricted || isPending}
            variant={confirmPending === 'drone_format' ? 'confirm' : 'danger'}
          />
        </div>
      </div>

      {/* ── Section D: Advanced ── */}
      <div>
        <SectionHeader title='Advanced' />
        <div className='flex flex-wrap gap-1.5'>
          <CmdButton
            label='Alarm On'
            icon={Siren}
            onClick={() => exec('alarm_state_switch', { action: 1 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Alarm Off'
            icon={Siren}
            onClick={() => exec('alarm_state_switch', { action: 0 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Store Plan'
            icon={BatteryCharging}
            onClick={() => exec('battery_store_mode_switch', { action: 1 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Store Emergency'
            icon={BatteryCharging}
            onClick={() => exec('battery_store_mode_switch', { action: 2 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Batt Maint On'
            icon={BatteryCharging}
            onClick={() => exec('battery_maintenance_switch', { action: 1 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='Batt Maint Off'
            icon={BatteryCharging}
            onClick={() => exec('battery_maintenance_switch', { action: 0 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='SDR Mode'
            icon={Radio}
            onClick={() => exec('sdr_workmode_switch', { action: 0 })}
            disabled={restricted || isPending}
          />
          <CmdButton
            label='4G Fusion'
            icon={Radio}
            onClick={() => exec('sdr_workmode_switch', { action: 1 })}
            disabled={restricted || isPending}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SystemStatusFooter = ({
  deviceList = [],
  dockSn,
  dockOnline = false,
  dockModeCode = 0,
}: SystemStatusFooterProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((p) => !p);

  // Only show the selected dock and its directly paired drone
  const pairedDevices = useMemo(() => {
    if (!dockSn) return [];
    const dock = deviceList.find((d) => d.deviceSn === dockSn);
    if (!dock) return [];
    const drone = dock.childDeviceSn
      ? (deviceList.find((d) => d.deviceSn === dock.childDeviceSn) ?? null)
      : null;
    return [dock, drone].filter((d): d is DJIDevice => d !== null);
  }, [deviceList, dockSn]);

  const onlineCount = pairedDevices.filter((d) => d.status).length;

  return (
    <div className='fixed bottom-0 left-0 lg:left-64 right-0 z-50 flex flex-col items-center pointer-events-none'>
      <div className='w-[calc(100%-48px)] bg-[#0A0C10] shadow-2xl pointer-events-auto'>
        {/* Drag handle */}
        <div
          className='flex flex-col items-center gap-1 py-2 cursor-pointer group'
          onClick={toggle}
        >
          <div className='w-12 border-t-[2px] border-zinc-600 group-hover:border-white transition-colors rounded-full' />
          <div className='w-12 border-t-[2px] border-zinc-600 group-hover:border-white transition-colors rounded-full' />
        </div>

        {/* Persistent header */}
        <div
          className='flex items-center justify-between px-8 p-4 cursor-pointer bg-[#1A1C20] rounded-t-lg'
          onClick={toggle}
        >
          <div className='flex items-center gap-3 flex-1'>
            <Activity size={16} strokeWidth={2.5} className='text-zinc-400' />
            <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
              Command &amp; Control
            </span>
          </div>
          <div className='flex items-center justify-end w-[440px] gap-4 pl-4 border-l border-zinc-800/50'>
            <div className='flex items-center gap-3'>
              <Cpu size={16} className='text-zinc-400' strokeWidth={2.5} />
              <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
                Network Devices
              </span>
            </div>
            <div className='px-2 py-0.5 bg-emerald-600/10 border border-emerald-600/40 rounded-md flex items-center'>
              <span className='text-[9px] font-black text-emerald-400 tracking-widest uppercase p-1'>
                {onlineCount} Online
              </span>
            </div>
          </div>
        </div>

        {/* Expandable drawer */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out rounded-b-lg bg-[#1A1C20] ${
            expanded ? 'max-h-[420px] opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='flex items-stretch justify-between px-6 py-4 gap-0 h-[360px]'>
            {/* Left: debug controls — scrollable */}
            <div className='flex-1 min-w-0 overflow-y-auto pr-4 custom-scrollbar'>
              <DebugCommandsPanel
                dockSn={dockSn ?? ''}
                dockOnline={dockOnline}
                dockModeCode={dockModeCode}
              />
            </div>

            {/* Vertical divider */}
            <div className='w-px bg-zinc-800 flex-shrink-0 mx-4' />

            {/* Right: paired device list — dock + drone only */}
            <div className='w-[280px] flex-shrink-0 flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar'>
              <p className='text-[9px] font-black tracking-[0.18em] text-zinc-600 uppercase mb-1'>
                Paired Devices
              </p>
              {pairedDevices.length === 0 ? (
                <p className='text-center text-[10px] text-zinc-600 py-6'>
                  {dockSn ? 'Dock not found in device list' : 'No drone selected'}
                </p>
              ) : (
                pairedDevices.map((d) => (
                  <DeviceRow
                    key={d.deviceSn}
                    name={d.nickname || d.deviceName}
                    type={deviceTypeLabel(d.domain)}
                    online={d.status}
                    icon={deviceIcon(d.domain)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusFooter;
