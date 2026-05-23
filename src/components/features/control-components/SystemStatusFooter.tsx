'use client';

import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Battery,
  ArrowUpDown,
  Gauge,
  Compass,
  Signal,
  Target,
  Clock,
  Home,
  Send,
  Camera,
  Monitor,
  CloudRain,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  icon: React.ElementType;
  valueClass?: string;
  barValue?: number;
}

interface Device {
  name: string;
  type: string;
  status: string;
  icon: React.ElementType;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const metrics: MetricCardProps[] = [
  {
    label: 'Power Level',
    value: '87',
    unit: '%',
    icon: Battery,
    valueClass: 'text-[#E2E2E8]',
    barValue: 87,
  },
  { label: 'Altitude', value: '120', unit: 'm', icon: ArrowUpDown },
  { label: 'Airspeed', value: '34', unit: 'km/h', icon: Gauge },
  { label: 'Heading', value: '247°', unit: 'SW', icon: Compass },
  {
    label: 'Link Signal',
    value: 'Strong',
    subtext: '-42 dBm',
    icon: Signal,
    valueClass: 'text-[#45F0CF]',
  },
  {
    label: 'GPS Accuracy',
    value: '±1.2m',
    subtext: '18 Sats Locked',
    icon: Target,
  },
  {
    label: 'Flight Time',
    value: '00:42:17',
    icon: Clock,
    valueClass: 'text-[#E2E2E8] text-xl',
  },
  { label: 'Distance to Home', value: '380', unit: 'm', icon: Home },
];

const devices: Device[] = [
  { name: 'Raptor-07', type: 'UAV-Platform', status: 'Active', icon: Send },
  {
    name: 'NestPoint-03',
    type: 'Docking-Station',
    status: 'Ready',
    icon: Home,
  },
  {
    name: 'Zenmuse H20T',
    type: 'Payload-RGB/IR',
    status: 'Streaming',
    icon: Camera,
  },
  { name: 'ComLink-A', type: 'Data-Terminal', status: 'Linked', icon: Monitor },
  {
    name: 'WeatherNode-1',
    type: 'Weather-Station',
    status: 'Active',
    icon: CloudRain,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricCard = ({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  valueClass = 'text-[#E2E2E8]',
  barValue,
}: MetricCardProps) => (
  <div className='relative flex flex-col justify-between bg-[#333539] border border-zinc-800/50 rounded-lg p-3 overflow-hidden'>
    <div className='flex items-start justify-between mb-2'>
      <span className='text-[9px] font-semibold tracking-[0.15em] text-[#8C90A0] uppercase font-poppins'>
        {label}
      </span>
      <Icon size={14} className='text-zinc-500 flex-shrink-0' strokeWidth={1.5} />
    </div>
    <div className='flex items-end gap-1'>
      <span className={`text-2xl font-bold leading-none font-poppins ${valueClass}`}>{value}</span>
      {unit && (
        <span className='text-xs font-medium text-zinc-400 mb-0.5 font-poppins'>{unit}</span>
      )}
    </div>
    {subtext && <span className='text-[10px] text-zinc-500 mt-1 font-poppins'>{subtext}</span>}
    {barValue !== undefined && (
      <div className='absolute bottom-0 left-0 w-full h-[3px] bg-zinc-800'>
        <div
          className='h-full bg-[#45F0CF] rounded-full transition-all'
          style={{ width: `${barValue}%` }}
        />
      </div>
    )}
  </div>
);

// const TelemetryStreamPanel = () => (

// );

const DeviceRow = ({ name, type, status, icon: Icon }: Device) => (
  <div className='flex items-center gap-3 py-2.5 border-b bg-[#33353980]/50 border-zinc-800/60 last:border-0 rounded-lg px-2'>
    <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 flex-shrink-0'>
      <Icon size={15} className='text-zinc-400' strokeWidth={1.5} />
    </div>
    <div className='flex-1 min-w-0'>
      <p className='text-xs font-semibold text-[#E2E2E8] font-poppins leading-none mb-0.5'>
        {name}
      </p>
      <p className='text-[10px] text-zinc-500 font-poppins'>{type}</p>
    </div>
    <div className='flex items-center gap-2 flex-shrink-0'>
      <span className='text-[10px] font-semibold text-[#45F0CF] font-poppins border border-[#45F0CF]/30 px-2 py-0.5 rounded'>
        {status}
      </span>
      <div className='w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SystemStatusFooter = () => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none'>
      {/* Container with background and border - Only this has pointer events */}
      <div className='w-[calc(100%-48px)] bg-[#0A0C10] shadow-2xl pointer-events-auto'>
        {/* 1. Drag Handle Toggle Area */}
        <div
          className='flex flex-col items-center gap-1 py-2 cursor-pointer group'
          onClick={toggle}
        >
          <div className='w-12 border-t-[2px] border-zinc-600 group-hover:border-white transition-colors rounded-full' />
          <div className='w-12 border-t-[2px] border-zinc-600 group-hover:border-white transition-colors rounded-full' />
        </div>

        {/* 2. PERSISTENT HEADER BAR (Telemetry Stream + Network Devices) */}
        <div
          className='flex items-center justify-between px-8 p-4 cursor-pointer bg-[#1A1C20] rounded-t-lg'
          onClick={toggle}
        >
          {/* Left Header */}
          <div className='flex items-center gap-3 flex-1'>
            <Activity size={16} strokeWidth={2.5} className='text-zinc-400' />
            <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
              Telemetry Stream
            </span>
          </div>

          {/* Right Header */}
          <div className='flex items-center justify-end w-[440px] gap-4 pl-4 border-l border-zinc-800/50'>
            <div className='flex items-center gap-3'>
              <Cpu size={16} className='text-zinc-400' strokeWidth={2.5} />
              <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
                Network Devices
              </span>
            </div>
            <div className='px-2 py-0.5 bg-red-600/10 border border-red-600/40 rounded-md flex items-center'>
              <span className='text-[9px] font-black text-red-600 tracking-widest uppercase p-1'>
                6 Online
              </span>
            </div>
          </div>
        </div>

        {/* 3. EXPANDABLE CONTENT (The Grids/Lists) */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out rounded-b-lg bg-[#1A1C20] ${
            expanded ? 'max-h-[300px] opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='flex items-stretch justify-between px-6 py-4 gap-6 h-[220px]'>
            {/* Left Grid */}
            <div className='grid grid-cols-4 gap-2 flex-1'>
              {metrics.map((m) => (
                <MetricCard key={m.label} {...m} />
              ))}
            </div>

            {/* Right List */}
            <div className='w-[440px] flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar'>
              {devices.map((d) => (
                <DeviceRow key={d.name} {...d} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusFooter;
