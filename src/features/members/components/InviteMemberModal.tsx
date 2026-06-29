'use client';

import { useState } from 'react';
import { X, Loader2, Mail, Shield } from 'lucide-react';
import type { TeamInviteRequest } from '@/lib/types';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to manage workspace, members, and settings' },
  { value: 'analyst', label: 'Analyst', description: 'View and analyze flight data, media, and detections' },
  { value: 'pilot', label: 'Pilot', description: 'Execute flights and manage devices' },
] as const;

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (body: TeamInviteRequest) => void;
  isInviting: boolean;
  workspaceId: string;
}

export default function InviteMemberModal({ open, onClose, onInvite, isInviting, workspaceId }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('pilot');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onInvite({ email, workspace_id: workspaceId, role });
    setEmail('');
    setRole('pilot');
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center'>
      <div className='bg-card border border-zinc-800 rounded-xl w-full max-w-md mx-4 shadow-2xl shadow-black/60'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <h3 className='text-lg font-semibold text-zinc-100'>Invite Member</h3>
          <button onClick={onClose} className='p-1 hover:bg-zinc-800 rounded transition-colors'>
            <X className='w-5 h-5 text-zinc-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 pb-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-400 mb-1'>Email Address</label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                <Mail size={14} className='text-zinc-500' />
              </div>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='user@example.com'
                className='w-full pl-9 pr-3 py-2 bg-input border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-zinc-600'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-zinc-400 mb-2'>Role</label>
            <div className='space-y-2'>
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    role === r.value
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <input
                    type='radio'
                    name='role'
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value)}
                    className='mt-0.5 accent-blue-500'
                  />
                  <div>
                    <div className='flex items-center gap-1.5'>
                      <Shield size={12} className='text-zinc-400' />
                      <span className='text-sm font-medium text-zinc-200'>{r.label}</span>
                    </div>
                    <p className='text-xs text-zinc-500 mt-0.5'>{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-zinc-400 border border-zinc-700 rounded-md hover:bg-zinc-800 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isInviting}
              className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2'
            >
              {isInviting ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
