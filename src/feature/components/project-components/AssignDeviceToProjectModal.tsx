'use client';

import React, { useEffect, useState } from 'react';
import { X, PlaneTakeoff, Loader2 } from 'lucide-react';
import { useAssignDevice } from '@/hooks/useProjects';
import type { Project } from '@/lib/types';

interface AssignDeviceToProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const AssignDeviceToProjectModal = ({ project, onClose }: AssignDeviceToProjectModalProps) => {
  const [deviceSn, setDeviceSn] = useState('');
  const [snError, setSnError] = useState('');

  const { mutate: assign, isPending, error, reset } = useAssignDevice();

  useEffect(() => {
    if (project) {
      setDeviceSn('');
      setSnError('');
      reset();
    }
  }, [project, reset]);

  if (!project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sn = deviceSn.trim();
    if (!sn) {
      setSnError('Device serial number is required.');
      return;
    }
    assign(
      { projectId: project.id, deviceSn: sn },
      { onSuccess: onClose }
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

      {/* Modal card */}
      <div className='relative w-full max-w-md bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800'>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
          {/* Currently assigned */}
          {project.devices.length > 0 && (
            <div className='space-y-1.5'>
              <p className='text-[10px] font-black tracking-wider text-zinc-500 uppercase'>
                Currently Assigned ({project.devices.length})
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {project.devices.map((d) => (
                  <span
                    key={d.id}
                    className='px-2 py-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded'
                  >
                    {d.device_sn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Device SN input */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
              Device Serial Number <span className='text-red-400'>*</span>
            </label>
            <input
              type='text'
              value={deviceSn}
              onChange={(e) => {
                setDeviceSn(e.target.value);
                if (snError) setSnError('');
              }}
              placeholder='e.g. 1ZNBJ9D001234'
              autoFocus
              className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 font-mono outline-none transition-colors
                ${snError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-[#1C93FF]'}`}
            />
            {snError && <p className='text-[11px] text-red-400'>{snError}</p>}
            <p className='text-[10px] text-zinc-600'>
              The device must be bound to this organisation's workspace.
            </p>
          </div>

          {/* API error */}
          {error && (
            <p className='text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2'>
              {error.message}
            </p>
          )}

          {/* Actions */}
          <div className='flex items-center justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              disabled={isPending}
              className='px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isPending}
              className='flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1C93FF] rounded-lg hover:bg-[#1C93FF]/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
            >
              {isPending ? (
                <>
                  <Loader2 size={12} className='animate-spin' />
                  Assigning…
                </>
              ) : (
                <>
                  <PlaneTakeoff size={12} />
                  Assign Device
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignDeviceToProjectModal;
