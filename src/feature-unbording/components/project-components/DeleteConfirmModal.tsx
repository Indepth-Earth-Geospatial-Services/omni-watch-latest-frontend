'use client';

import React from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import type { Project } from '@/lib/types';

interface DeleteConfirmModalProps {
  project: Project | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteConfirmModal = ({
  project,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) => {
  if (!project) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal card */}
      <div className='relative w-full max-w-sm bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-red-500/10 border border-red-500/20 rounded-lg'>
              <AlertTriangle size={15} className='text-red-400' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-zinc-100'>Delete Project</h2>
              <p className='text-[11px] text-zinc-500'>This action cannot be undone</p>
            </div>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className='p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className='px-6 py-5 space-y-4'>
          <p className='text-sm text-zinc-400 leading-relaxed'>
            You are about to permanently delete{' '}
            <span className='font-bold text-zinc-100 break-all'>&quot;{project.name}&quot;</span>.
          </p>

          {/* Consequences */}
          <div className='rounded-lg bg-red-500/5 border border-red-500/15 px-4 py-3 space-y-1.5'>
            <p className='text-[11px] font-bold text-red-400 uppercase tracking-wider'>
              This will remove
            </p>
            <ul className='space-y-1'>
              {[
                `${project.devices.length} assigned device${project.devices.length !== 1 ? 's' : ''}`,
                `${project.flight_areas.length} flight area${project.flight_areas.length !== 1 ? 's' : ''}`,
                'All project metadata',
              ].map((item) => (
                <li key={item} className='flex items-center gap-2 text-[12px] text-zinc-500'>
                  <span className='w-1 h-1 rounded-full bg-red-500/60 flex-shrink-0' />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              disabled={isDeleting}
              className='px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={onConfirm}
              disabled={isDeleting}
              className='flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
            >
              {isDeleting ? (
                <>
                  <Loader2 size={12} className='animate-spin' />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={12} />
                  Delete Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
