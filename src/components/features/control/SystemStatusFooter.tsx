'use client';

import React, { useState, useMemo } from 'react';
import { Activity, Cpu, Send, Home, Camera, Monitor } from 'lucide-react';
import type { JoystickInvalidState } from '@/hooks/useDockMQTT';
import type { DJIDevice } from '@/lib/types';
import { DebugCommandsPanel } from './DebugCommandsPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemStatusFooterProps {
  deviceList?: DJIDevice[];
  dockSn?: string;
  dockOnline?: boolean;
  dockModeCode?: number;
  joystickInvalidState?: JoystickInvalidState | null;
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

// ─── DeviceRow ────────────────────────────────────────────────────────────────

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

// ─── SystemStatusFooter ───────────────────────────────────────────────────────

const SystemStatusFooter = ({
  deviceList = [],
  dockSn,
  dockOnline = false,
  dockModeCode = -1,
  joystickInvalidState = null,
}: SystemStatusFooterProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((p) => !p);

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

            {/* Left: tabbed command panels — scrollable */}
            <div className='flex-1 min-w-0 overflow-y-auto pr-4 custom-scrollbar'>
              <DebugCommandsPanel
                dockSn={dockSn ?? ''}
                dockOnline={dockOnline}
                dockModeCode={dockModeCode}
                joystickInvalidState={joystickInvalidState}
              />
            </div>

            {/* Vertical divider */}
            <div className='w-px bg-zinc-800 flex-shrink-0 mx-4' />

            {/* Right: paired device list */}
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
