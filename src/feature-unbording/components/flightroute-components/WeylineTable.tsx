'use client';

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Route,
  Eye,
} from 'lucide-react';
import type { Wayline } from '@/lib/types';
import WaylinePreviewModal from './WaylinePreviewModal';

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
  const [previewWayline, setPreviewWayline] = useState<Wayline | null>(null);

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
      <div className='bg-background border border-border/50 rounded-xl overflow-hidden'>
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-border/50'>
              <th className='px-4 py-3 w-8' />
              {['Route Name', 'Template Type', 'Drone', 'Favorited', 'Created', 'Actions'].map(
                (col) => (
                  <th key={col} className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className='border-b border-border/20'>
                <td className='px-4 py-3' />
                <td className='px-4 py-3'><div className='h-3.5 bg-secondary rounded animate-pulse w-40' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-secondary rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-secondary rounded animate-pulse w-28' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-secondary rounded animate-pulse w-5' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-secondary rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-secondary rounded animate-pulse w-8' /></td>
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
        <Route size={16} className='text-muted-foreground' />
        <p className='text-sm font-poppins text-muted-foreground mt-2'>
          {searchQuery ? 'No routes match your search.' : 'No flight routes found.'}
        </p>
      </div>
    );
  }

  return (
    <div className='bg-background border border-border/50 rounded-xl overflow-hidden'>
      {selectedIds.size > 0 && (
        <div className='flex items-center justify-between px-4 py-2 bg-secondary border-b border-border/50'>
          <span className='text-sm font-poppins text-muted-foreground'>
            {selectedIds.size} route{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-border/50'>
            <th className='px-4 py-3 w-8'>
              <button onClick={toggleSelectAll} className='text-muted-foreground hover:text-foreground'>
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
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>Route Name</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>Template Type</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>Drone</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>Favorited</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>Created</th>
            <th className='px-4 py-3 text-[11px] font-poppins font-medium text-muted-foreground uppercase'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((wayline) => {
            const labels = wayline.template_types.map((t) => TEMPLATE_TYPE_MAP[t] ?? `Type ${t}`);
            return (
              <tr
                key={wayline.id}
                className={`border-b border-border/20 hover:bg-secondary/30 transition-colors ${
                  selectedIds.has(wayline.id) ? 'bg-secondary/20' : ''
                }`}
              >
                <td className='px-4 py-3'>
                  <button onClick={() => toggleSelect(wayline.id)} className='text-muted-foreground hover:text-foreground'>
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
                  <span className='text-sm font-poppins text-foreground truncate max-w-[240px] block'>
                    {wayline.name}
                  </span>
                  <span className='text-xs font-poppins text-muted-foreground block'>
                    by {wayline.user_name}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  <div className='flex flex-wrap gap-1'>
                    {labels.map((t) => (
                      <span
                        key={t}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${templateBadge[t] ?? 'bg-muted/30 text-muted-foreground'}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>

                <td className='px-4 py-3'>
                  <span className='text-xs font-mono font-poppins text-muted-foreground'>
                    {wayline.drone_model_key}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  <button
                    onClick={() => toggleFavorite(wayline.id)}
                    className='p-1 rounded hover:bg-secondary/50 transition-colors'
                    title={isFavorited(wayline) ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star
                      size={14}
                      className={isFavorited(wayline) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}
                    />
                  </button>
                </td>

                <td className='px-4 py-3'>
                  <span className='text-xs font-mono font-poppins text-muted-foreground'>
                    {new Date(wayline.create_time).toLocaleDateString()}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  <div className='flex items-center gap-1'>
                    {wayline.object_key && (
                      <button
                        onClick={() => setPreviewWayline(wayline)}
                        className='p-1.5 rounded hover:bg-secondary/50 transition-colors'
                        title='Preview route on map'
                      >
                        <Eye size={14} className='text-muted-foreground hover:text-foreground' />
                      </button>
                    )}
                    <button
                      onClick={() => onDownload?.(wayline)}
                      className='p-1.5 rounded hover:bg-secondary/50 transition-colors'
                      title='Download wayline file'
                    >
                      <Download size={14} className='text-muted-foreground hover:text-foreground' />
                    </button>
                    <button
                      onClick={() => onDelete?.(wayline)}
                      className='p-1.5 rounded hover:bg-secondary/50 transition-colors'
                      title='Delete route'
                    >
                      <Trash2 size={14} className='text-muted-foreground hover:text-red-400' />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className='flex items-center justify-between px-4 py-3 border-t border-border/50'>
        <span className='text-xs font-poppins text-muted-foreground'>
          {filtered.length} route{filtered.length !== 1 ? 's' : ''} total
        </span>
        {totalPages > 1 && (
          <div className='flex items-center gap-2'>
            <span className='text-sm font-poppins text-muted-foreground'>
              Page {safePage} of {totalPages}
            </span>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <WaylinePreviewModal
        wayline={previewWayline}
        open={!!previewWayline}
        onClose={() => setPreviewWayline(null)}
      />
    </div>
  );
};

export default WeylineTable;
