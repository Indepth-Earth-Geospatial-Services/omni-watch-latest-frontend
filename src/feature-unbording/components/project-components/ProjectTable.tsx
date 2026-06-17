'use client';

import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Trash2,
  PlaneTakeoff,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  Archive,
  FolderOpen,
  AlertCircle,
  Loader2,
  MoreVertical,
  PlusCircle,
  MinusCircle,
  X,
  Box,
  Activity,
  Wifi,
  List,
} from 'lucide-react';

import { ProjectTabType } from './ProjectTabs';
import { useProjects, useDeleteProject, useUnassignDevice } from '@/hooks/useProjects';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { useProject } from '@/providers/ProjectProvider';
// Lazy — chunks downloaded only when the user first triggers each modal
const DeleteConfirmModal           = lazy(() => import('./DeleteConfirmModal'));
const AssignDeviceToProjectModal   = lazy(() => import('./AssignDeviceToProjectModal'));
import type { Project } from '@/lib/types';

const PAGE_SIZE = 5;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectTableProps {
  activeTab: ProjectTabType;
  searchQuery?: string;
  onEditProject?: (project: Project) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProjectTable = ({ activeTab, searchQuery = '', onEditProject }: ProjectTableProps) => {
  const router = useRouter();
  const { activeProject, setActiveProject, clearActiveProject } = useProject();
  const { data, isLoading, error } = useProjects();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { mutate: unassign, isPending: isUnassigning } = useUnassignDevice();
  const { data: djiDevices = [] } = useDJIDevices();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [assignDeviceProject, setAssignDeviceProject] = useState<Project | null>(null);
  const [unassignProject, setUnassignProject] = useState<Project | null>(null);
  const [devicesModalProject, setDevicesModalProject] = useState<Project | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset page on tab / search change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [activeTab, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuOpen = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (openMenuId === projectId) {
      setOpenMenuId(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 220; // estimated dropdown menu height
    const spaceBelow = window.innerHeight - rect.bottom;
    
    let top = rect.bottom + 6;
    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = rect.top - menuHeight - 6;
    }
    
    setMenuPosition({ top, right: window.innerWidth - rect.right });
    setOpenMenuId(projectId);
  };

  const allProjects = data?.list ?? [];

  // Tab filtering — 'Online' shows projects where at least one device is currently online
  const tabFiltered = useMemo(() => allProjects.filter((p) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return p.devices.length > 0;
    if (activeTab === 'Offline') return p.devices.length === 0;
    if (activeTab === 'Online') return p.devices.some((d) =>
      djiDevices.find((dev) => dev.deviceSn === d.device.device_sn)?.status === true
    );
    return true;
  }), [allProjects, activeTab, djiDevices]);

  // Search
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tabFiltered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [tabFiltered, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paginated.length > 0 && selected.size === paginated.length;

  const activeMenuProject = openMenuId
    ? (allProjects.find((p) => p.id === openMenuId) ?? null)
    : null;

  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const handleOpenProject = (project: Project) => {
    setNavigatingId(project.id);
    setActiveProject(project);
    router.push('/dashboard');
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const deletingActive = activeProject?.id === pendingDelete.id;
    deleteProject(pendingDelete.id, {
      onSuccess: () => {
        if (deletingActive) clearActiveProject();
      },
      onSettled: () => setPendingDelete(null),
    });
  };

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

  return (
    <div className='flex flex-col w-[calc(100%-2rem)] mx-4 font-poppins'>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 mb-2 bg-[#1C93FF]/10 border border-[#1C93FF]/20 rounded-lg'>
          <span className='text-sm font-semibold text-zinc-200'>
            {selected.size} project{selected.size > 1 ? 's' : ''} selected
          </span>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end'>
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
                {['Name', 'Description', 'Devices', 'Flight Areas', 'Created', 'Actions'].map(
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
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    <td className='px-4 py-4'>
                      <div className='w-4 h-4 bg-zinc-800 rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex flex-col gap-2'>
                        <div className='h-3 w-32 bg-zinc-800 rounded animate-pulse' />
                        <div className='h-2 w-16 bg-zinc-800/70 rounded animate-pulse' />
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-40 bg-zinc-800 rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-8 bg-zinc-800 rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-8 bg-zinc-800 rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-20 bg-zinc-800 rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='w-7 h-7 bg-zinc-800 rounded-md animate-pulse' />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className='px-4 py-16 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <AlertCircle className='w-7 h-7 text-red-400' />
                      <span className='text-sm text-zinc-400'>Failed to load projects</span>
                      <span className='text-xs text-red-400/80 font-mono max-w-[380px] text-center px-4'>{error.message}</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-16 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <FolderOpen className='w-8 h-8 text-zinc-700' />
                      <span className='text-sm text-zinc-600'>
                        {searchQuery
                          ? 'No projects match your search.'
                          : activeTab === 'Online'
                            ? 'No projects with online drones.'
                            : 'No projects yet. Create one to get started.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((project) => {
                  const isChecked = selected.has(project.id);
                  const hasDevices = project.devices.length > 0;
                  const isActiveProject = activeProject?.id === project.id;
                  const borderColor = isActiveProject
                    ? 'border-l-[#1C93FF]'
                    : 'border-l-transparent';
                  const isBeingDeleted = isDeleting && pendingDelete?.id === project.id;

                  return (
                    <tr
                      key={project.id}
                      className={`border-l-2 ${borderColor} transition-colors hover:bg-white/[0.02]
                        ${isActiveProject ? 'bg-[#1C93FF]/[0.04]' : ''}
                        ${isChecked ? 'bg-[#1C93FF]/5' : ''}
                        ${isBeingDeleted ? 'opacity-40 pointer-events-none' : ''}`}
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
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-sm font-bold text-zinc-100'>{project.name}</span>

                            {isActiveProject && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-[#1C93FF] bg-[#1C93FF]/10 border border-[#1C93FF]/25 rounded-full'>
                                <span className='w-1.5 h-1.5 rounded-full bg-[#1C93FF] animate-pulse' />
                                Active Session
                              </span>
                            )}

                            <button
                              onClick={() => handleOpenProject(project)}
                              disabled={navigatingId === project.id}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded transition-colors disabled:opacity-70 ${
                                isActiveProject
                                  ? 'text-[#1C93FF] bg-[#1C93FF]/10 border border-[#1C93FF]/30 hover:bg-[#1C93FF]/20'
                                  : 'text-white bg-[#1C93FF] hover:bg-[#1C93FF]/80'
                              }`}
                            >
                              {navigatingId === project.id ? (
                                <Loader2 size={10} className='animate-spin' />
                              ) : (
                                <FolderOpen size={10} />
                              )}
                              {isActiveProject ? 'Resume' : 'Open'}
                            </button>
                          </div>
                          <span className='text-[10px] font-mono text-zinc-700'>
                            {project.id.slice(0, 8)}…
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className='px-4 py-4 max-w-[220px]'>
                        {project.description ? (
                          <span className='text-sm text-zinc-400 line-clamp-2'>
                            {project.description}
                          </span>
                        ) : (
                          <span className='text-sm text-zinc-700 italic'>—</span>
                        )}
                      </td>

                      {/* Devices */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-1.5'>
                          <PlaneTakeoff size={12} className='text-zinc-500' />
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              hasDevices ? 'text-emerald-400' : 'text-zinc-600'
                            }`}
                          >
                            {project.devices.length}
                          </span>
                        </div>
                      </td>

                      {/* Flight Areas */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-1.5'>
                          <Layers size={12} className='text-zinc-500' />
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              project.flight_areas.length > 0 ? 'text-cyan-400' : 'text-zinc-600'
                            }`}
                          >
                            {project.flight_areas.length}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className='px-4 py-4'>
                        <span className='text-sm text-zinc-400'>
                          {new Date(project.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Actions — vertical 3-dots */}
                      <td className='px-4 py-4'>
                        <button
                          onClick={(e) => handleMenuOpen(e, project.id)}
                          className={`p-1.5 rounded-md border transition-colors ${
                            openMenuId === project.id
                              ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count + pagination */}
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

      {/* Mobile Card List (Visible only on mobile/tablet) */}
      <div className='md:hidden flex flex-col gap-3'>
        {isLoading ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className='bg-[#1D2026] rounded-lg border border-zinc-800/50 p-4 space-y-3 animate-pulse'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-4 h-4 bg-zinc-800 rounded' />
                  <div>
                    <div className='h-4 w-24 bg-zinc-800 rounded' />
                    <div className='h-2.5 w-12 bg-zinc-800/70 rounded mt-1.5' />
                  </div>
                </div>
                <div className='w-6 h-6 bg-zinc-800 rounded' />
              </div>
              <div className='h-8 w-24 bg-zinc-800 rounded' />
              <div className='h-3 w-48 bg-zinc-800 rounded' />
              <div className='grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/30'>
                <div className='h-5 bg-zinc-800 rounded' />
                <div className='h-5 bg-zinc-800 rounded' />
                <div className='h-5 bg-zinc-800 rounded' />
              </div>
            </div>
          ))
        ) : error ? (
          <div className='bg-[#1D2026] rounded-lg border border-zinc-800/50 p-8 text-center'>
            <AlertCircle className='w-7 h-7 text-red-400 mx-auto mb-2' />
            <p className='text-sm text-zinc-400'>Failed to load projects</p>
            <p className='text-xs text-red-400/80 font-mono mt-1'>{error.message}</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className='bg-[#1D2026] rounded-lg border border-zinc-800/50 p-8 text-center'>
            <FolderOpen className='w-8 h-8 text-zinc-700 mx-auto mb-2' />
            <p className='text-sm text-zinc-600'>
              {searchQuery
                ? 'No projects match your search.'
                : activeTab === 'Online'
                  ? 'No projects with online drones.'
                  : 'No projects yet. Create one to get started.'}
            </p>
          </div>
        ) : (
          <>
            {paginated.map((project) => {
              const isChecked = selected.has(project.id);
              const hasDevices = project.devices.length > 0;
              const isActiveProject = activeProject?.id === project.id;
              const isBeingDeleted = isDeleting && pendingDelete?.id === project.id;

              return (
                <div
                  key={project.id}
                  className={`bg-[#1D2026] rounded-lg border border-zinc-800/50 ${
                    isActiveProject ? 'border-l-4 border-l-[#1C93FF]' : ''
                  } p-4 space-y-3 font-poppins relative
                    ${isActiveProject ? 'bg-[#1C93FF]/[0.04]' : ''}
                    ${isChecked ? 'bg-[#1C93FF]/5' : ''}
                    ${isBeingDeleted ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  {/* Header */}
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <input
                        type='checkbox'
                        checked={isChecked}
                        onChange={() => toggleSelect(project.id)}
                        className='w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-[#1C93FF] cursor-pointer flex-shrink-0'
                      />
                      <div className='min-w-0'>
                        <p className='text-sm font-bold text-zinc-100 truncate'>
                          {project.name}
                        </p>
                        <span className='text-[10px] font-mono text-zinc-600 block mt-0.5'>
                          {project.id.slice(0, 8)}…
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <button
                        onClick={(e) => handleMenuOpen(e, project.id)}
                        className={`p-1.5 rounded-md border transition-colors ${
                          openMenuId === project.id
                            ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Session and Navigation buttons */}
                  <div className='flex flex-wrap items-center gap-2 pt-1'>
                    {isActiveProject && (
                      <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-[#1C93FF] bg-[#1C93FF]/10 border border-[#1C93FF]/25 rounded-full'>
                        <span className='w-1.5 h-1.5 rounded-full bg-[#1C93FF] animate-pulse' />
                        Active Session
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenProject(project)}
                      disabled={navigatingId === project.id}
                      className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded transition-colors disabled:opacity-70 ${
                        isActiveProject
                          ? 'text-[#1C93FF] bg-[#1C93FF]/10 border border-[#1C93FF]/30 hover:bg-[#1C93FF]/20'
                          : 'text-white bg-[#1C93FF] hover:bg-[#1C93FF]/80'
                      }`}
                    >
                      {navigatingId === project.id ? (
                        <Loader2 size={10} className='animate-spin' />
                      ) : (
                        <FolderOpen size={10} />
                      )}
                      {isActiveProject ? 'Resume Session' : 'Open Project'}
                    </button>
                  </div>

                  {/* Description */}
                  <div className='text-xs text-zinc-400 py-1'>
                    {project.description ? (
                      <p className='line-clamp-2 leading-relaxed'>{project.description}</p>
                    ) : (
                      <p className='text-zinc-600 italic'>No description provided</p>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className='grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/30 text-xs'>
                    <div>
                      <span className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider block'>Devices</span>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <PlaneTakeoff size={12} className='text-zinc-500' />
                        <span className={`font-semibold tabular-nums ${hasDevices ? 'text-emerald-400' : 'text-zinc-600'}`}>
                          {project.devices.length}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider block'>Flight Areas</span>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <Layers size={12} className='text-zinc-500' />
                        <span className={`font-semibold tabular-nums ${project.flight_areas.length > 0 ? 'text-cyan-400' : 'text-zinc-600'}`}>
                          {project.flight_areas.length}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider block'>Created</span>
                      <span className='text-zinc-400 block mt-1'>
                        {new Date(project.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination for mobile */}
            <div className='flex items-center justify-between px-4 py-3 border border-zinc-800/50 bg-[#1D2026] rounded-lg mt-1'>
              <span className='text-[10px] text-zinc-500'>
                Showing <span className='text-zinc-300 font-semibold'>{paginated.length}</span> of{' '}
                <span className='text-zinc-300 font-semibold'>{filtered.length}</span>
              </span>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-zinc-900/50'
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
                          : 'border-zinc-800 text-zinc-500 bg-zinc-900/50'
                      }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-zinc-900/50'
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fixed-position action dropdown ──────────────────────────────────────── */}
      {activeMenuProject && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.top, right: menuPosition.right }}
          className='fixed z-50 w-56 bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/70 font-poppins overflow-hidden'
        >
          {/* Context label */}
          <div className='px-3.5 py-2.5 border-b border-zinc-800/70'>
            <p className='text-[9px] font-black tracking-[0.16em] uppercase text-zinc-600'>
              Project
            </p>
            <p className='text-xs font-bold text-zinc-200 truncate mt-0.5'>
              {activeMenuProject.name}
            </p>
          </div>

          {/* Device actions */}
          <div className='p-1.5 space-y-0.5 border-b border-zinc-800/70'>
            <button
              onClick={() => {
                if (!activeMenuProject.devices.length) return;
                setOpenMenuId(null);
                setDevicesModalProject(activeMenuProject);
              }}
              disabled={!activeMenuProject.devices.length}
              title={
                !activeMenuProject.devices.length
                  ? 'No devices assigned to this project'
                  : undefined
              }
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed'
            >
              <List size={13} className='flex-shrink-0' />
              List Devices
              {activeMenuProject.devices.length > 0 && (
                <span className='ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400'>
                  {activeMenuProject.devices.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setOpenMenuId(null);
                setAssignDeviceProject(activeMenuProject);
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#1C93FF] hover:bg-[#1C93FF]/10 transition-colors text-left'
            >
              <PlusCircle size={13} className='flex-shrink-0' />
              Assign Device
            </button>
            <button
              onClick={() => {
                if (!activeMenuProject.devices.length) return;
                setOpenMenuId(null);
                setUnassignProject(activeMenuProject);
              }}
              disabled={!activeMenuProject.devices.length}
              title={!activeMenuProject.devices.length ? 'No devices assigned' : undefined}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed'
            >
              <MinusCircle size={13} className='flex-shrink-0' />
              Unassign Device
            </button>
          </div>

          {/* Project actions */}
          <div className='p-1.5 space-y-0.5 border-b border-zinc-800/70'>
            <button
              onClick={() => {
                setOpenMenuId(null);
                onEditProject?.(activeMenuProject);
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors text-left'
            >
              <Pencil size={13} className='flex-shrink-0' />
              Edit Project
            </button>
          </div>

          {/* Danger zone */}
          <div className='p-1.5'>
            <button
              onClick={() => {
                setOpenMenuId(null);
                setPendingDelete(activeMenuProject);
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left'
            >
              <Trash2 size={13} className='flex-shrink-0' />
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* ── Unassign device modal ────────────────────────────────────────────────── */}
      {unassignProject && (
        <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setUnassignProject(null)}
          />
          <div className='relative w-full max-w-sm bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg'>
                  <MinusCircle size={16} className='text-amber-400' />
                </div>
                <div>
                  <h2 className='text-sm font-bold text-zinc-100'>Unassign Device</h2>
                  <p className='text-[11px] text-zinc-500 truncate max-w-[200px]'>
                    {unassignProject.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnassignProject(null)}
                className='p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
              >
                <X size={16} />
              </button>
            </div>

            {/* Device list */}
            <div className='px-6 py-5 space-y-3'>
              <p className='text-[11px] text-zinc-500'>
                Select a device to remove from this project:
              </p>
              <div className='flex flex-col gap-2'>
                {unassignProject.devices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() =>
                      unassign(
                        { projectId: unassignProject.id, deviceSn: d.device.device_sn },
                        { onSuccess: () => setUnassignProject(null) }
                      )
                    }
                    disabled={isUnassigning}
                    className='flex items-center justify-between px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group'
                  >
                    <span className='text-xs font-mono text-emerald-400'>{d.device.device_sn}</span>
                    {isUnassigning ? (
                      <Loader2 size={11} className='text-amber-400 animate-spin' />
                    ) : (
                      <span className='text-[10px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity'>
                        Remove
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── List Devices modal ──────────────────────────────────────────────────── */}
      {devicesModalProject &&
        (() => {
          const enriched = devicesModalProject.devices.map((d) => {
            const dji = djiDevices.find((dev) => dev.deviceSn === d.device.device_sn);
            const isDrone = dji ? dji.domain === '0' : null;
            return { ...d, dji, isDrone };
          });
          const drones = enriched.filter((d) => d.isDrone === true);
          const docks = enriched.filter((d) => d.isDrone === false);
          const unknown = enriched.filter((d) => d.isDrone === null);

          const DeviceRow = ({ d }: { d: (typeof enriched)[number] }) => (
            <div className='flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800'>
              <div className='w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0'>
                {d.isDrone === true && <Activity size={14} className='text-blue-400' />}
                {d.isDrone === false && <Box size={14} className='text-cyan-400' />}
                {d.isDrone === null && <PlaneTakeoff size={14} className='text-zinc-600' />}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-bold text-zinc-200 truncate'>
                  {d.dji?.nickname || d.dji?.deviceName || d.device.device_sn}
                </p>
                <p className='text-[10px] font-mono text-zinc-600 truncate'>{d.device.device_sn}</p>
              </div>
              {d.dji ? (
                <div className='flex items-center gap-1.5'>
                  <Wifi size={11} className={d.dji.status ? 'text-emerald-400' : 'text-zinc-600'} />
                  <span
                    className={`text-[10px] font-semibold ${d.dji.status ? 'text-emerald-400' : 'text-zinc-600'}`}
                  >
                    {d.dji.status ? 'Online' : 'Offline'}
                  </span>
                </div>
              ) : (
                <span className='text-[10px] text-zinc-700 italic'>Not bound</span>
              )}
            </div>
          );

          return (
            <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
              <div
                className='absolute inset-0 bg-black/60 backdrop-blur-sm'
                onClick={() => setDevicesModalProject(null)}
              />
              <div className='relative w-full max-w-md bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]'>
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800 flex-shrink-0'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-zinc-800 border border-zinc-700 rounded-lg'>
                      <List size={16} className='text-zinc-300' />
                    </div>
                    <div>
                      <h2 className='text-sm font-bold text-zinc-100'>Assigned Devices</h2>
                      <p className='text-[11px] text-zinc-500 truncate max-w-[220px]'>
                        {devicesModalProject.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDevicesModalProject(null)}
                    className='p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className='overflow-y-auto px-6 py-5 space-y-5'>
                  {enriched.length === 0 ? (
                    <div className='flex flex-col items-center gap-2 py-8'>
                      <PlaneTakeoff className='w-8 h-8 text-zinc-700' />
                      <p className='text-sm text-zinc-600'>No devices assigned to this project.</p>
                    </div>
                  ) : (
                    <>
                      {drones.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <Activity size={11} className='text-blue-400' />
                            <p className='text-[10px] font-black tracking-[0.16em] uppercase text-blue-400'>
                              Drones ({drones.length})
                            </p>
                          </div>
                          {drones.map((d) => (
                            <DeviceRow key={d.id} d={d} />
                          ))}
                        </div>
                      )}
                      {docks.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <Box size={11} className='text-cyan-400' />
                            <p className='text-[10px] font-black tracking-[0.16em] uppercase text-cyan-400'>
                              Docks ({docks.length})
                            </p>
                          </div>
                          {docks.map((d) => (
                            <DeviceRow key={d.id} d={d} />
                          ))}
                        </div>
                      )}
                      {unknown.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <PlaneTakeoff size={11} className='text-zinc-600' />
                            <p className='text-[10px] font-black tracking-[0.16em] uppercase text-zinc-600'>
                              Unknown ({unknown.length})
                            </p>
                          </div>
                          {unknown.map((d) => (
                            <DeviceRow key={d.id} d={d} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {pendingDelete && (
        <Suspense fallback={null}>
          <DeleteConfirmModal
            project={pendingDelete}
            isDeleting={isDeleting}
            onConfirm={handleConfirmDelete}
            onClose={() => setPendingDelete(null)}
          />
        </Suspense>
      )}

      {assignDeviceProject && (
        <Suspense fallback={null}>
          <AssignDeviceToProjectModal
            project={assignDeviceProject}
            onClose={() => setAssignDeviceProject(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ProjectTable;
