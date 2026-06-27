'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import DJIMembersTable from '@/features/members/components/DJIMembersTable';
import InviteMemberModal from '@/features/members/components/InviteMemberModal';
import { useDjiWorkspaceUsers, useUpdateDjiWorkspaceUser, useInviteMember } from '@/features/members/hooks/useMembers';
import { useAuth } from '@/providers/AuthProvider';
import type { UpdateDJIWorkspaceUserRequest } from '@/lib/types';

export default function MembersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: djiUsers = [], isLoading, error } = useDjiWorkspaceUsers();
  const { mutate: updateDjiUser, isPending: isDjiUpdating } = useUpdateDjiWorkspaceUser();
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember();

  const isAdmin = user?.user_type === 1;

  useEffect(() => {
    if (error) toast.error(error.message, { id: 'dji-users-load-error' });
  }, [error]);

  const handleDjiUpdate = useCallback((userId: string, body: UpdateDJIWorkspaceUserRequest) => {
    updateDjiUser({ userId, body }, {
      onSuccess: () => {
        toast.success('MQTT credentials updated');
      },
      onError: (err) => toast.error(err.message),
    });
  }, [updateDjiUser]);

  const handleInvite = useCallback((body: { email: string; workspace_id: string; role: string }) => {
    inviteMember(body, {
      onSuccess: () => {
        toast.success('Invitation sent');
        setInviteOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  }, [inviteMember]);

  return (
    <div className='font-poppins space-y-4 px-4 pt-6 pb-4'>
      {/* Filter bar */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Search size={12} className='text-zinc-500' />
          </div>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search members...'
            className='w-full text-xs font-poppins text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-zinc-600'
          />
        </div>

        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            className='flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-[#1C93FF] rounded-lg hover:bg-[#1C93FF]/80 transition-colors'
          >
            <UserPlus size={13} />
            Invite Member
          </button>
        )}
      </div>

      <DJIMembersTable
        users={djiUsers}
        isLoading={isLoading}
        searchTerm={search}
        onUpdate={handleDjiUpdate}
        isUpdating={isDjiUpdating}
      />

      {isAdmin && (
        <InviteMemberModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
          isInviting={isInviting}
          workspaceId={user?.workspace_id ?? ''}
        />
      )}
    </div>
  );
}
