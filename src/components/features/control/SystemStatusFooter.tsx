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
  AlertTriangle,
  X,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useExecuteJob, useRequestFlightAuthority } from '@/hooks/useDockController';
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
      <p className='text-xs font-semibold text-[#E2E2E8] font-poppins leading-none mb-0.5 truncate'>{name}</p>
      <p className='text-[10px] text-zinc-500 font-poppins'>{type}</p>
    </div>
    <div className='flex items-center gap-2 flex-shrink-0'>
      <span className={`text-[10px] font-semibold font-poppins border px-2 py-0.5 rounded ${
        online ? 'text-[#45F0CF] border-[#45F0CF]/30' : 'text-zinc-600 border-zinc-700/40'
      }`}>
        {online ? 'Online' : 'Offline'}
      </span>
      <div className={`w-1.5 h-1.5 rounded-full ${
        online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'
      }`} />
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
  label, icon: Icon, onClick, disabled, loading, variant = 'default',
}: CmdButtonProps) => {
  const base = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed';
  const styles: Record<string, string> = {
    default: 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 hover:border-zinc-500 hover:text-white',
    danger:  'bg-red-950/40 border-red-800/50 text-red-400 hover:bg-red-900/50 hover:border-red-600 hover:text-red-200',
    confirm: 'bg-amber-900/50 border-amber-600/60 text-amber-300 animate-pulse',
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled || loading}>
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

interface DebugCommandsPanelProps {
  dockSn: string;
  dockOnline: boolean;
  dockModeCode?: number;
}

const DOCK_MODE_LABELS: Record<number, string> = {
  0: 'Idle',
  1: 'On-site Debug',
  2: 'Remote Debug',
  3: 'Upgrading',
  4: 'In Operation',
};

const DebugCommandsPanel = ({ dockSn, dockOnline, dockModeCode = -1 }: DebugCommandsPanelProps) => {
  // Optimistic toggle state — synced with MQTT mode_code when available
  const [debugActive, setDebugActive] = useState(false);
  const [isToggling, setIsToggling]   = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Keep local toggle in sync with the real dock state from MQTT.
  // Skip while a toggle is in-flight to avoid wiping the optimistic state
  // before the dock's mode_code has actually changed.
  useEffect(() => {
    if (dockModeCode === -1) return;
    if (isToggling) return;
    console.log(`[Debug:MQTT] mode_code=${dockModeCode} (${DOCK_MODE_LABELS[dockModeCode] ?? 'unknown'}) → debugActive=${dockModeCode === 2}`);
    setDebugActive(dockModeCode === 2);
  }, [dockModeCode, isToggling]);
  const [confirmPending, setConfirmPending] = useState<string | null>(null);

  const { mutate: runJob, isPending } = useExecuteJob(dockSn);
  // Flight authority is required before debug_mode_open — DJI rejects the command without it
  const { mutate: grabAuthority } = useRequestFlightAuthority(dockSn);

  const exec = useCallback(
    (serviceIdentifier: string, body?: object) => {
      // Backend requires `action` on every /jobs/* call, even commands the
      // DJI thing-model marks as "Data: null" (cover_open, charge_open, etc.)
      const payload = { action: 0, ...body };
      runJob(
        { serviceIdentifier, body: payload },
        {
          onSuccess: () => toast.success(`${serviceIdentifier.replace(/_/g, ' ')} sent`),
          onError:   (err) => toast.error(`Command failed: ${err.message}`),
        },
      );
    },
    [runJob],
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
    [confirmPending, exec],
  );

  const handleDebugToggle = (on: boolean) => {
    console.log(`[Debug] toggle → on=${on} | dockOnline=${dockOnline} | dockModeCode=${dockModeCode} | dockSn=${dockSn}`);
    if (!dockOnline) {
      console.warn('[Debug] aborted — dock is offline');
      return;
    }
    setIsToggling(true);

    if (on) {
      console.log('[Debug] step 1 — grabbing flight authority…');
      grabAuthority(undefined, {
        onSuccess: () => {
          console.log('[Debug] step 2 — authority granted, sending debug_mode_open…');
          runJob(
            { serviceIdentifier: 'debug_mode_open', body: { action: 1 } },
            {
              onSuccess: () => {
                console.log('[Debug] step 3 — debug_mode_open accepted ✓');
                setDebugActive(true);
                setIsToggling(false);
                toast.success('Debug mode enabled');
              },
              onError: (err) => {
                console.error('[Debug] debug_mode_open failed:', err.message);
                setIsToggling(false);
                toast.error(`Debug mode failed: ${err.message}`);
              },
            },
          );
        },
        onError: (err) => {
          console.error('[Debug] grabAuthority failed:', err.message);
          setIsToggling(false);
          toast.error(`Authority grab failed: ${err.message}`);
        },
      });
    } else {
      console.log('[Debug] sending debug_mode_close…');
      runJob(
        { serviceIdentifier: 'debug_mode_close', body: { action: 0 } },
        {
          onSuccess: () => {
            console.log('[Debug] debug_mode_close accepted ✓');
            setDebugActive(false);
            setIsToggling(false);
            setConfirmPending(null);
            toast.success('Debug mode disabled');
          },
          onError: (err) => {
            console.error('[Debug] debug_mode_close failed:', err.message);
            setIsToggling(false);
            toast.error(`Debug mode failed: ${err.message}`);
          },
        },
      );
    }
  };

  const restricted = !debugActive || !dockOnline;

  return (
    <div className='flex flex-col gap-3 pb-2'>
      {/* ── Debug Mode toggle ── */}
      <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
        debugActive
          ? 'bg-amber-500/10 border-amber-500/40'
          : 'bg-[#13151A] border-zinc-800/50'
      }`}>
        <div>
          <p className='text-[11px] font-black text-zinc-200 uppercase tracking-wide'>Debug Mode</p>
          <p className='text-[9px] text-zinc-600 mt-0.5'>
            {!dockOnline
              ? 'Dock must be online to enable'
              : debugActive
              ? '⚠ Hardware commands are live'
              : 'Required for hardware commands'}
          </p>
          {dockModeCode !== -1 && (
            <p className='text-[9px] font-mono text-zinc-500 mt-0.5'>
              mode: {DOCK_MODE_LABELS[dockModeCode] ?? `unknown (${dockModeCode})`}
            </p>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {isToggling && <Loader2 size={13} className='animate-spin text-zinc-500' />}
          <Switch
            checked={debugActive}
            onCheckedChange={(on) => on ? setShowDebugModal(true) : handleDebugToggle(false)}
            disabled={!dockOnline || isToggling}
            aria-label='Toggle debug mode'
          />
        </div>
      </div>

      {/* ── Section A: Navigation (no debug required) ── */}
      <div>
        <SectionHeader title='Navigation' />
        <div className='flex flex-wrap gap-1.5'>
          <CmdButton label='Return Home' icon={Home}      onClick={() => exec('return_home')}        disabled={!dockOnline || isPending} />
          <CmdButton label='Cancel RTH'  icon={RotateCcw} onClick={() => exec('return_home_cancel')} disabled={!dockOnline || isPending} />
        </div>
      </div>

      {/* ── Section B: Dock Hardware ── */}
      <div>
        <SectionHeader title='Dock Hardware' />
        <div className='flex flex-wrap gap-1.5'>
          <CmdButton label='Open Cover'  icon={ChevronUp}   onClick={() => exec('cover_open')}             disabled={restricted || isPending} />
          <CmdButton label='Close Cover' icon={ChevronDown} onClick={() => exec('cover_close')}            disabled={restricted || isPending} />
          <CmdButton label='Charge On'   icon={Zap}         onClick={() => exec('charge_open')}            disabled={restricted || isPending} />
          <CmdButton label='Charge Off'  icon={Zap}         onClick={() => exec('charge_close')}           disabled={restricted || isPending} />
          <CmdButton label='Light On'    icon={Lightbulb}   onClick={() => exec('supplement_light_open')}  disabled={restricted || isPending} />
          <CmdButton label='Light Off'   icon={Lightbulb}   onClick={() => exec('supplement_light_close')} disabled={restricted || isPending} />
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
          <CmdButton label='Power On'  icon={Power}      onClick={() => exec('drone_open')}  disabled={restricted || isPending} />
          <CmdButton label='Power Off' icon={Power}      onClick={() => exec('drone_close')} disabled={restricted || isPending} />
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
          <CmdButton label='Alarm On'        icon={Siren}           onClick={() => exec('alarm_state_switch',         { action: 1 })} disabled={restricted || isPending} />
          <CmdButton label='Alarm Off'       icon={Siren}           onClick={() => exec('alarm_state_switch',         { action: 0 })} disabled={restricted || isPending} />
          <CmdButton label='Store Plan'      icon={BatteryCharging} onClick={() => exec('battery_store_mode_switch',  { action: 1 })} disabled={restricted || isPending} />
          <CmdButton label='Store Emergency' icon={BatteryCharging} onClick={() => exec('battery_store_mode_switch',  { action: 2 })} disabled={restricted || isPending} />
          <CmdButton label='Batt Maint On'   icon={BatteryCharging} onClick={() => exec('battery_maintenance_switch', { action: 1 })} disabled={restricted || isPending} />
          <CmdButton label='Batt Maint Off'  icon={BatteryCharging} onClick={() => exec('battery_maintenance_switch', { action: 0 })} disabled={restricted || isPending} />
          <CmdButton label='SDR Mode'        icon={Radio}           onClick={() => exec('sdr_workmode_switch',         { action: 0 })} disabled={restricted || isPending} />
          <CmdButton label='4G Fusion'       icon={Radio}           onClick={() => exec('sdr_workmode_switch',         { action: 1 })} disabled={restricted || isPending} />
        </div>
      </div>

      {/* ── Debug Mode Activation Modal ── */}
      {showDebugModal && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={() => setShowDebugModal(false)}
          />

          {/* Card */}
          <div className='relative z-10 w-full max-w-md mx-4 bg-[#0F1117] border border-amber-500/30 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden'>

            {/* Amber top bar */}
            <div className='h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600' />

            {/* Header */}
            <div className='flex items-start justify-between px-6 pt-5 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center'>
                  <AlertTriangle size={18} className='text-amber-400' />
                </div>
                <div>
                  <h2 className='text-sm font-black uppercase tracking-widest text-zinc-100'>
                    Activate Debug Mode
                  </h2>
                  <p className='text-[10px] text-amber-500/80 font-mono tracking-wide mt-0.5'>
                    REMOTE HARDWARE ACCESS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDebugModal(false)}
                className='text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5'
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div className='h-px bg-zinc-800/80 mx-6' />

            {/* Body */}
            <div className='px-6 py-4 space-y-4'>
              <p className='text-[11px] text-zinc-400 leading-relaxed'>
                Enabling debug mode grants direct hardware access to the dock and drone. Commands
                execute immediately with no additional confirmation.
              </p>

              {/* Warning checklist */}
              <div className='rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3 space-y-2'>
                <p className='text-[9px] font-black uppercase tracking-[0.18em] text-amber-500/70 mb-2'>
                  The following will become active
                </p>
                {[
                  'Dock cover open / close',
                  'Charging control',
                  'Supplemental lighting',
                  'Drone power on / off',
                  'Device reboot & format',
                  'Battery maintenance',
                ].map((item) => (
                  <div key={item} className='flex items-center gap-2'>
                    <div className='w-1 h-1 rounded-full bg-amber-400 flex-shrink-0' />
                    <span className='text-[10px] text-zinc-300'>{item}</span>
                  </div>
                ))}
              </div>

              <p className='text-[10px] text-zinc-600'>
                Debug mode will be reported via MQTT and visible to all operators. Deactivate when
                finished.
              </p>
            </div>

            {/* Actions */}
            <div className='flex gap-3 px-6 pb-6'>
              <button
                onClick={() => setShowDebugModal(false)}
                className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDebugModal(false);
                  handleDebugToggle(true);
                }}
                className='flex-1 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/30 hover:border-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.1)]'
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SystemStatusFooter = ({
  deviceList = [],
  dockSn,
  dockOnline = false,
  dockModeCode = -1,
}: SystemStatusFooterProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((p) => !p);

  // Only show the selected dock and its directly paired drone
  const pairedDevices = useMemo(() => {
    if (!dockSn) return [];
    const dock = deviceList.find((d) => d.deviceSn === dockSn);
    if (!dock) return [];
    const drone = dock.childDeviceSn
      ? deviceList.find((d) => d.deviceSn === dock.childDeviceSn) ?? null
      : null;
    return [dock, drone].filter((d): d is DJIDevice => d !== null);
  }, [deviceList, dockSn]);

  const onlineCount = pairedDevices.filter((d) => d.status).length;

  return (
    <div className='fixed bottom-0 left-0 lg:left-64 right-0 z-50 flex flex-col items-center pointer-events-none'>
      <div className='w-[calc(100%-48px)] bg-[#0A0C10] shadow-2xl pointer-events-auto'>
        {/* Drag handle */}
        <div className='flex flex-col items-center gap-1 py-2 cursor-pointer group' onClick={toggle}>
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
              <DebugCommandsPanel dockSn={dockSn ?? ''} dockOnline={dockOnline} dockModeCode={dockModeCode} />
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
