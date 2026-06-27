import { FlightTaskStatusMap } from '@/lib/types/wayline';
import type { FlightTaskStatus } from '@/lib/types/wayline';

const statusColors: Record<FlightTaskStatus, string> = {
  0: 'bg-zinc-500',
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-red-500',
  4: 'bg-yellow-500',
  5: 'bg-zinc-500',
};

interface TaskStatusBadgeProps {
  status: number;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const safeStatus = (status in FlightTaskStatusMap ? status : 0) as FlightTaskStatus;
  const label = FlightTaskStatusMap[safeStatus];
  const color = statusColors[safeStatus];

  return (
    <span className='inline-flex items-center gap-1.5'>
      <span
        className={`w-2 h-2 rounded-full ${color} ${safeStatus === 1 ? 'animate-pulse' : ''}`}
      />
      <span className='text-xs text-zinc-300'>{label}</span>
    </span>
  );
}
