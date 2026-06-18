'use client';

import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  Power,
  Siren,
  BatteryCharging,
  Radio,
  Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { CmdButton, SectionHeader, DOCK_MODE_LABELS } from './ControlShared';

export interface DebugModeTabProps {
  debugActive: boolean;
  isToggling: boolean;
  dockOnline: boolean;
  dockModeCode: number;
  isPending: boolean;
  restricted: boolean;
  confirmPending: string | null;
  exec: (serviceIdentifier: string, body?: object) => void;
  handleDangerClick: (serviceIdentifier: string) => void;
  onToggle: (on: boolean) => void;
}

export const DebugModeTab = ({
  debugActive, isToggling, dockOnline, dockModeCode,
  isPending, restricted, confirmPending,
  exec, handleDangerClick, onToggle,
}: DebugModeTabProps) => (
  <div className='flex flex-col gap-3'>
    {/* Toggle card */}
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
      debugActive ? 'bg-amber-500/10 border-amber-500/40' : 'bg-[#13151A] border-zinc-800/50'
    }`}>
      <div className='flex-1 min-w-0 mr-3'>
        <p className='text-[11px] font-black text-zinc-200 uppercase tracking-wide'>Debug Mode</p>
        <p className='text-[9px] text-zinc-600 mt-0.5'>
          {!dockOnline ? 'Dock offline' : debugActive ? 'Hardware commands live' : 'Required for HW cmds'}
        </p>
        {dockModeCode !== -1 && (
          <p className='text-[9px] font-mono text-zinc-500 mt-0.5'>
            {DOCK_MODE_LABELS[dockModeCode] ?? `mode ${dockModeCode}`}
          </p>
        )}
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        {isToggling
          ? <Loader2 size={11} className='animate-spin text-zinc-500' />
          : <span className={`text-[9px] font-bold uppercase ${debugActive ? 'text-amber-400' : 'text-zinc-600'}`}>
              {debugActive ? 'Active' : 'Inactive'}
            </span>
        }
        <Switch
          checked={debugActive}
          onCheckedChange={onToggle}
          disabled={!dockOnline || isToggling}
          aria-label='Toggle debug mode'
        />
      </div>
    </div>

    {/* Dock Hardware */}
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

    {/* Drone Hardware */}
    <div>
      <SectionHeader title='Drone Hardware' />
      <div className='flex flex-wrap gap-1.5'>
        <CmdButton label='Power On'  icon={Power} onClick={() => exec('drone_open')}  disabled={restricted || isPending} />
        <CmdButton label='Power Off' icon={Power} onClick={() => exec('drone_close')} disabled={restricted || isPending} />
        <CmdButton
          label={confirmPending === 'drone_format' ? 'Confirm?' : 'Format Drone'}
          icon={ShieldAlert}
          onClick={() => handleDangerClick('drone_format')}
          disabled={restricted || isPending}
          variant={confirmPending === 'drone_format' ? 'confirm' : 'danger'}
        />
      </div>
    </div>

    {/* Advanced */}
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
  </div>
);
