'use client';

import React from 'react';
import {
  Battery,
  ArrowUpDown,
  Gauge,
  Compass,
  Signal,
  Target,
  Clock,
  Home,
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  icon: React.ElementType;
  valueClass?: string;
  barValue?: number;
}

const MetricCard = ({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  valueClass = 'text-[#E2E2E8]',
  barValue,
}: MetricCardProps) => (
  <div className='relative flex flex-col justify-between bg-[#13151A] border border-zinc-800/50 rounded-lg p-3 overflow-hidden'>
    <div className='flex items-start justify-between mb-2'>
      <span className='text-[9px] font-semibold tracking-[0.15em] text-[#8C90A0] uppercase font-poppins'>
        {label}
      </span>
      <Icon size={14} className='text-zinc-500 flex-shrink-0' strokeWidth={1.5} />
    </div>
    <div className='flex items-end gap-1'>
      <span className={`text-2xl font-bold leading-none font-poppins ${valueClass}`}>
        {value}
      </span>
      {unit && (
        <span className='text-xs font-medium text-zinc-400 mb-0.5 font-poppins'>{unit}</span>
      )}
    </div>
    {subtext && (
      <span className='text-[10px] text-zinc-500 mt-1 font-poppins'>{subtext}</span>
    )}
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

const metrics: MetricCardProps[] = [
  {
    label: 'Power Level',
    value: '87',
    unit: '%',
    icon: Battery,
    valueClass: 'text-[#E2E2E8]',
    barValue: 87,
  },
  {
    label: 'Altitude',
    value: '120',
    unit: 'm',
    icon: ArrowUpDown,
  },
  {
    label: 'Airspeed',
    value: '34',
    unit: 'km/h',
    icon: Gauge,
  },
  {
    label: 'Heading',
    value: '247°',
    unit: 'SW',
    icon: Compass,
  },
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
  {
    label: 'Distance to Home',
    value: '380',
    unit: 'm',
    icon: Home,
  },
];

const TelemetryStreamPanel = () => (
  <div className='flex flex-col flex-1 min-w-0'>
    <div className='grid grid-cols-4 grid-rows-2 gap-2 flex-1'>
      {metrics.map((m) => (
        <MetricCard key={m.label} {...m} />
      ))}
    </div>
  </div>
);

export default TelemetryStreamPanel;
