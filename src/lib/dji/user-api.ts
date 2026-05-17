// User management API functions for the DJI Cloud API.
// All requests flow through client.ts → proxy route handler → DJI server.
//
// Endpoint prefix: /manage/api/v1
// workspaceId is sourced from useAuth().user.workspace_id at the hook layer.

import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type { DJIUser, UpdateUserRequest, WorkspaceUsersResponse } from '@/lib/types';

const { MANAGE } = DJI_CONFIG;

/**
 * Lists all users in a workspace with optional pagination.
 *
 * GET /manage/api/v1/users/{workspace_id}/users
 */
export function getWorkspaceUsers(
  workspaceId: string,
  params?: { page?: number; page_size?: number }
): Promise<WorkspaceUsersResponse> {
  const query = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return djiRequest.get<WorkspaceUsersResponse>(
    `${MANAGE}/users/${workspaceId}/users${query}`
  );
}

/**
 * Returns the currently authenticated user's profile.
 * Swagger shows data: {} — actual response is the user object.
 *
 * GET /manage/api/v1/users/current
 */
export function getCurrentUser(): Promise<DJIUser> {
  return djiRequest.get<DJIUser>(`${MANAGE}/users/current`);
}

/**
 * Updates a user's profile fields.
 *
 * PUT /manage/api/v1/users/{workspace_id}/users/{user_id}
 */
export function updateUser(
  workspaceId: string,
  userId: string,
  payload: UpdateUserRequest
): Promise<void> {
  return djiRequest.put<void>(
    `${MANAGE}/users/${workspaceId}/users/${userId}`,
    payload
  );
}
