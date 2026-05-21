'use client';

import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProjects';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectModal = ({ open, onClose }: CreateProjectModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const { mutate: createProject, isPending, error, reset } = useCreateProject();

  // Reset form fields and mutation state each time the modal opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setNameError('');
      reset();
    }
  }, [open, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Project name is required.');
      return;
    }
    createProject(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: onClose }
    );
  };

  if (!open) return null;

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
              <FolderPlus size={16} className='text-[#1C93FF]' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-zinc-100'>New Project</h2>
              <p className='text-[11px] text-zinc-500'>Create a new project workspace</p>
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
          {/* Project Name */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
              Project Name <span className='text-red-400'>*</span>
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder='e.g. Northern Perimeter Scan'
              autoFocus
              className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors
                ${nameError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-[#1C93FF]'}`}
            />
            {nameError && <p className='text-[11px] text-red-400'>{nameError}</p>}
          </div>

          {/* Description */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
              Description{' '}
              <span className='text-zinc-600 font-normal normal-case tracking-normal'>
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Brief description of this project scope, goals, or notes'
              rows={3}
              className='w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#1C93FF] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 outline-none resize-none transition-colors'
            />
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
                  Creating…
                </>
              ) : (
                <>
                  <FolderPlus size={12} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
