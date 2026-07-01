'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import PilotUsersTab from '@/features/members/components/PilotUsersTab';
import WebUsersTab from '@/features/members/components/WebUsersTab';
import InviteMemberModal from '@/features/members/components/InviteMemberModal';
import { useDjiWorkspaceUsers, useUpdateDjiWorkspaceUser, useInviteMember } from '@/features/members/hooks/useMembers';
import { useAuth } from '@/providers/AuthProvider';
import type { UpdateDJIWorkspaceUserRequest, DJIWorkspaceUser } from '@/lib/types';

type MemberTab = 'pilot' | 'web';

export default function MembersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MemberTab>('web');

  const { data: djiUsers = [], isLoading, error } = useDjiWorkspaceUsers();
  const { mutate: updateDjiUser, isPending: isDjiUpdating } = useUpdateDjiWorkspaceUser();
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember();

  const isAdmin = user?.role === 'admin';

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

  const pilotUsers = djiUsers.filter((u: DJIWorkspaceUser) => u.user_type === 'Pilot');
  const webUsers = djiUsers.filter((u: DJIWorkspaceUser) => u.user_type === 'Web');

  const filteredPilotUsers = pilotUsers.filter((u: DJIWorkspaceUser) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.workspace_name.toLowerCase().includes(q)
    );
  });

  const filteredWebUsers = webUsers.filter((u: DJIWorkspaceUser) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.workspace_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className='font-ui space-y-4 px-4 pt-8 pb-4'>
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
            className='w-full text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-zinc-600'
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

      {/* Tabs */}
      <div className='flex items-center gap-1 border-b border-zinc-800/50'>
        {([
          { key: 'web' as MemberTab, label: 'Web Users', count: webUsers.length },
          { key: 'pilot' as MemberTab, label: 'Pilot Users', count: pilotUsers.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-xs font-semibold font-ui transition-colors ${
              activeTab === tab.key
                ? 'text-[#1C93FF]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            <span className='ml-1.5 text-[10px] text-zinc-600'>({tab.count})</span>
            {activeTab === tab.key && (
              <span className='absolute bottom-0 left-0 w-full h-[2px] bg-[#1C93FF]' />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'pilot' ? (
        <PilotUsersTab
          users={filteredPilotUsers}
          isLoading={isLoading}
          onUpdate={handleDjiUpdate}
          isUpdating={isDjiUpdating}
        />
      ) : (
        <WebUsersTab
          users={filteredWebUsers}
          isLoading={isLoading}
        />
      )}

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
