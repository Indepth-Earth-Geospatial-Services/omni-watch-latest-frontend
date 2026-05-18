'use client';

import React, { useEffect, useState } from 'react';
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
  Loader2, // used in loading / error states above the table
} from 'lucide-react';

import { ProjectTabType } from './ProjectTabs';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { useProject } from '@/providers/ProjectProvider';
import DeleteConfirmModal from './DeleteConfirmModal';
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

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  // Reset to page 1 whenever the tab or search changes
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [activeTab, searchQuery]);

  const allProjects = data?.list ?? [];

  // Tab filtering — mapped to real Project shape (no status/archived field from API)
  const tabFiltered = allProjects.filter((p) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return p.devices.length > 0;
    if (activeTab === 'Offline') return p.devices.length === 0;
    if (activeTab === 'Archived') return false; // no archived field in API yet
    return true;
  });

  // Search by name or description
  const filtered = tabFiltered.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allChecked = paginated.length > 0 && selected.size === paginated.length;

  const handleOpenProject = (project: Project) => {
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className='flex flex-col w-[calc(100%-2rem)] mx-4'>
        <div className='flex flex-col h-[743px] bg-[#1D2026] rounded-lg border border-zinc-800/50 items-center justify-center gap-3'>
          <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
          <span className='text-sm text-zinc-500'>Loading projects…</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className='flex flex-col w-[calc(100%-2rem)] mx-4'>
        <div className='flex flex-col h-[743px] bg-[#1D2026] rounded-lg border border-zinc-800/50 items-center justify-center gap-3'>
          <AlertCircle className='w-8 h-8 text-red-400' />
          <span className='text-sm text-zinc-400'>Failed to load projects</span>
          <span className='text-xs text-zinc-600 max-w-[300px] text-center'>{error.message}</span>
        </div>
      </div>
    );
  }

  // ── Table ────────────────────────────────────────────────────────────────────
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

      <div className='flex flex-col h-[743px] bg-[#1D2026] rounded-lg border border-zinc-800/50 overflow-hidden'>
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-16 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <FolderOpen className='w-8 h-8 text-zinc-700' />
                      <span className='text-sm text-zinc-600'>
                        {searchQuery
                          ? 'No projects match your search.'
                          : activeTab === 'Archived'
                            ? 'No archived projects.'
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
                    : hasDevices
                      ? 'border-l-emerald-500'
                      : 'border-l-zinc-700';
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

                            {/* Active session badge */}
                            {isActiveProject && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-[#1C93FF] bg-[#1C93FF]/10 border border-[#1C93FF]/25 rounded-full'>
                                <span className='w-1.5 h-1.5 rounded-full bg-[#1C93FF] animate-pulse' />
                                Active Session
                              </span>
                            )}

                            <button
                              onClick={() => handleOpenProject(project)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                                isActiveProject
                                  ? 'text-[#1C93FF] bg-[#1C93FF]/10 border border-[#1C93FF]/30 hover:bg-[#1C93FF]/20'
                                  : 'text-white bg-[#1C93FF] hover:bg-[#1C93FF]/80'
                              }`}
                            >
                              <FolderOpen size={10} />
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

                      {/* Actions */}
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={() => onEditProject?.(project)}
                            title='Edit project'
                            className='p-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors'
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setPendingDelete(project)}
                            disabled={isDeleting}
                            title='Delete project'
                            className='p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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

      <DeleteConfirmModal
        project={pendingDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default ProjectTable;
