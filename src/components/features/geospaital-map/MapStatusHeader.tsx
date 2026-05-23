'use client';
import { memo } from 'react';
import { useElementGroups } from '@/hooks/useMapElements';
import { useDJIDevices } from '@/hooks/useDJIDevices';

export const MapStatusHeader = memo(() => {
  const { data: elementGroups = [] } = useElementGroups();
  const { data: djiDevices = [] } = useDJIDevices();

  const totalElements = elementGroups.reduce((acc, g) => acc + g.elements.length, 0);
  // Count all online devices — domain values vary by DJI deployment (0/1/2/3)
  const onlineDrones = djiDevices.filter((d) => d.status).length;
  // Domain 1 = dock per DJI Cloud API standard; domain 3 used by some deployments
  const onlineDocks = djiDevices.filter((d) => (d.domain === '1' || d.domain === '3') && d.status).length;

  return (
    <div className='flex flex-wrap items-center gap-3 mb-6'>
      <StatusChip color='blue' label='Map Layers' value={`${elementGroups.length} Groups`} />
      <StatusChip
        color='green'
        label='Geospatial Assets'
        value={`${totalElements} Elements`}
      />
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

type ChipColor = 'blue' | 'green' | 'red' | 'yellow' | 'gray';

const dotColors: Record<ChipColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-gray-600',
};

function StatusChip({ color, label, value }: { color: ChipColor; label: string; value: string }) {
  return (
    <div className='bg-card border border-gray-800 px-4 py-2 rounded-lg flex items-center space-x-3'>
      <div className={`w-2 h-2 ${dotColors[color]} rounded-full animate-pulse`} />
      <div>
        <p className='text-[10px] text-gray-500 uppercase font-bold tracking-wider'>{label}</p>
        <p className='text-sm font-semibold'>{value}</p>
      </div>
    </div>
  );
}
