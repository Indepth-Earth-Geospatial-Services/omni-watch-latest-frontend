'use client';

import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskActionsMenu } from './TaskActionsMenu';
import type { WaylineJobItem } from '@/lib/types';

const taskTypeMap: Record<number, string> = {
  0: 'Immediate',
  1: 'Timed',
  2: 'Conditional',
};

const lostActionMap: Record<number, string> = {
  0: 'Return to Home',
  1: 'Hover',
  2: 'Land',
};

const waylineTypeMap: Record<number, string> = {
  0: 'Waypoint',
  1: 'Mapping',
  2: 'Oblique',
};

function formatTimestamp(ts: string): string {
  if (!ts || ts === '0001-01-01 00:00:00') return '—';
  return ts.replace('T', ' ').slice(0, 16);
}

interface TaskTableProps {
  tasks: WaylineJobItem[];
  isLoading: boolean;
  pagination: { page: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDelete: (task: WaylineJobItem) => void;
  onSuspend: (task: WaylineJobItem) => void;
  onResume: (task: WaylineJobItem) => void;
  onUploadMedia: (task: WaylineJobItem) => void;
}

export function TaskTable({
  tasks,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onSuspend,
  onResume,
  onUploadMedia,
}: TaskTableProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  if (isLoading && tasks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Loader2 size={16} className='text-zinc-600 animate-spin' />
        <p className='text-xs font-poppins text-zinc-600 mt-2'>Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-xs font-poppins text-zinc-600'>No tasks found</p>
      </div>
    );
  }

  return (
    <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-xs font-poppins'>
          <thead>
            <tr className='border-b border-zinc-800/50 text-zinc-500'>
              <th className='px-3 py-3 text-left font-medium'>Planned/Actual Time</th>
              <th className='px-3 py-3 text-left font-medium'>Status</th>
              <th className='px-3 py-3 text-left font-medium'>Plan Name</th>
              <th className='px-3 py-3 text-left font-medium'>Type</th>
              <th className='px-3 py-3 text-left font-medium'>Flight Route</th>
              <th className='px-3 py-3 text-left font-medium'>Dock</th>
              <th className='px-3 py-3 text-left font-medium'>RTH Alt</th>
              <th className='px-3 py-3 text-left font-medium'>Lost Action</th>
              <th className='px-3 py-3 text-left font-medium'>Creator</th>
              <th className='px-3 py-3 text-left font-medium'>Media</th>
              <th className='px-3 py-3 text-right font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.job_id}
                className='border-b border-zinc-800/30 hover:bg-zinc-900/50 transition-colors'
              >
                <td className='px-3 py-3'>
                  <div className='text-zinc-300'>{formatTimestamp(task.execute_time)}</div>
                  {task.completed_time && task.completed_time !== '0001-01-01 00:00:00' && (
                    <div className='text-zinc-600 text-[10px]'>Done: {formatTimestamp(task.completed_time)}</div>
                  )}
                </td>
                <td className='px-3 py-3'>
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className='px-3 py-3 text-zinc-300 max-w-[160px] truncate' title={task.job_name}>
                  {task.job_name}
                </td>
                <td className='px-3 py-3 text-zinc-400'>
                  {taskTypeMap[task.task_type] ?? `Type ${task.task_type}`}
                </td>
                <td className='px-3 py-3 text-zinc-400 max-w-[140px] truncate' title={task.file_name}>
                  {task.file_name}
                </td>
                <td className='px-3 py-3 text-zinc-400 max-w-[100px] truncate' title={task.dock_sn}>
                  {task.dock_sn}
                </td>
                <td className='px-3 py-3 text-zinc-400'>
                  {task.rth_altitude}m
                </td>
                <td className='px-3 py-3 text-zinc-400'>
                  {lostActionMap[task.out_of_control_action] ?? `Action ${task.out_of_control_action}`}
                </td>
                <td className='px-3 py-3 text-zinc-400'>
                  {task.username}
                </td>
                <td className='px-3 py-3 text-zinc-400'>
                  {task.media_count > 0 ? `${task.media_count} files` : '—'}
                </td>
                <td className='px-3 py-3 text-right'>
                  <TaskActionsMenu
                    task={task}
                    onDelete={onDelete}
                    onSuspend={onSuspend}
                    onResume={onResume}
                    onUploadMedia={onUploadMedia}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between px-3 py-3 border-t border-zinc-800/50'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-zinc-600'>Show</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className='bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none'
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className='text-xs text-zinc-600'>
            of {pagination.total} tasks
          </span>
        </div>
        <div className='flex items-center gap-1'>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className='p-1 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
          >
            <ChevronLeft className='w-4 h-4 text-zinc-400' />
          </button>
          <span className='px-2 text-xs text-zinc-400'>
            Page {pagination.page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className='p-1 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
          >
            <ChevronRight className='w-4 h-4 text-zinc-400' />
          </button>
        </div>
      </div>
    </div>
  );
}
