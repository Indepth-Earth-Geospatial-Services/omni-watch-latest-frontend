'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PlaneTakeoff,
  Loader2,
  Activity,
  Box,
  Wifi,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { useAssignDevice, useProjects } from '@/hooks/useProjects';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import type { Project } from '@/lib/types';

interface AssignDeviceToProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const AssignDeviceToProjectModal = ({ project, onClose }: AssignDeviceToProjectModalProps) => {
  const [mounted, setMounted] = useState(false);

  const { mutate: assign, isPending, variables, reset } = useAssignDevice();
  const { data: devices = [], isLoading: devicesLoading } = useDJIDevices();
  const { data: projectsPage } = useProjects();
  const allProjects = projectsPage?.list ?? [];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (project) reset();
  }, [project, reset]);

  // Close on Escape
  useEffect(() => {
    if (!project) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [project, onClose]);

  if (!project || !mounted) return null;

  const alreadyInThisProject = new Set(project.devices.map((d) => d.device_sn));

  // Find which project (if any) each device belongs to
  const projectOf = (sn: string) =>
    allProjects.find((p) => p.id !== project.id && p.devices.some((d) => d.device_sn === sn));

  const handleAssign = (sn: string) => {
    if (alreadyInThisProject.has(sn)) return;
    assign({ projectId: project.id, deviceSn: sn }, { onSuccess: onClose });
  };

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center font-poppins'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />

      {/* Modal card */}
      <div className='relative z-10 w-full max-w-md mx-4 bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]'>

        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-[#1C93FF]/10 border border-[#1C93FF]/20 rounded-lg'>
              <PlaneTakeoff size={16} className='text-[#1C93FF]' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-zinc-100'>Assign Device</h2>
              <p className='text-[11px] text-zinc-500 truncate max-w-[220px]'>{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        {/* Device list */}
        <div className='overflow-y-auto px-4 py-3 flex-1'>
          {devicesLoading ? (
            <div className='flex items-center justify-center py-12 gap-2 text-zinc-500'>
              <Loader2 size={16} className='animate-spin' />
              <span className='text-xs'>Loading devices…</span>
            </div>
          ) : devices.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 gap-2 text-zinc-600'>
              <PlaneTakeoff size={22} />
              <span className='text-xs'>No devices bound to this workspace.</span>
            </div>
          ) : (
            <ul className='space-y-1.5'>
              {devices.map((device) => {
                const isDrone = device.domain === '0';
                const inThisProject = alreadyInThisProject.has(device.deviceSn);
                const otherProject = projectOf(device.deviceSn);
                const isThisAssigning = isPending && variables?.deviceSn === device.deviceSn;

                return (
                  <li key={device.deviceSn}>
                    <button
                      onClick={() => handleAssign(device.deviceSn)}
                      disabled={inThisProject || isPending}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg border transition-colors text-left
                        ${inThisProject
                          ? 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed'
                          : 'bg-zinc-900 border-zinc-800 hover:border-[#1C93FF]/40 hover:bg-[#1C93FF]/5 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                      {/* Device icon */}
                      <div className='w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0'>
                        {isDrone
                          ? <Activity size={15} className='text-blue-400' />
                          : <Box size={15} className='text-cyan-400' />
                        }
                      </div>

                      {/* Device info */}
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-zinc-100 truncate'>
                          {device.nickname || device.deviceName || device.deviceSn}
                        </p>
                        <p className='text-[10px] font-mono text-zinc-500 truncate'>
                          {device.deviceSn}
                        </p>
                        {otherProject && (
                          <div className='flex items-center gap-1 mt-0.5'>
                            <FolderOpen size={9} className='text-amber-400' />
                            <span className='text-[9px] text-amber-400 truncate'>
                              In: {otherProject.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status + action */}
                      <div className='flex items-center gap-2 flex-shrink-0'>
                        <div className='flex items-center gap-1'>
                          <Wifi
                            size={11}
                            className={device.status ? 'text-emerald-400' : 'text-zinc-600'}
                          />
                          <span className={`text-[10px] font-semibold ${device.status ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {device.status ? 'Online' : 'Offline'}
                          </span>
                        </div>

                        {inThisProject ? (
                          <CheckCircle2 size={14} className='text-[#1C93FF]' />
                        ) : isThisAssigning ? (
                          <Loader2 size={14} className='text-[#1C93FF] animate-spin' />
                        ) : (
                          <CheckCircle2 size={14} className='text-zinc-700 group-hover:text-[#1C93FF] transition-colors' />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className='flex-shrink-0 px-5 py-3 border-t border-zinc-800'>
          <button
            onClick={onClose}
            className='w-full py-2 text-xs font-bold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 transition-colors'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssignDeviceToProjectModal;
