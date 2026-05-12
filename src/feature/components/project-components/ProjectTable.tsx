'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  PlaneTakeoff,
  Home,
  ChevronLeft,
  ChevronRight,
  Download,
  Archive,
} from 'lucide-react';
import { ProjectTabType } from './ProjectTabs';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = 'ONLINE' | 'OFFLINE' | 'WARNING';

interface Project {
  id: string;
  name: string;
  model: string;
  serialNo: string;
  firmware: string;
  firmwareUpdate: boolean;
  workspace: string;
  status: ProjectStatus;
  archived: boolean;
  drones?: number;
  docks?: number;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const projects: Project[] = [
  {
    id: '1',
    name: 'Project Falcon',
    model: 'DJI Matrice 350 RTK',
    serialNo: 'SN-8829A',
    firmware: 'v4.2.1',
    firmwareUpdate: false,
    workspace: 'Alpha Zone',
    status: 'ONLINE',
    archived: false,
    drones: 3,
  },
  {
    id: '2',
    name: 'Operation Dawnwatch',
    model: 'Autel Dragonfish',
    serialNo: 'SN-DF221',
    firmware: 'v3.9.0',
    firmwareUpdate: true,
    workspace: 'Beta Sector',
    status: 'WARNING',
    archived: false,
    drones: 2,
  },
  {
    id: '3',
    name: 'Night Owl Perimeter',
    model: 'DJI Dock 2',
    serialNo: 'SN-DK990',
    firmware: 'v1.0.5',
    firmwareUpdate: false,
    workspace: 'Gamma Grid',
    status: 'OFFLINE',
    archived: false,
    drones: 8,
    docks: 4,
  },
  {
    id: '4',
    name: 'Border Scan Echo',
    model: 'Freefly Astro',
    serialNo: 'SN-FF402',
    firmware: 'v2.1.0',
    firmwareUpdate: false,
    workspace: 'Delta Line',
    status: 'ONLINE',
    archived: false,
    drones: 5,
    docks: 3,
  },
  {
    id: '5',
    name: 'Urban Mapping V2',
    model: 'Skydio X10',
    serialNo: 'SN-SK10X',
    firmware: 'v1.0.0',
    firmwareUpdate: false,
    workspace: 'City Core',
    status: 'ONLINE',
    archived: false,
    drones: 3,
  },
  {
    id: '6',
    name: 'Coastal Survey Alpha',
    model: 'DJI Matrice 30T',
    serialNo: 'SN-M30T1',
    firmware: 'v5.1.2',
    firmwareUpdate: true,
    workspace: 'Harbor West',
    status: 'WARNING',
    archived: false,
    drones: 4,
    docks: 2,
  },
  {
    id: '7',
    name: 'Archive: Grid Sweep 01',
    model: 'DJI Phantom 4 RTK',
    serialNo: 'SN-P4RT7',
    firmware: 'v2.0.0',
    firmwareUpdate: false,
    workspace: 'North Field',
    status: 'OFFLINE',
    archived: true,
    drones: 1,
  },
];

const PAGE_SIZE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBorderColor: Record<ProjectStatus, string> = {
  ONLINE: 'border-l-emerald-500',
  WARNING: 'border-l-yellow-500',
  OFFLINE: 'border-l-red-500',
};

const statusDot: Record<ProjectStatus, string> = {
  ONLINE: 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.7)]',
  WARNING: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.7)]',
  OFFLINE: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]',
};

const statusText: Record<ProjectStatus, string> = {
  ONLINE: 'text-emerald-400',
  WARNING: 'text-yellow-400',
  OFFLINE: 'text-red-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectTableProps {
  activeTab: ProjectTabType;
  searchQuery?: string;
}

const ProjectTable = ({ activeTab, searchQuery = '' }: ProjectTableProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Filter by tab
  const tabFiltered = projects.filter((p) => {
    if (activeTab === 'All') return !p.archived;
    if (activeTab === 'Active') return !p.archived && p.status === 'ONLINE';
    if (activeTab === 'Archived') return p.archived;
    // if (activeTab === 'Offline') return !p.archived && p.status === 'OFFLINE';
    return true;
  });

  // Filter by search
  const filtered = tabFiltered.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.workspace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      setSelected(new Set(paginated.map((p) => p.id)));
    }
  };

  const allChecked = paginated.length > 0 && selected.size === paginated.length;

  return (
    <div className='flex flex-col w-[calc(100%-2rem)] mx-4 font-poppins'>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className='flex items-center justify-between px-4 py-2.5 mb-2 bg-[#1C93FF]/10 border border-[#1C93FF]/20 rounded-lg'>
          <span className='text-sm font-semibold text-zinc-200'>
            {selected.size} project{selected.size > 1 ? 's' : ''} selected
          </span>
          <div className='flex items-center gap-2'>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 border border-zinc-700 rounded-md hover:border-zinc-500 transition-colors'>
              <Download size={12} /> Export
            </button>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 border border-zinc-700 rounded-md hover:border-zinc-500 transition-colors'>
              <Archive size={12} /> Archive
            </button>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-400 border border-red-500/30 rounded-md hover:border-red-500/60 transition-colors'>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='flex flex-col h-[743px] bg-[#1D2026] rounded-lg border border-zinc-800/50 overflow-hidden'>
        <div className='flex-1 overflow-y-auto overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[900px]'>
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
                {['Name', 'Model', 'Serial No', 'Firmware', 'Workspace', 'Status', 'Actions'].map(
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
                  <td colSpan={8} className='px-4 py-12 text-center text-sm text-zinc-600'>
                    No projects found.
                  </td>
                </tr>
              ) : (
                paginated.map((project) => {
                  const isChecked = selected.has(project.id);
                  return (
                    <tr
                      key={project.id}
                      className={`border-l-2 ${statusBorderColor[project.status]} transition-colors hover:bg-white/[0.02] ${isChecked ? 'bg-[#1C93FF]/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className='px-4 py-4'>
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={() => toggleSelect(project.id)}
                          className='w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-[#1C93FF] cursor-pointer'
                        />
                      </td>

                      {/* Name */}
                      <td className='px-4 py-4'>
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-bold text-zinc-100'>{project.name}</span>
                            <Link
                              href='/dashboard'
                              className='px-2.5 py-1.5 text-[10px] font-bold text-white bg-[#1C93FF] rounded hover:bg-[#1C93FF]/80 transition-colors'
                            >
                              Open Project
                            </Link>
                          </div>
                          <div className='flex items-center gap-3'>
                            {project.drones && (
                              <span className='flex items-center gap-1 text-[10px] text-zinc-500'>
                                <PlaneTakeoff size={10} /> {project.drones} Drones
                              </span>
                            )}
                            {project.docks && (
                              <span className='flex items-center gap-1 text-[10px] text-zinc-500'>
                                <Home size={10} /> {project.docks} Docks
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Model */}
                      <td className='px-4 py-4'>
                        <span className='text-sm text-zinc-300'>{project.model}</span>
                      </td>

                      {/* Serial No */}
                      <td className='px-4 py-4'>
                        <span className='text-sm font-mono text-zinc-400'>{project.serialNo}</span>
                      </td>

                      {/* Firmware */}
                      <td className='px-4 py-4'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border
                            ${
                              project.firmwareUpdate
                                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                            }`}
                        >
                          {project.firmware}
                          {project.firmwareUpdate ? ' (Update)' : ''}
                        </span>
                      </td>

                      {/* Workspace */}
                      <td className='px-4 py-4'>
                        <span className='text-sm text-zinc-300'>{project.workspace}</span>
                      </td>

                      {/* Status */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${statusDot[project.status]}`}
                          />
                          <span
                            className={`text-[11px] font-bold tracking-wider ${statusText[project.status]}`}
                          >
                            {project.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-1'>
                          <button className='p-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors'>
                            <Pencil size={13} />
                          </button>
                          <button className='p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors'>
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
            <span className='text-zinc-300 font-semibold'>{filtered.length}</span> projects
          </span>
          <div className='flex items-center gap-1'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded text-[11px] font-bold border transition-colors
                  ${
                    page === n
                      ? 'bg-[#1C93FF] border-[#1C93FF] text-white'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTable;
