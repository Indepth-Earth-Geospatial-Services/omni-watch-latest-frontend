import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi, teamsApi } from '@/lib/api';
import type { OrgUser, UpdateOrgUserRequest, AddOrgUserRequest, TeamInviteRequest, TeamInviteResponse } from '@/lib/types';

const memberKeys = {
  all: ['omniwatch', 'users'] as const,
  list: ['omniwatch', 'users', 'list'] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.list,
    queryFn: () => organizationApi.listUsers(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation<OrgUser, Error, AddOrgUserRequest>({
    mutationFn: (body) => organizationApi.addUser(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation<OrgUser, Error, { userId: string; payload: UpdateOrgUserRequest }>({
    mutationFn: ({ userId, payload }) => organizationApi.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation<TeamInviteResponse, Error, TeamInviteRequest>({
    mutationFn: (body) => teamsApi.invite(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
