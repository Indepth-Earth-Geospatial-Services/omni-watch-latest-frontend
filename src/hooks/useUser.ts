// React Query hooks for OmniWatch organization user management.
// Routes through /api/omniwatch/ proxy (OmniWatch port 8002) — NOT the DJI Cloud server.
//
// Query key convention: ['omniwatch', 'users', ...]

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '@/services/authservice-layer/auth-service';
import { authApi } from '@/services/authservice-layer/auth-api';
import type { OrgUser, UpdateOrgUserRequest } from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const userKeys = {
  all: ['omniwatch', 'users'] as const,
  list: ['omniwatch', 'users', 'list'] as const,
  current: ['omniwatch', 'users', 'current'] as const,
};

// ─── Read hooks ───────────────────────────────────────────────────────────────

/** Fetches all users in the authenticated organisation from OmniWatch. */
export function useWorkspaceUsers() {
  return useQuery({
    queryKey: userKeys.list,
    queryFn: () => organizationApi.listUsers(),
    staleTime: 30_000,
    retry: 1,
  });
}

/** Returns the currently authenticated principal's org/workspace metadata. */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current,
    queryFn: () => authApi.me(),
    staleTime: 60_000,
    retry: 1,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Updates an organisation user's profile fields.
 * On success: invalidates the user list query.
 *
 * @example
 * const { mutate: update } = useUpdateUser();
 * update({ userId: 'abc', payload: { full_name: 'New Name' } });
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<OrgUser, Error, { userId: string; payload: UpdateOrgUserRequest }>({
    mutationFn: ({ userId, payload }) => organizationApi.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
