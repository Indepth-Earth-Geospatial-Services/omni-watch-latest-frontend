'use client';

import React, { useEffect, useState } from 'react';
import { X, Pencil, Loader2 } from 'lucide-react';
import { useUpdateProject } from '@/hooks/useProjects';
import { useProject } from '@/providers/ProjectProvider';
import type { Project } from '@/lib/types';

interface EditProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const EditProjectModal = ({ project, onClose }: EditProjectModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const { mutate: updateProject, isPending, error } = useUpdateProject();
  const { activeProject, setActiveProject } = useProject();

  // Pre-fill form whenever a different project is opened for editing
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setNameError('');
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!name.trim()) {
      setNameError('Project name is required.');
      return;
    }
    updateProject(
      { id: project.id, body: { name: name.trim(), description: description.trim() } },
      {
        onSuccess: (updated) => {
          // Keep ProjectProvider in sync if the user edited the currently active project
          if (activeProject?.id === updated.id) {
            setActiveProject(updated);
          }
          onClose();
        },
      }
    );
  };

  if (!project) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

      {/* Modal card */}
      <div className='relative w-full max-w-md bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-zinc-800 border border-zinc-700 rounded-lg'>
              <Pencil size={15} className='text-zinc-300' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-zinc-100'>Edit Project</h2>
              <p className='text-[11px] text-zinc-500 truncate max-w-[240px]'>{project.name}</p>
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
              className='flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-zinc-700 rounded-lg hover:bg-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
            >
              {isPending ? (
                <>
                  <Loader2 size={12} className='animate-spin' />
                  Saving…
                </>
              ) : (
                <>
                  <Pencil size={12} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
