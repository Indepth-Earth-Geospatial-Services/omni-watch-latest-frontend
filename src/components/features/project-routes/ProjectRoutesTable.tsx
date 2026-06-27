'use client';

import { Route } from 'lucide-react';
import type { Wayline } from '@/lib/types';

const TEMPLATE_TYPE_MAP: Record<number, string> = {
  0: 'Waypoint',
  1: 'Mapping 2D',
  2: 'Mapping 3D',
  3: 'Inspection',
};

const templateBadge: Record<string, string> = {
  Waypoint: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'Mapping 2D': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'Mapping 3D': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  Inspection: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

function formatDate(unixMs: number): string {
  return new Date(unixMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface ProjectRoutesTableProps {
  waylines: Wayline[];
  isLoading: boolean;
  onUnassign: (wayline: Wayline) => void;
}

export function ProjectRoutesTable({ waylines, isLoading, onUnassign }: ProjectRoutesTableProps) {
  if (isLoading) {
    return (
      <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-zinc-800/50'>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Route Name</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Template Type</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Compatible Drones</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Created</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className='border-b border-zinc-800/20'>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-32' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-16' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-24' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-8' /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (waylines.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Route size={16} className='text-zinc-600' />
        <p className='text-xs font-poppins text-zinc-600 mt-2'>No flight routes assigned to this project</p>
      </div>
    );
  }

  return (
    <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-zinc-800/50'>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Route Name</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Template Type</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Compatible Drones</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Created</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {waylines.map((wayline) => (
            <tr
              key={wayline.id}
              className='border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors'
            >
              <td className='px-4 py-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0'>
                    <Route size={14} />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-bold text-zinc-100'>{wayline.name}</span>
                    <span className='text-[10px] text-zinc-500'>by {wayline.user_name}</span>
                  </div>
                </div>
              </td>
              <td className='px-4 py-4'>
                <div className='flex flex-wrap gap-1'>
                  {wayline.template_types.map((t) => {
                    const label = TEMPLATE_TYPE_MAP[t] ?? `Type ${t}`;
                    const badge = templateBadge[label] ?? 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
                    return (
                      <span
                        key={t}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className='px-4 py-4'>
                <span className='text-[10px] font-mono text-zinc-500'>
                  {wayline.drone_model_key}
                </span>
              </td>
              <td className='px-4 py-4'>
                <span className='text-[10px] text-zinc-500'>
                  {formatDate(wayline.create_time)}
                </span>
              </td>
              <td className='px-4 py-4'>
                <button
                  onClick={() => onUnassign(wayline)}
                  className='text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-1 hover:bg-red-500/10 transition-colors'
                >
                  Unassign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='flex items-center justify-center py-3'>
        <span className='text-[10px] font-poppins text-zinc-600'>
          {waylines.length} route{waylines.length !== 1 ? 's' : ''} total
        </span>
      </div>
    </div>
  );
}
