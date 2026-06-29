'use client';
import { memo } from 'react';
import { useElementGroups } from '@/hooks/useMapElements';
import { useDJIDevices } from '@/hooks/useDJIDevices';

type ChipColor = 'blue' | 'green' | 'red' | 'yellow' | 'gray';

const dotColors: Record<ChipColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-zinc-600',
};

const themeColors: Record<ChipColor, string> = {
  blue: 'border-blue-500/15 bg-blue-950/20 text-blue-400',
  green: 'border-green-500/15 bg-green-950/20 text-green-400',
  red: 'border-red-500/15 bg-red-950/20 text-red-400',
  yellow: 'border-yellow-500/15 bg-yellow-950/20 text-yellow-400',
  gray: 'border-zinc-800/60 bg-zinc-900/30 text-zinc-400',
};

interface StatusChipProps {
  color: ChipColor;
  label: string;
  value: string | number;
}

const StatusChip = memo(({ color, label, value }: StatusChipProps) => {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border backdrop-blur-sm transition-all ${themeColors[color]}`}
    >
      {/* Dynamic pulse for live/active systems */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[color]} ${
          color !== 'gray' ? 'animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.2)]' : ''
        }`}
      />

      <div className='flex flex-col min-w-0'>
        {/* Responsive sub-label using CSS clamp */}
        <span className='text-[clamp(8px,1.2vw,10px)] font-bold text-zinc-500 uppercase tracking-wider leading-tight truncate'>
          {label}
        </span>
        {/* Fluid value metric using CSS clamp */}
        <span className='text-[clamp(11px,1.5vw,13px)] font-semibold text-zinc-200 leading-none font-mono mt-0.5 whitespace-nowrap'>
          {value}
        </span>
      </div>
    </div>
  );
});

StatusChip.displayName = 'StatusChip';

export const MapStatusHeader = memo(() => {
  const { data: elementGroups = [] } = useElementGroups();
  const { data: djiDevices = [] } = useDJIDevices();

  const totalElements = elementGroups.reduce((acc, g) => acc + g.elements.length, 0);
  // Domain 0 = Drone, Domain 2 = RC per DJI standards
  const onlineDrones = djiDevices.filter((d) => d.domain === '0' && d.status).length;
  // Domain 1 or 3 = Edge Deployment Docks
  const onlineDocks = djiDevices.filter(
    (d) => (d.domain === '1' || d.domain === '3') && d.status
  ).length;

  return (
    <div className='flex flex-wrap items-center gap-1.5 sm:gap-3 mb-4 sm:mb-6 select-none'>
      <StatusChip color='blue' label='Map Layers' value={`${elementGroups.length} Groups`} />
      <StatusChip color='green' label='Geospatial Assets' value={`${totalElements} Elements`} />
      <StatusChip
        color={onlineDrones > 0 ? 'red' : 'gray'}
        label='Drones Online'
        value={`${onlineDrones} Active`}
      />
      <StatusChip
        color={onlineDocks > 0 ? 'yellow' : 'gray'}
        label='Docks Online'
        value={`${onlineDocks} Active`}
      />
    </div>
  );
});

MapStatusHeader.displayName = 'MapStatusHeader';
