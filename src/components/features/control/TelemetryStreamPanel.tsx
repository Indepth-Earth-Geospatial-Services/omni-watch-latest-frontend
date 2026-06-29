'use client';

import React from 'react';
import { Battery, ArrowUpDown, Gauge, Compass, Signal, Target, Clock, Wind } from 'lucide-react';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';

export interface TelemetryStreamPanelProps {
  droneData?: ProcessedDroneData | null;
  elapsedTime?: string;
}

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
      <span className={`text-2xl font-bold leading-none font-poppins ${valueClass}`}>{value}</span>
      {unit && (
        <span className='text-xs font-medium text-zinc-400 mb-0.5 font-poppins'>{unit}</span>
      )}
    </div>
    {subtext && <span className='text-[10px] text-zinc-500 mt-1 font-poppins'>{subtext}</span>}
    {barValue !== undefined && (
      <div className='absolute bottom-0 left-0 w-full h-[3px] bg-zinc-800'>
        <div
          className='h-full bg-[#45F0CF] rounded-full transition-all duration-500'
          style={{ width: `${barValue}%` }}
        />
      </div>
    )}
  </div>
);

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
function degToCompass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

const TelemetryStreamPanel = ({ droneData, elapsedTime }: TelemetryStreamPanelProps) => {
  const battery      = droneData?.battery ?? 0;
  const altitude     = droneData?.altitude;
  const speedMs      = droneData?.speed;
  const heading      = droneData?.heading;
  const direction    = droneData?.direction;
  const online       = droneData?.online;
  const hasOSD       = droneData?.hasOSD;
  const gpsNumber    = droneData?.gpsNumber ?? 0;
  const isGPSFixed   = droneData?.isGPSFixed;
  const windSpeedMs  = droneData?.windSpeed;
  const windDir      = droneData?.windDirection;

  const batteryClass =
    battery < 20 ? 'text-red-400' : battery < 40 ? 'text-amber-400' : 'text-[#E2E2E8]';

  const metrics: MetricCardProps[] = [
    {
      label: 'Power Level',
      value: droneData ? String(battery) : '—',
      unit: droneData ? '%' : undefined,
      icon: Battery,
      valueClass: batteryClass,
      barValue: droneData ? battery : undefined,
    },
    {
      label: 'Altitude',
      value: altitude != null ? altitude.toFixed(1) : '—',
      unit: altitude != null ? 'm' : undefined,
      icon: ArrowUpDown,
    },
    {
      label: 'Airspeed',
      value: speedMs != null ? (speedMs * 3.6).toFixed(1) : '—',
      unit: speedMs != null ? 'km/h' : undefined,
      icon: Gauge,
    },
    {
      label: 'Heading',
      value: heading != null ? `${heading.toFixed(0)}°` : '—',
      unit: direction,
      icon: Compass,
    },
    {
      label: 'Link Signal',
      value: droneData ? (online ? 'Online' : 'Offline') : '—',
      subtext: droneData ? (hasOSD ? 'OSD Active' : 'Polling') : undefined,
      icon: Signal,
      valueClass: droneData ? (online ? 'text-[#45F0CF]' : 'text-red-400') : 'text-[#E2E2E8]',
    },
    {
      label: 'GPS',
      value: droneData ? (isGPSFixed ? 'RTK Fix' : gpsNumber > 0 ? 'GPS Fix' : 'No Fix') : '—',
      subtext: droneData ? `${gpsNumber} Sats` : undefined,
      icon: Target,
      valueClass: isGPSFixed
        ? 'text-[#45F0CF]'
        : gpsNumber > 0
          ? 'text-amber-400'
          : 'text-[#E2E2E8]',
    },
    {
      label: 'Flight Time',
      value: elapsedTime ?? '—',
      icon: Clock,
      valueClass: 'text-[#E2E2E8] text-xl',
    },
    {
      label: 'Wind',
      value:
        windSpeedMs != null && windSpeedMs > 0 ? (windSpeedMs * 3.6).toFixed(1) : '—',
      unit:
        windSpeedMs != null && windSpeedMs > 0
          ? `km/h ${windDir != null ? degToCompass(windDir) : ''}`.trim()
          : undefined,
      icon: Wind,
    },
  ];

  return (
    <div className='flex flex-col flex-1 min-w-0'>
      <div className='grid grid-cols-4 grid-rows-2 gap-2 flex-1'>
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
};

export default TelemetryStreamPanel;
