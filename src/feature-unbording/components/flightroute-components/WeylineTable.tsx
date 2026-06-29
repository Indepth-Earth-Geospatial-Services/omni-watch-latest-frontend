'use client';

import React, { useState } from 'react';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Route,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateType = 'Waypoint' | 'Mapping 2D' | 'Mapping 3D' | 'Inspection';

export type WaylineTabType = 'All' | 'Favorited';

interface WaylineRoute {
  id: string;
  name: string;
  templateTypes: TemplateType[];
  droneModels: string[];
  favorited: boolean;
  createdAt: string;
  creator: string;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const routes: WaylineRoute[] = [
  {
    id: '1',
    name: 'Northern Perimeter Sweep',
    templateTypes: ['Waypoint'],
    droneModels: ['Matrice 350 RTK', 'Matrice 30T'],
    favorited: true,
    createdAt: '2026-04-10',
    creator: 'j.brown',
  },
  {
    id: '2',
    name: 'Delta Grid Mapping Run',
    templateTypes: ['Mapping 2D'],
    droneModels: ['Matrice 350 RTK'],
    favorited: false,
    createdAt: '2026-04-14',
    creator: 'r.chen',
  },
  {
    id: '3',
    name: 'Harbor Infrastructure Inspection',
    templateTypes: ['Inspection'],
    droneModels: ['Matrice 30T'],
    favorited: true,
    createdAt: '2026-03-28',
    creator: 'j.brown',
  },
  {
    id: '4',
    name: 'Urban Corridor 3D Model',
    templateTypes: ['Mapping 3D'],
    droneModels: ['Matrice 350 RTK', 'Matrice 3D'],
    favorited: false,
    createdAt: '2026-05-01',
    creator: 's.okafor',
  },
  {
    id: '5',
    name: 'Coastal Line Patrol',
    templateTypes: ['Waypoint'],
    droneModels: ['Matrice 30T'],
    favorited: false,
    createdAt: '2026-05-03',
    creator: 'r.chen',
  },
  {
    id: '6',
    name: 'Alpha Zone Thermal Scan',
    templateTypes: ['Inspection'],
    droneModels: ['Matrice 350 RTK', 'Matrice 30T'],
    favorited: true,
    createdAt: '2026-04-02',
    creator: 'j.brown',
  },
  {
    id: '7',
    name: 'Gamma Sector Boundary',
    templateTypes: ['Waypoint'],
    droneModels: ['Matrice 3D'],
    favorited: false,
    createdAt: '2026-05-08',
    creator: 's.okafor',
  },
  {
    id: '8',
    name: 'West Grid Photogrammetry',
    templateTypes: ['Mapping 2D', 'Mapping 3D'],
    droneModels: ['Matrice 350 RTK'],
    favorited: false,
    createdAt: '2026-05-09',
    creator: 'r.chen',
  },
];

const PAGE_SIZE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const templateBadge: Record<TemplateType, string> = {
  'Waypoint':   'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'Mapping 2D': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'Mapping 3D': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'Inspection': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface WeylineTableProps {
  activeTab: WaylineTabType;
  searchQuery?: string;
}

const WeylineTable = ({ activeTab, searchQuery = '' }: WeylineTableProps) => {
  const [items, setItems] = useState<WaylineRoute[]>(routes);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const toggleFavorite = (id: string) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, favorited: !r.favorited } : r))
    );
  };

  const bulkFavorite = (value: boolean) => {
    setItems((prev) =>
      prev.map((r) => (selected.has(r.id) ? { ...r, favorited: value } : r))
    );
    setSelected(new Set());
  };

  // Filter by tab
  const tabFiltered = items.filter((r) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Favorited') return r.favorited;
    return true;
  });

  // Filter by search
  const filtered = tabFiltered.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.droneModels.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination — reset to page 1 on filter change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((r) => r.id)));
    }
  };

  const allChecked = paginated.length > 0 && selected.size === paginated.length;

  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  return (
    <div className='flex flex-col w-[calc(100%-2rem)] mx-4 font-poppins'>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 mb-2 bg-[#1C93FF]/10 border border-[#1C93FF]/20 rounded-lg'>
          <span className='text-sm font-semibold text-zinc-200'>
            {selected.size} route{selected.size > 1 ? 's' : ''} selected
          </span>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end'>
            <button
              onClick={() => bulkFavorite(true)}
              className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-yellow-400 border border-yellow-500/30 rounded-md hover:border-yellow-500/60 transition-colors'
            >
              <Star size={12} /> Favorite
            </button>
            <button
              onClick={() => bulkFavorite(false)}
              className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 border border-zinc-700 rounded-md hover:border-zinc-500 transition-colors'
            >
              <Star size={12} /> Unfavorite
            </button>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-400 border border-red-500/30 rounded-md hover:border-red-500/60 transition-colors'>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Desktop view */}
      <div className='hidden md:flex flex-col h-[743px] bg-[#1D2026] rounded-lg border border-zinc-800/50 overflow-hidden'>
        <div className='flex-1 overflow-y-auto overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[860px]'>
            <thead className='sticky top-0 z-10'>
              <tr className='border-b border-[#424754] bg-[#1E2024]'>
                <th className='px-4 py-4 w-10'>
                  <input
                    type='checkbox'
                    checked={allChecked}
                    onChange={toggleAll}
                    className='w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-[#1C93FF] cursor-pointer'
                  />
                </th>
                {['Route Name', 'Template Type', 'Compatible Drones', 'Favorited', 'Created', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className='px-4 py-4 text-[10px] font-black tracking-[0.18em] text-zinc-500 uppercase'
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800/40'>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-12 text-center text-sm text-zinc-600'>
                    No routes found.
                  </td>
                </tr>
              ) : (
                paginated.map((route) => {
                  const isChecked = selected.has(route.id);
                  return (
                    <tr
                      key={route.id}
                      className={`border-l-2 border-l-zinc-700 transition-colors hover:bg-white/[0.02] ${isChecked ? 'bg-[#1C93FF]/5 border-l-[#1C93FF]' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className='px-4 py-4'>
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={() => toggleSelect(route.id)}
                          className='w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-[#1C93FF] cursor-pointer'
                        />
                      </td>

                      {/* Route Name */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0'>
                            <Route size={14} />
                          </div>
                          <div className='flex flex-col'>
                            <span className='text-sm font-bold text-zinc-100'>{route.name}</span>
                            <span className='text-[10px] text-zinc-500'>by {route.creator}</span>
                          </div>
                        </div>
                      </td>

                      {/* Template Types */}
                      <td className='px-4 py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {route.templateTypes.map((t) => (
                            <span
                              key={t}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${templateBadge[t]}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Compatible Drones */}
                      <td className='px-4 py-4'>
                        <div className='flex flex-col gap-0.5'>
                          {route.droneModels.map((m) => (
                            <span key={m} className='text-[11px] text-zinc-400 font-mono'>
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Favorited */}
                      <td className='px-4 py-4'>
                        <button
                          onClick={() => toggleFavorite(route.id)}
                          className='p-1.5 rounded transition-colors hover:bg-yellow-500/10'
                          title={route.favorited ? 'Unfavorite' : 'Favorite'}
                        >
                          <Star
                            size={16}
                            className={route.favorited ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}
                          />
                        </button>
                      </td>

                      {/* Created */}
                      <td className='px-4 py-4'>
                        <span className='text-[11px] font-mono text-zinc-400'>{route.createdAt}</span>
                      </td>

                      {/* Actions */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-1'>
                          <button
                            className='p-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors'
                            title='Download wayline file'
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className='p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'
                            title='Delete route'
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count + pagination — pinned to bottom */}
        <div className='flex-shrink-0 flex items-center justify-between px-6 py-3.5 border-t border-zinc-800/50 bg-[#191C22]'>
          <span className='text-[11px] text-zinc-500'>
            Showing <span className='text-zinc-300 font-semibold'>{paginated.length}</span> of{' '}
            <span className='text-zinc-300 font-semibold'>{filtered.length}</span> routes
          </span>
          <div className='flex items-center gap-1'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded text-[11px] font-bold border transition-colors
                  ${safePage === n
                    ? 'bg-[#1C93FF] border-[#1C93FF] text-white'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card List (Visible only on mobile/tablet) */}
      <div className='md:hidden flex flex-col gap-3'>
        {paginated.length === 0 ? (
          <div className='bg-[#1D2026] rounded-lg border border-zinc-800/50 p-8 text-center'>
            <Route className='w-8 h-8 text-zinc-700 mx-auto mb-2' />
            <p className='text-sm text-zinc-600'>No routes found.</p>
          </div>
        ) : (
          <>
            {paginated.map((route) => {
              const isChecked = selected.has(route.id);
              return (
                <div
                  key={route.id}
                  className={`bg-[#1D2026] rounded-lg border border-zinc-800/50 p-4 space-y-3 font-poppins relative transition-all
                    ${isChecked ? 'border-l-4 border-l-[#1C93FF] bg-[#1C93FF]/5' : 'border-l-4 border-l-zinc-700'}`}
                >
                  {/* Header */}
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <input
                        type='checkbox'
                        checked={isChecked}
                        onChange={() => toggleSelect(route.id)}
                        className='w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-[#1C93FF] cursor-pointer flex-shrink-0'
                      />
                      <div className='w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0'>
                        <Route size={14} />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-bold text-zinc-100 truncate'>
                          {route.name}
                        </p>
                        <p className='text-[10px] text-zinc-500'>
                          by {route.creator}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(route.id)}
                      className='p-1.5 rounded transition-colors hover:bg-yellow-500/10 flex-shrink-0'
                      title={route.favorited ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star
                        size={16}
                        className={route.favorited ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}
                      />
                    </button>
                  </div>

                  {/* Template Types */}
                  <div className='flex flex-wrap gap-1'>
                    {route.templateTypes.map((t) => (
                      <span
                        key={t}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${templateBadge[t]}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Details Grid */}
                  <div className='grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/30 text-xs'>
                    <div>
                      <span className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider block'>Compatible Drones</span>
                      <div className='flex flex-col gap-0.5 mt-0.5'>
                        {route.droneModels.map((m) => (
                          <span key={m} className='text-[10px] text-zinc-400 font-mono'>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider block'>Created</span>
                      <span className='text-zinc-400 block mt-1 font-mono'>{route.createdAt}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className='flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/20'>
                    <button
                      className='flex items-center gap-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors'
                      title='Download wayline file'
                    >
                      <Download size={12} /> Download
                    </button>
                    <button
                      className='flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'
                      title='Delete route'
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination for mobile */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between px-4 py-3 border border-zinc-800/50 bg-[#1D2026] rounded-lg mt-1'>
                <span className='text-[10px] text-zinc-500'>
                  Showing <span className='text-zinc-300 font-semibold'>{paginated.length}</span> of{' '}
                  <span className='text-zinc-300 font-semibold'>{filtered.length}</span>
                </span>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-zinc-900/50'
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-7 h-7 rounded text-[11px] font-bold border transition-colors
                        ${safePage === n
                          ? 'bg-[#1C93FF] border-[#1C93FF] text-white'
                          : 'border-zinc-800 text-zinc-500 bg-zinc-900/50'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-zinc-900/50'
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WeylineTable;
