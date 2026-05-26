'use client';

import React, { useState } from 'react';
import { Activity, Cpu, Send, Home, Camera, Monitor, CloudRain } from 'lucide-react';
import TelemetryStreamPanel from '@/components/features/control/TelemetryStreamPanel';
import type { TelemetryStreamPanelProps } from '@/components/features/control/TelemetryStreamPanel';
import type { DJIDevice } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceRowProps {
  name: string;
  type: string;
  status: string;
  icon: React.ElementType;
}

export interface SystemStatusFooterProps extends TelemetryStreamPanelProps {
  deviceList?: DJIDevice[];
}

// ─── Device icon/type helpers ─────────────────────────────────────────────────

function deviceIcon(domain: string): React.ElementType {
  if (domain === '0') return Send;      // drone
  if (domain === '1') return Home;      // dock
  if (domain === '2') return Monitor;   // RC
  return Camera;
}

function deviceTypeLabel(domain: string): string {
  if (domain === '0') return 'UAV Platform';
  if (domain === '1') return 'Docking Station';
  if (domain === '2') return 'Remote Controller';
  return 'Payload';
}

function deviceStatusLabel(device: DJIDevice): string {
  return device.status ? 'Online' : 'Offline';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DeviceRow = ({ name, type, status, icon: Icon }: DeviceRowProps) => {
  const isOnline = status === 'Online';
  return (
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
        <span className='text-[10px] font-semibold text-[#45F0CF] font-poppins border border-[#45F0CF]/30 px-2 py-0.5 rounded'>
          {status}
        </span>
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              : 'bg-zinc-600'
          }`}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SystemStatusFooter = ({ droneData, elapsedTime, deviceList = [] }: SystemStatusFooterProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

  const onlineCount = deviceList.filter((d) => d.status).length;

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none'>
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
              Telemetry Stream
            </span>
          </div>

          <div className='flex items-center justify-end w-[440px] gap-4 pl-4 border-l border-zinc-800/50'>
            <div className='flex items-center gap-3'>
              <Cpu size={16} className='text-zinc-400' strokeWidth={2.5} />
              <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
                Network Devices
              </span>
            </div>
            <div className='px-2 py-0.5 bg-red-600/10 border border-red-600/40 rounded-md flex items-center'>
              <span className='text-[9px] font-black text-red-600 tracking-widest uppercase p-1'>
                {onlineCount} Online
              </span>
            </div>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out rounded-b-lg bg-[#1A1C20] ${
            expanded ? 'max-h-[300px] opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='flex items-stretch justify-between px-6 py-4 gap-6 h-[220px]'>
            {/* Telemetry metrics grid */}
            <TelemetryStreamPanel droneData={droneData} elapsedTime={elapsedTime} />

            {/* Device list */}
            <div className='w-[440px] flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar'>
              {deviceList.length === 0 ? (
                <p className='text-center text-[10px] text-zinc-600 py-6'>No devices found</p>
              ) : (
                deviceList.map((d) => (
                  <DeviceRow
                    key={d.deviceSn}
                    name={d.nickname || d.deviceName}
                    type={deviceTypeLabel(d.domain)}
                    status={deviceStatusLabel(d)}
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
