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
  Route,
} from 'lucide-react';

import { ProjectTabType } from './ProjectTabs';
import { useProjects, useDeleteProject, useUnassignDevice } from '@/hooks/useProjects';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { useProject } from '@/providers/ProjectProvider';
// Lazy — chunks downloaded only when the user first triggers each modal
const DeleteConfirmModal           = lazy(() => import('./DeleteConfirmModal'));
const AssignDeviceToProjectModal   = lazy(() => import('./AssignDeviceToProjectModal'));
const AssignWaylineToProjectModal  = lazy(() => import('./AssignWaylineToProjectModal'));
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
  const [assignWaylineProject, setAssignWaylineProject] = useState<Project | null>(null);
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

  const allProjects = useMemo(() => data?.list ?? [], [data]);

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
      <div className='flex flex-col w-full font-ui'>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 mb-2 bg-theme-accent/10 border border-theme-accent/20 rounded-lg'>
          <span className='text-sm font-semibold text-foreground'>
            {selected.size} project{selected.size > 1 ? 's' : ''} selected
          </span>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end'>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-muted-foreground border border-border rounded-md hover:border-border transition-colors'>
              <Download size={12} /> Export
            </button>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-muted-foreground border border-border rounded-md hover:border-border transition-colors'>
              <Archive size={12} /> Archive
            </button>
            <button className='flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-400 border border-red-500/30 rounded-md hover:border-red-500/60 transition-colors'>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Desktop view */}
      <div className='hidden md:flex flex-col h-[743px] bg-background rounded-xl border border-border/50 overflow-hidden'>
        <div className='flex-1 overflow-y-auto overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[860px]'>
            <thead className='sticky top-0 z-10'>
              <tr className='border-b border-border/50 text-muted-foreground'>
                <th className='px-4 py-4 w-10'>
                  <input
                    type='checkbox'
                    checked={allChecked}
                    onChange={toggleAll}
                    className='w-4 h-4 rounded border-border bg-secondary accent-theme-accent cursor-pointer'
                  />
                </th>
                {['Name', 'Description', 'Devices', 'Flight Areas', 'Created', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className='px-4 py-4 text-xs font-medium text-muted-foreground'
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className='divide-y divide-border/40'>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    <td className='px-4 py-4'>
                      <div className='w-4 h-4 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex flex-col gap-2'>
                        <div className='h-3 w-32 bg-secondary rounded animate-pulse' />
                        <div className='h-2 w-16 bg-secondary/70 rounded animate-pulse' />
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-40 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-8 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-8 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='h-3 w-20 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='w-7 h-7 bg-secondary rounded-md animate-pulse' />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className='px-4 py-16 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <AlertCircle className='w-7 h-7 text-red-400' />
                      <span className='text-sm text-muted-foreground'>Failed to load projects</span>
                      <span className='text-xs text-red-400/80 font-mono max-w-[380px] text-center px-4'>{error.message}</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-16 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <FolderOpen className='w-8 h-8 text-muted-foreground mx-auto mb-2' />
                      <span className='text-sm text-muted-foreground'>
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
                    ? 'border-l-theme-accent'
                    : 'border-l-transparent';
                  const isBeingDeleted = isDeleting && pendingDelete?.id === project.id;

                  return (
                    <tr
                      key={project.id}
                      className={`border-l-2 ${borderColor} transition-colors hover:bg-secondary/50
                        ${isActiveProject ? 'bg-theme-accent/[0.04]' : ''}
                        ${isChecked ? 'bg-theme-accent/5' : ''}
                        ${isBeingDeleted ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className='px-4 py-4'>
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={() => toggleSelect(project.id)}
                          className='w-4 h-4 rounded border-border bg-secondary accent-theme-accent cursor-pointer'
                        />
                      </td>

                      {/* Name */}
                      <td className='px-4 py-4'>
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-sm font-bold text-foreground'>{project.name}</span>

                            {isActiveProject && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-theme-accent bg-theme-accent/10 border border-theme-accent/25 rounded-full'>
                                <span className='w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse' />
                                Active Session
                              </span>
                            )}

                            <button
                              onClick={() => handleOpenProject(project)}
                              disabled={navigatingId === project.id}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded transition-colors disabled:opacity-70 ${
                                isActiveProject
                                  ? 'text-theme-accent bg-theme-accent/10 border border-theme-accent/30 hover:bg-theme-accent/20'
                                  : 'text-white bg-theme-accent hover:bg-theme-accent/80'
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
                        </div>
                      </td>

                      {/* Description */}
                      <td className='px-4 py-4 max-w-[220px]'>
                        {project.description ? (
                          <span className='text-sm text-muted-foreground line-clamp-2'>
                            {project.description}
                          </span>
                        ) : (
                          <span className='text-sm text-muted-foreground italic'>—</span>
                        )}
                      </td>

                      {/* Devices */}
                      <td className='px-4 py-4'>
                        <button
                          onClick={() => setAssignDeviceProject(project)}
                          className='flex items-center gap-1.5 cursor-pointer hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors'
                        >
                          <PlaneTakeoff size={12} className='text-muted-foreground' />
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              hasDevices ? 'text-emerald-400' : 'text-muted-foreground'
                            }`}
                          >
                            {project.devices.length}
                          </span>
                        </button>
                      </td>

                      {/* Flight Areas */}
                      <td className='px-4 py-4'>
                        <button
                          onClick={() => setAssignWaylineProject(project)}
                          className='flex items-center gap-1.5 cursor-pointer hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors'
                        >
                          <Layers size={12} className='text-muted-foreground' />
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              project.flight_areas.length > 0 ? 'text-cyan-400' : 'text-muted-foreground'
                            }`}
                          >
                            {project.flight_areas.length}
                          </span>
                        </button>
                      </td>

                      {/* Created */}
                      <td className='px-4 py-4'>
                        <span className='text-sm text-muted-foreground'>
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
                              ? 'bg-muted border-border text-foreground'
                              : 'bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border'
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
        <div className='flex-shrink-0 flex items-center justify-between px-6 py-3.5 border-t border-border/50 bg-card'>
          <span className='text-[11px] text-muted-foreground'>
            Showing <span className='text-muted-foreground font-semibold'>{paginated.length}</span> of{' '}
            <span className='text-muted-foreground font-semibold'>{filtered.length}</span> projects
          </span>
          <div className='flex items-center gap-1'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
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
                      ? 'bg-theme-accent border-theme-accent text-white'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
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
            <div key={i} className='bg-secondary rounded-lg border border-border/50 p-4 space-y-3 animate-pulse'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-4 h-4 bg-secondary rounded' />
                  <div>
                    <div className='h-4 w-24 bg-secondary rounded' />
                    <div className='h-2.5 w-12 bg-secondary/70 rounded mt-1.5' />
                  </div>
                </div>
                <div className='w-6 h-6 bg-secondary rounded' />
              </div>
              <div className='h-8 w-24 bg-secondary rounded' />
              <div className='h-3 w-48 bg-secondary rounded' />
              <div className='grid grid-cols-3 gap-2 pt-3 border-t border-border/30'>
                <div className='h-5 bg-secondary rounded' />
                <div className='h-5 bg-secondary rounded' />
                <div className='h-5 bg-secondary rounded' />
              </div>
            </div>
          ))
        ) : error ? (
          <div className='bg-secondary rounded-lg border border-border/50 p-8 text-center'>
            <AlertCircle className='w-7 h-7 text-red-400 mx-auto mb-2' />
            <p className='text-sm text-muted-foreground'>Failed to load projects</p>
            <p className='text-xs text-red-400/80 font-mono mt-1'>{error.message}</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className='bg-secondary rounded-lg border border-border/50 p-8 text-center'>
            <FolderOpen className='w-8 h-8 text-muted-foreground mx-auto mb-2' />
            <p className='text-sm text-muted-foreground'>
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
                  className={`bg-card rounded-lg border border-border/50 ${
                    isActiveProject ? 'border-l-4 border-l-theme-accent' : ''
                  } p-4 space-y-3 relative
                    ${isActiveProject ? 'bg-theme-accent/[0.04]' : ''}
                    ${isChecked ? 'bg-theme-accent/5' : ''}
                    ${isBeingDeleted ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  {/* Header */}
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <input
                        type='checkbox'
                        checked={isChecked}
                        onChange={() => toggleSelect(project.id)}
                        className='w-4 h-4 rounded border-border bg-secondary accent-theme-accent cursor-pointer flex-shrink-0'
                      />
                      <div className='min-w-0'>
                        <p className='text-sm font-bold text-foreground truncate'>
                          {project.name}
                        </p>

                      </div>
                    </div>

                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <button
                        onClick={(e) => handleMenuOpen(e, project.id)}
                        className={`p-1.5 rounded-md border transition-colors ${
                          openMenuId === project.id
                            ? 'bg-muted border-border text-foreground'
                            : 'bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border'
                        }`}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Session and Navigation buttons */}
                  <div className='flex flex-wrap items-center gap-2 pt-1'>
                    {isActiveProject && (
                      <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-theme-accent bg-theme-accent/10 border border-theme-accent/25 rounded-full'>
                        <span className='w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse' />
                        Active Session
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenProject(project)}
                      disabled={navigatingId === project.id}
                      className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded transition-colors disabled:opacity-70 ${
                        isActiveProject
                          ? 'text-theme-accent bg-theme-accent/10 border border-theme-accent/30 hover:bg-theme-accent/20'
                          : 'text-white bg-theme-accent hover:bg-theme-accent/80'
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
                  <div className='text-xs text-muted-foreground py-1'>
                    {project.description ? (
                      <p className='line-clamp-2 leading-relaxed'>{project.description}</p>
                    ) : (
                      <p className='text-muted-foreground italic'>No description provided</p>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className='grid grid-cols-3 gap-2 pt-3 border-t border-border/30 text-xs'>
                    <div>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Devices</span>
                      <button
                        onClick={() => setAssignDeviceProject(project)}
                        className='flex items-center gap-1.5 mt-0.5 cursor-pointer hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors'
                      >
                        <PlaneTakeoff size={12} className='text-muted-foreground' />
                        <span className={`font-semibold tabular-nums ${hasDevices ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {project.devices.length}
                        </span>
                      </button>
                    </div>

                    <div>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Flight Areas</span>
                      <button
                        onClick={() => setAssignWaylineProject(project)}
                        className='flex items-center gap-1.5 mt-0.5 cursor-pointer hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors'
                      >
                        <Layers size={12} className='text-muted-foreground' />
                        <span className={`font-semibold tabular-nums ${project.flight_areas.length > 0 ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                          {project.flight_areas.length}
                        </span>
                      </button>
                    </div>

                    <div>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Created</span>
                      <span className='text-muted-foreground block mt-1'>
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
            <div className='flex items-center justify-between px-4 py-3 border border-border/50 bg-card rounded-lg mt-1'>
              <span className='text-[10px] text-muted-foreground'>
                Showing <span className='text-foreground font-semibold'>{paginated.length}</span> of{' '}
                <span className='text-foreground font-semibold'>{filtered.length}</span>
              </span>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-secondary'
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
                          ? 'bg-theme-accent border-theme-accent text-white'
                          : 'border-border text-muted-foreground bg-secondary'
                      }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-secondary'
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
          className='fixed z-50 w-56 bg-card border border-border rounded-xl shadow-2xl shadow-black/60 font-ui overflow-hidden'
        >
          {/* Context label */}
          <div className='px-3.5 py-2.5 border-b border-border'>
            <p className='text-[9px] font-semibold tracking-wider uppercase text-muted-foreground'>
              Project
            </p>
            <p className='text-xs font-semibold text-foreground truncate mt-0.5'>
              {activeMenuProject.name}
            </p>
          </div>

          {/* Device actions */}
          <div className='p-1.5 space-y-0.5 border-b border-border'>
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
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed'
            >
              <List size={13} className='flex-shrink-0' />
              List Devices
              {activeMenuProject.devices.length > 0 && (
                <span className='ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground'>
                  {activeMenuProject.devices.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setOpenMenuId(null);
                setAssignDeviceProject(activeMenuProject);
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-theme-accent hover:bg-theme-accent/10 transition-colors text-left'
            >
              <PlusCircle size={13} className='flex-shrink-0' />
              Assign Device
            </button>
            <button
              onClick={() => {
                setOpenMenuId(null);
                setAssignWaylineProject(activeMenuProject);
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left'
            >
              <Route size={13} className='flex-shrink-0' />
              Assign Wayline
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
          <div className='p-1.5 space-y-0.5 border-b border-border'>
            <button
              onClick={() => {
                setOpenMenuId(null);
                onEditProject?.(activeMenuProject);
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary transition-colors text-left'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center font-ui'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setUnassignProject(null)}
          />
          <div className='relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl shadow-black/60'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-border'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg'>
                  <MinusCircle size={16} className='text-amber-400' />
                </div>
                <div>
                  <h2 className='text-sm font-bold text-foreground'>Unassign Device</h2>
                  <p className='text-[11px] text-muted-foreground truncate max-w-[200px]'>
                    {unassignProject.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnassignProject(null)}
                className='p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors'
              >
                <X size={16} />
              </button>
            </div>

            {/* Device list */}
            <div className='px-6 py-5 space-y-3'>
              <p className='text-[11px] text-muted-foreground'>
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
                    className='flex items-center justify-between px-3.5 py-2.5 bg-secondary border border-border hover:border-amber-500/50 hover:bg-amber-500/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group'
                  >
                    <span className='text-xs font-mono text-emerald-400'>{d.device.device_sn}</span>
                    {isUnassigning ? (
                      <Loader2 size={11} className='text-amber-400 animate-spin' />
                    ) : (
                      <span className='text-[10px] font-semibold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity'>
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
            <div className='flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-secondary border border-border'>
              <div className='w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center flex-shrink-0'>
                {d.isDrone === true && <Activity size={14} className='text-blue-400' />}
                {d.isDrone === false && <Box size={14} className='text-cyan-400' />}
                {d.isDrone === null && <PlaneTakeoff size={14} className='text-muted-foreground' />}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-semibold text-foreground truncate'>
                  {d.dji?.nickname || d.dji?.deviceName || d.device.device_sn}
                </p>
                <p className='text-[10px] font-mono text-muted-foreground truncate'>{d.device.device_sn}</p>
              </div>
              {d.dji ? (
                <div className='flex items-center gap-1.5'>
                  <Wifi size={11} className={d.dji.status ? 'text-emerald-400' : 'text-muted-foreground'} />
                  <span
                    className={`text-[10px] font-semibold ${d.dji.status ? 'text-emerald-400' : 'text-muted-foreground'}`}
                  >
                    {d.dji.status ? 'Online' : 'Offline'}
                  </span>
                </div>
              ) : (
                <span className='text-[10px] text-muted-foreground italic'>Not bound</span>
              )}
            </div>
          );

          return (
            <div className='fixed inset-0 z-50 flex items-center justify-center font-ui'>
              <div
                className='absolute inset-0 bg-black/60 backdrop-blur-sm'
                onClick={() => setDevicesModalProject(null)}
              />
              <div className='relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]'>
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-secondary border border-border rounded-lg'>
                      <List size={16} className='text-foreground' />
                    </div>
                    <div>
                      <h2 className='text-sm font-bold text-foreground'>Assigned Devices</h2>
                      <p className='text-[11px] text-muted-foreground truncate max-w-[220px]'>
                        {devicesModalProject.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDevicesModalProject(null)}
                    className='p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors'
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className='overflow-y-auto px-6 py-5 space-y-5'>
                  {enriched.length === 0 ? (
                    <div className='flex flex-col items-center gap-2 py-8'>
                      <PlaneTakeoff className='w-8 h-8 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>No devices assigned to this project.</p>
                    </div>
                  ) : (
                    <>
                      {drones.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <Activity size={11} className='text-blue-400' />
                            <p className='text-[10px] font-semibold uppercase tracking-wider text-blue-400'>
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
                            <p className='text-[10px] font-semibold uppercase tracking-wider text-cyan-400'>
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
                            <PlaneTakeoff size={11} className='text-muted-foreground' />
                            <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
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

      {assignWaylineProject && (
        <Suspense fallback={null}>
          <AssignWaylineToProjectModal
            project={assignWaylineProject}
            onClose={() => setAssignWaylineProject(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ProjectTable;
