import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi, teamsApi } from '@/lib/api';
import { djiRequest } from '@/lib/config/client';
import { DJI_URLS } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import type {
  OrgUser,
  UpdateOrgUserRequest,
  AddOrgUserRequest,
  TeamInviteRequest,
  TeamInviteResponse,
  DJIWorkspaceUser,
  DJIWorkspaceUserListResponse,
  UpdateDJIWorkspaceUserRequest,
} from '@/lib/types';

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

// ─── DJI Workspace Users ─────────────────────────────────────────────────────

const djiUserKeys = {
  all: ['dji', 'users'] as const,
  list: (wsId: string) => ['dji', 'users', wsId, 'list'] as const,
};

/** Lists all DJI workspace users for the current workspace. */
export function useDjiWorkspaceUsers() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey: djiUserKeys.list(workspaceId),
    queryFn: () => djiRequest.get<DJIWorkspaceUserListResponse>(DJI_URLS.users.list(workspaceId)),
    staleTime: 30_000,
    enabled: !!workspaceId,
    select: (data) => data.list,
  });
}

/** Updates a DJI workspace user's MQTT credentials. */
export function useUpdateDjiWorkspaceUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useMutation<void, Error, { userId: string; body: UpdateDJIWorkspaceUserRequest }>({
    mutationFn: ({ userId, body }) =>
      djiRequest.put<void>(DJI_URLS.users.update(workspaceId, userId), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: djiUserKeys.all });
    },
  });
}
