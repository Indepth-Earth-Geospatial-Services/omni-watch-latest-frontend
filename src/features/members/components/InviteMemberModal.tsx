'use client';

import { useState } from 'react';
import { X, UserPlus, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import type { AddOrgUserRequest, TeamInviteRequest } from '@/lib/types';

type Tab = 'add' | 'invite';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onAddMember: (body: AddOrgUserRequest) => void;
  onInvite: (body: TeamInviteRequest) => void;
  isAdding: boolean;
  isInviting: boolean;
}

const ROLES = ['admin', 'commander', 'analyst', 'pilot'] as const;

export default function InviteMemberModal({
  open,
  onClose,
  onAddMember,
  onInvite,
  isAdding,
  isInviting,
}: InviteMemberModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('add');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<string>('analyst');

  if (!open) return null;

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAddMember({ full_name: fullName, email, pin });
  }

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    onInvite({
      email,
      workspace_id: user?.workspace_id ?? '',
      role,
    });
  }

  function handleClose() {
    setFullName('');
    setEmail('');
    setPin('');
    setRole('analyst');
    setTab('add');
    onClose();
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center'>
      <div className='bg-[#1A1C20] border border-zinc-800 rounded-xl w-full max-w-md mx-4 shadow-2xl shadow-black/60'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <h3 className='text-lg font-semibold text-zinc-100'>Add Member</h3>
          <button onClick={handleClose} className='p-1 hover:bg-zinc-800 rounded transition-colors'>
            <X className='w-5 h-5 text-zinc-500' />
          </button>
        </div>

        <div className='flex border-b border-zinc-800 px-6'>
          <button
            onClick={() => setTab('add')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'add'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UserPlus className='w-4 h-4' />
            Add Direct
          </button>
          <button
            onClick={() => setTab('invite')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === 'invite'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mail className='w-4 h-4' />
            Invite by Email
          </button>
        </div>

        <div className='px-6 py-4'>
          {tab === 'add' ? (
            <form onSubmit={handleAddSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>Full Name</label>
                <input
                  type='text'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className='w-full px-3 py-2 bg-[#32353C] border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>Email</label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full px-3 py-2 bg-[#32353C] border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>PIN</label>
                <input
                  type='password'
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className='w-full px-3 py-2 bg-[#32353C] border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                  required
                  minLength={4}
                  maxLength={20}
                />
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={handleClose}
                  className='px-4 py-2 text-sm font-medium text-zinc-400 border border-zinc-700 rounded-md hover:bg-zinc-800 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isAdding}
                  className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2'
                >
                  {isAdding ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
                  {isAdding ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleInviteSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>Email</label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full px-3 py-2 bg-[#32353C] border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-400 mb-1'>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className='w-full px-3 py-2 bg-[#32353C] border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className='capitalize'>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {user?.workspace_id && (
                <p className='text-[10px] text-zinc-600 font-mono'>
                  Workspace: {user.workspace_id}
                </p>
              )}
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={handleClose}
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
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
