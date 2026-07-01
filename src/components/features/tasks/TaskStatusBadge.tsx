import { FlightTaskStatusMap } from '@/lib/types/wayline';
import type { FlightTaskStatus } from '@/lib/types/wayline';

const statusColors: Record<FlightTaskStatus, string> = {
  1: 'bg-blue-500',     // Pending
  2: 'bg-blue-500',     // In Progress
  3: 'bg-green-500',    // Complete
  4: 'bg-red-500',      // Failed
  5: 'bg-red-500',      // Cancelled
  6: 'bg-yellow-500',   // Paused
};

interface TaskStatusBadgeProps {
  status: number;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const safeStatus = (status in FlightTaskStatusMap ? status : 1) as FlightTaskStatus;
  const label = FlightTaskStatusMap[safeStatus];
  const color = statusColors[safeStatus];

  return (
    <span className='inline-flex items-center gap-1.5'>
      <span
        className={`w-2 h-2 rounded-full ${color} ${safeStatus === 2 ? 'animate-pulse' : ''}`}
      />
      <span className='text-xs text-muted-foreground'>{label}</span>
    </span>
  );
}
