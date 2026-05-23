'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { OrgUser, UpdateOrgUserRequest } from '@/lib/types';

interface EditMemberModalProps {
  member: OrgUser | null;
  onClose: () => void;
  onSave: (userId: string, payload: UpdateOrgUserRequest) => void;
  isSaving: boolean;
}

export default function EditMemberModal({ member, onClose, onSave, isSaving }: EditMemberModalProps) {
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [resetPin, setResetPin] = useState(false);

  useEffect(() => {
    if (member) {
      setFullName(member.full_name);
      setIsActive(member.is_active);
      setPin('');
      setResetPin(false);
    }
  }, [member]);

  if (!member) return null;
  const m = member;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UpdateOrgUserRequest = { full_name: fullName, is_active: isActive };
    if (resetPin && pin) payload.pin = pin;
    onSave(m.id, payload);
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center'>
      <div className='bg-[#1A1C20] border border-zinc-800 rounded-xl w-full max-w-md mx-4 shadow-2xl shadow-black/60'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <h3 className='text-lg font-semibold text-zinc-100'>Edit Member</h3>
          <button onClick={onClose} className='p-1 hover:bg-zinc-800 rounded transition-colors'>
            <X className='w-5 h-5 text-zinc-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 pb-6 space-y-4'>
          <div className='flex items-center gap-3 mb-2 bg-zinc-800/50 px-4 py-3 rounded-lg'>
            <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0'>
              <span className='text-xs font-bold text-white'>
                {m.full_name.split(/\s+/).map(s => s[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-medium text-zinc-200 truncate'>{m.full_name}</p>
              <p className='text-xs text-zinc-500 truncate'>{m.email}</p>
            </div>
          </div>

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

          <div className='flex items-center gap-3'>
            <input
              id='reset-pin'
              type='checkbox'
              checked={resetPin}
              onChange={(e) => setResetPin(e.target.checked)}
              className='w-4 h-4 rounded border-zinc-700 bg-[#32353C] accent-blue-500'
            />
            <label htmlFor='reset-pin' className='text-sm font-medium text-zinc-400'>
              Reset PIN
            </label>
          </div>

          {resetPin && (
            <div>
              <label className='block text-sm font-medium text-zinc-400 mb-1'>New PIN</label>
              <input
                type='password'
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className='w-full px-3 py-2 bg-[#32353C] border border-zinc-700 rounded-md text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent'
                minLength={4}
                maxLength={20}
                required={resetPin}
              />
            </div>
          )}

          <div className='flex items-center gap-3 pt-2'>
            <input
              id='is-active'
              type='checkbox'
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className='w-4 h-4 rounded border-zinc-700 bg-[#32353C] accent-blue-500'
            />
            <label htmlFor='is-active' className='text-sm font-medium text-zinc-400'>
              Active account
            </label>
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
              disabled={isSaving}
              className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2'
            >
              {isSaving ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
