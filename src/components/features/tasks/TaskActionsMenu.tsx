'use client';

import { MoreVertical, Trash2, Pause, Play, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WaylineJobItem } from '@/lib/types';

interface TaskActionsMenuProps {
  task: WaylineJobItem;
  onDelete: (task: WaylineJobItem) => void;
  onSuspend: (task: WaylineJobItem) => void;
  onResume: (task: WaylineJobItem) => void;
  onUploadMedia: (task: WaylineJobItem) => void;
}

export function TaskActionsMenu({
  task,
  onDelete,
  onSuspend,
  onResume,
  onUploadMedia,
}: TaskActionsMenuProps) {
  const actions: { label: string; icon: React.ReactNode; onClick: () => void; variant?: string }[] = [];

  if (task.status === 0) {
    actions.push({
      label: 'Delete',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: () => onDelete(task),
      variant: 'danger',
    });
  }

  if (task.status === 1) {
    actions.push({
      label: 'Suspend',
      icon: <Pause className='w-4 h-4' />,
      onClick: () => onSuspend(task),
    });
  }

  if (task.status === 4) {
    actions.push({
      label: 'Resume',
      icon: <Play className='w-4 h-4' />,
      onClick: () => onResume(task),
    });
  }

  if (task.status === 2 && task.media_count > 0) {
    actions.push({
      label: 'Upload Media',
      icon: <Upload className='w-4 h-4' />,
      onClick: () => onUploadMedia(task),
    });
  }

  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='p-1 rounded hover:bg-secondary transition-colors'>
          <MoreVertical className='w-4 h-4 text-muted-foreground' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onClick}
            className={action.variant === 'danger' ? 'text-red-500 focus:text-red-500' : ''}
          >
            {action.icon}
            <span className='ml-2'>{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
