'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import MembersHeader from '@/features/members/components/MembersHeader';
import MembersTable from '@/features/members/components/MembersTable';
import InviteMemberModal from '@/features/members/components/InviteMemberModal';
import EditMemberModal from '@/features/members/components/EditMemberModal';
import { useMembers, useAddMember, useUpdateMember, useInviteMember } from '@/features/members/hooks/useMembers';
import type { OrgUser, UpdateOrgUserRequest, AddOrgUserRequest, TeamInviteRequest } from '@/lib/types';

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgUser | null>(null);

  const { data: members = [], isLoading, error } = useMembers();
  const { mutate: addMember, isPending: isAdding } = useAddMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember();
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember();

  useEffect(() => {
    if (error) toast.error(error.message, { id: 'members-load-error' });
  }, [error]);

  const handleAddMember = useCallback((body: AddOrgUserRequest) => {
    addMember(body, {
      onSuccess: () => {
        toast.success('Member added successfully');
        setInviteOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  }, [addMember]);

  const handleInvite = useCallback((body: TeamInviteRequest) => {
    inviteMember(body, {
      onSuccess: () => {
        toast.success('Invitation sent');
        setInviteOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  }, [inviteMember]);

  const handleSaveEdit = useCallback((userId: string, payload: UpdateOrgUserRequest) => {
    updateMember({ userId, payload }, {
      onSuccess: () => {
        toast.success('Member updated');
        setEditTarget(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }, [updateMember]);

  return (
    <>
      <div className='mt-10'>
        <MembersHeader
          onSearch={setSearch}
          onInviteClick={() => setInviteOpen(true)}
        />
      </div>
      <main className='p-4'>
        <MembersTable
          members={members}
          isLoading={isLoading}
          error={error}
          searchTerm={search}
          onEdit={setEditTarget}
        />
      </main>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onAddMember={handleAddMember}
        onInvite={handleInvite}
        isAdding={isAdding}
        isInviting={isInviting}
      />

      <EditMemberModal
        member={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        isSaving={isUpdating}
      />
    </>
  );
}
