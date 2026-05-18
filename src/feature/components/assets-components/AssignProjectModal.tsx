'use client';

import React from 'react';
import { X, FolderOpen, Loader2, FolderX, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAssignDevice } from '@/hooks/useProjects';

interface AssignProjectModalProps {
  deviceSn: string | null;
  deviceName: string;
  onClose: () => void;
}

const AssignProjectModal = ({ deviceSn, deviceName, onClose }: AssignProjectModalProps) => {
  const { data, isLoading } = useProjects();
  const { mutate: assign, isPending, variables } = useAssignDevice();

  if (!deviceSn) return null;

  const projects = data?.list ?? [];

  const handleAssign = (projectId: string) => {
    assign(
      { projectId, deviceSn },
      { onSuccess: onClose }
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

      {/* Modal card */}
      <div className='relative w-full max-w-sm bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-zinc-800'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-[#1C93FF]/10 border border-[#1C93FF]/20 rounded-lg'>
              <FolderOpen size={15} className='text-[#1C93FF]' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-zinc-100'>Assign to Project</h2>
              <p className='text-[11px] text-zinc-500 truncate max-w-[180px]'>{deviceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
          >
            <X size={15} />
          </button>
        </div>

        {/* Project list */}
        <div className='px-4 py-3 max-h-[320px] overflow-y-auto'>
          {isLoading ? (
            <div className='flex items-center justify-center py-10 gap-2 text-zinc-500'>
              <Loader2 size={16} className='animate-spin' />
              <span className='text-xs'>Loading projects…</span>
            </div>
          ) : projects.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 gap-2 text-zinc-600'>
              <FolderX size={22} />
              <span className='text-xs'>No projects found. Create one first.</span>
            </div>
          ) : (
            <ul className='space-y-1.5'>
              {projects.map((project) => {
                const isThisAssigning =
                  isPending && variables?.projectId === project.id;

                return (
                  <li key={project.id}>
                    <button
                      onClick={() => handleAssign(project.id)}
                      disabled={isPending}
                      className='w-full flex items-center justify-between px-3 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#1C93FF]/40 hover:bg-[#1C93FF]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left group'
                    >
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-sm font-semibold text-zinc-100 group-hover:text-white'>
                          {project.name}
                        </span>
                        {project.description && (
                          <span className='text-[11px] text-zinc-500 line-clamp-1'>
                            {project.description}
                          </span>
                        )}
                        <span className='text-[10px] text-zinc-600 font-mono'>
                          {project.devices.length} device{project.devices.length !== 1 ? 's' : ''} assigned
                        </span>
                      </div>

                      {isThisAssigning ? (
                        <Loader2 size={14} className='text-[#1C93FF] animate-spin flex-shrink-0' />
                      ) : (
                        <CheckCircle2
                          size={14}
                          className='text-zinc-700 group-hover:text-[#1C93FF] flex-shrink-0 transition-colors'
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className='px-5 py-3 border-t border-zinc-800'>
          <button
            onClick={onClose}
            className='w-full py-2 text-xs font-bold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 transition-colors'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignProjectModal;
