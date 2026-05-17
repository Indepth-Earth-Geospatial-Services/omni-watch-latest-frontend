// React Query hooks for DJI user management API.
// Components import from here — never from user-api.ts directly.
//
// Query key convention: ['dji', 'users', workspaceId, ...]

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/dji/config';
import { getCurrentUser, getWorkspaceUsers, updateUser } from '@/lib/dji/user-api';
import type { UpdateUserRequest } from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const userKeys = (workspaceId: string) => ({
  all:     ['dji', 'users', workspaceId] as const,
  list:    ['dji', 'users', workspaceId, 'list'] as const,
  current: ['dji', 'users', 'current'] as const,
});

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all users in the workspace with optional pagination.
 *
 * @example
 * const { data } = useWorkspaceUsers();
 * const users = data?.list ?? [];
 */
export function useWorkspaceUsers(params?: { page?: number; page_size?: number }) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey: userKeys(workspaceId).list,
    queryFn:  () => getWorkspaceUsers(workspaceId, params),
    enabled:  !!workspaceId,
    staleTime: 30_000,
  });
}

/**
 * Fetches the currently authenticated user's DJI profile.
 *
 * @example
 * const { data: currentUser } = useCurrentUser();
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys('').current,
    queryFn:  getCurrentUser,
    staleTime: 60_000,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Updates a user's profile fields.
 * On success: invalidates the workspace user list and current user queries.
 *
 * @example
 * const { mutate: update } = useUpdateUser();
 * update({ userId: 'abc', payload: { username: 'new-name' } });
 */
export function useUpdateUser() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userId: string; payload: UpdateUserRequest }>({
    mutationFn: ({ userId, payload }) => updateUser(workspaceId, userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys(workspaceId).all });
      queryClient.invalidateQueries({ queryKey: userKeys('').current });
    },
  });
}
