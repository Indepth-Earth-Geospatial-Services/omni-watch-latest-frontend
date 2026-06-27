'use client';

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Route,
} from 'lucide-react';
import type { Wayline } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WaylineTabType = 'All' | 'Favorited';

// ─── Template type mapping ────────────────────────────────────────────────────

const TEMPLATE_TYPE_MAP: Record<number, string> = {
  0: 'Waypoint',
  1: 'Mapping 2D',
  2: 'Mapping 3D',
  3: 'Inspection',
};

const templateBadge: Record<string, string> = {
  'Waypoint':   'bg-blue-500/20 text-blue-400',
  'Mapping 2D': 'bg-cyan-500/20 text-cyan-400',
  'Mapping 3D': 'bg-purple-500/20 text-purple-400',
  'Inspection': 'bg-yellow-500/20 text-yellow-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface WeylineTableProps {
  activeTab: WaylineTabType;
  onTabChange?: (tab: WaylineTabType) => void;
  searchQuery?: string;
  waylines: Wayline[];
  isLoading: boolean;
  onDelete?: (wayline: Wayline) => void;
  onDownload?: (wayline: Wayline) => void;
}

const PAGE_SIZE = 10;

const WeylineTable = ({
  activeTab,
  onTabChange,
  searchQuery = '',
  waylines,
  isLoading,
  onDelete,
  onDownload,
}: WeylineTableProps) => {
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const toggleFavorite = (id: string) => {
    setLocalFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isFavorited = (w: Wayline) => w.favorited || localFavorites.has(w.id);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((w) => w.id)));
    }
  };

  const tabFiltered = waylines.filter((w) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Favorited') return isFavorited(w);
    return true;
  });

  const filtered = tabFiltered.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.drone_model_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allSelected = paginated.length > 0 && selectedIds.size === paginated.length;

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-zinc-800/50'>
              <th className='px-4 py-3 w-8' />
              {['Route Name', 'Template Type', 'Drone', 'Favorited', 'Created', 'Actions'].map(
                (col) => (
                  <th key={col} className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className='border-b border-zinc-800/20'>
                <td className='px-4 py-3' />
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-40' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-28' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-5' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-8' /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Route size={16} className='text-zinc-600' />
        <p className='text-sm font-poppins text-zinc-600 mt-2'>
          {searchQuery ? 'No routes match your search.' : 'No flight routes found.'}
        </p>
      </div>
    );
  }

  return (
    <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
      {selectedIds.size > 0 && (
        <div className='flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/50'>
          <span className='text-sm font-poppins text-zinc-400'>
            {selectedIds.size} route{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-zinc-800/50'>
            <th className='px-4 py-3 w-8'>
              <button onClick={toggleSelectAll} className='text-zinc-500 hover:text-zinc-300'>
                {allSelected ? (
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <rect x='3' y='3' width='18' height='18' rx='2' />
                    <path d='M9 12l2 2 4-4' />
                  </svg>
                ) : (
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <rect x='3' y='3' width='18' height='18' rx='2' />
                  </svg>
                )}
              </button>
            </th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>Route Name</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>Template Type</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>Drone</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>Favorited</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>Created</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-zinc-500 uppercase'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((wayline) => {
            const labels = wayline.template_types.map((t) => TEMPLATE_TYPE_MAP[t] ?? `Type ${t}`);
            return (
              <tr
                key={wayline.id}
                className={`border-b border-zinc-800/20 hover:bg-zinc-800/30 transition-colors ${
                  selectedIds.has(wayline.id) ? 'bg-zinc-800/20' : ''
                }`}
              >
                <td className='px-4 py-3'>
                  <button onClick={() => toggleSelect(wayline.id)} className='text-zinc-500 hover:text-zinc-300'>
                    {selectedIds.has(wayline.id) ? (
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='text-sky-400'>
                        <rect x='3' y='3' width='18' height='18' rx='2' />
                        <path d='M9 12l2 2 4-4' />
                      </svg>
                    ) : (
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <rect x='3' y='3' width='18' height='18' rx='2' />
                      </svg>
                    )}
                  </button>
                </td>

                <td className='px-4 py-3'>
                  <span className='text-sm font-poppins text-[#E2E2E8] truncate max-w-[240px] block'>
                    {wayline.name}
                  </span>
                  <span className='text-xs font-poppins text-zinc-500 block'>
                    by {wayline.user_name}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  <div className='flex flex-wrap gap-1'>
                    {labels.map((t) => (
                      <span
                        key={t}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${templateBadge[t] ?? 'bg-zinc-600/30 text-zinc-500'}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>

                <td className='px-4 py-3'>
                  <span className='text-xs font-mono font-poppins text-zinc-400'>
                    {wayline.drone_model_key}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  <button
                    onClick={() => toggleFavorite(wayline.id)}
                    className='p-1 rounded hover:bg-zinc-700/50 transition-colors'
                    title={isFavorited(wayline) ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star
                      size={14}
                      className={isFavorited(wayline) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}
                    />
                  </button>
                </td>

                <td className='px-4 py-3'>
                  <span className='text-xs font-mono font-poppins text-zinc-400'>
                    {new Date(wayline.create_time).toLocaleDateString()}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => onDownload?.(wayline)}
                      className='p-1.5 rounded hover:bg-zinc-700/50 transition-colors'
                      title='Download wayline file'
                    >
                      <Download size={14} className='text-zinc-500 hover:text-zinc-300' />
                    </button>
                    <button
                      onClick={() => onDelete?.(wayline)}
                      className='p-1.5 rounded hover:bg-zinc-700/50 transition-colors'
                      title='Delete route'
                    >
                      <Trash2 size={14} className='text-zinc-500 hover:text-red-400' />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className='flex items-center justify-between px-4 py-3 border-t border-zinc-800/50'>
        <span className='text-xs font-poppins text-zinc-600'>
          {filtered.length} route{filtered.length !== 1 ? 's' : ''} total
        </span>
        {totalPages > 1 && (
          <div className='flex items-center gap-2'>
            <span className='text-sm font-poppins text-zinc-500'>
              Page {safePage} of {totalPages}
            </span>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeylineTable;
