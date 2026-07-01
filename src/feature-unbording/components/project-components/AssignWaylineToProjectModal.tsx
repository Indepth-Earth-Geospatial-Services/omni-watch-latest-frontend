'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Route,
  Loader2,
  Search,
  CheckCircle2,
  Map,
} from 'lucide-react';
import { useAssignWayline } from '@/hooks/useProjects';
import { useWaylines } from '@/hooks/useWaylines';
import type { Project, Wayline } from '@/lib/types';

const TEMPLATE_TYPE_MAP: Record<number, string> = {
  0: 'Waypoint',
  1: 'Mapping 2D',
  2: 'Mapping 3D',
  3: 'Inspection',
};

interface AssignWaylineToProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const AssignWaylineToProjectModal = ({ project, onClose }: AssignWaylineToProjectModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  const { mutate: assign, isPending, variables, reset } = useAssignWayline();
  const { data: waylines = [], isLoading: waylinesLoading } = useWaylines();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (project) {
      reset();
      setSearch('');
    }
  }, [project, reset]);

  useEffect(() => {
    if (!project) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [project, onClose]);

  if (!project || !mounted) return null;

  const assignedWaylineIds = new Set(project.flight_areas.map((fa) => fa.wayline_id));

  const filtered = waylines.filter((w) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.drone_model_key.toLowerCase().includes(q);
  });

  const assignedWaylines = filtered.filter((w) => assignedWaylineIds.has(w.id));
  const availableWaylines = filtered.filter((w) => !assignedWaylineIds.has(w.id));

  const handleAssign = (wayline: Wayline) => {
    if (assignedWaylineIds.has(wayline.id)) return;
    assign({ projectId: project.id, waylineId: wayline.id }, { onSuccess: onClose });
  };

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center font-poppins'>
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />

      <div className='relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]'>

        <div className='flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg'>
              <Route size={16} className='text-emerald-400' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-foreground'>Assign Wayline</h2>
              <p className='text-[11px] text-muted-foreground truncate max-w-[220px]'>{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        <div className='px-4 pt-3 flex-shrink-0'>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
              <Search size={12} className='text-muted-foreground' />
            </div>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search waylines...'
              className='w-full text-xs font-poppins text-muted-foreground bg-secondary border border-border rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-border'
            />
          </div>
        </div>

        <div className='overflow-y-auto px-4 py-3 flex-1'>
          {waylinesLoading ? (
            <div className='flex items-center justify-center py-12 gap-2 text-muted-foreground'>
              <Loader2 size={16} className='animate-spin' />
              <span className='text-xs'>Loading waylines…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground'>
              <Map size={22} />
              <span className='text-xs'>
                {search ? 'No waylines match your search.' : 'No waylines found.'}
              </span>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Assigned waylines */}
              {assignedWaylines.length > 0 && (
                <div>
                  <p className='text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2 px-1'>
                    Assigned ({assignedWaylines.length})
                  </p>
                  <ul className='space-y-1.5'>
                    {assignedWaylines.map((wayline) => {
                      const labels = wayline.template_types.map((t) => TEMPLATE_TYPE_MAP[t] ?? `Type ${t}`);
                      return (
                        <li key={wayline.id}>
                          <div className='w-full flex items-center gap-3 px-3.5 py-3 rounded-lg border bg-secondary/50 border-border opacity-60 text-left'>
                            <div className='w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center flex-shrink-0'>
                              <Route size={15} className='text-muted-foreground' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-semibold text-muted-foreground truncate'>
                                {wayline.name}
                              </p>
                              <div className='flex items-center gap-2 mt-0.5'>
                                <span className='text-[10px] font-mono text-zinc-500'>
                                  {wayline.drone_model_key}
                                </span>
                                {labels.map((l) => (
                                  <span key={l} className='text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground font-medium'>
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <CheckCircle2 size={14} className='text-emerald-400 flex-shrink-0' />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Available waylines */}
              {availableWaylines.length > 0 && (
                <div>
                  <p className='text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2 px-1'>
                    Available ({availableWaylines.length})
                  </p>
                  <ul className='space-y-1.5'>
                    {availableWaylines.map((wayline) => {
                      const isThisAssigning = isPending && variables?.waylineId === wayline.id;
                      const labels = wayline.template_types.map((t) => TEMPLATE_TYPE_MAP[t] ?? `Type ${t}`);
                      return (
                        <li key={wayline.id}>
                          <button
                            onClick={() => handleAssign(wayline)}
                            disabled={isPending}
                            className='w-full flex items-center gap-3 px-3.5 py-3 rounded-lg border bg-secondary border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left'
                          >
                            <div className='w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center flex-shrink-0'>
                              <Route size={15} className='text-emerald-400' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-semibold text-foreground truncate'>
                                {wayline.name}
                              </p>
                              <div className='flex items-center gap-2 mt-0.5'>
                                <span className='text-[10px] font-mono text-muted-foreground'>
                                  {wayline.drone_model_key}
                                </span>
                                {labels.map((l) => (
                                  <span key={l} className='text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground font-medium'>
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className='flex items-center gap-2 flex-shrink-0'>
                              {isThisAssigning ? (
                                <Loader2 size={14} className='text-emerald-400 animate-spin' />
                              ) : (
                                <CheckCircle2 size={14} className='text-border' />
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='flex-shrink-0 px-5 py-3 border-t border-border'>
          <button
            onClick={onClose}
            className='w-full py-2 text-xs font-bold text-muted-foreground border border-border rounded-lg hover:border-border hover:text-foreground transition-colors'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssignWaylineToProjectModal;
