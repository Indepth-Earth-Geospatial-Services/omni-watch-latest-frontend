// React Query hooks for OmniWatch project management.
// Routes through /api/omniwatch/ proxy (OmniWatch port 8002).
//
// Query key convention: ['omniwatch', 'projects', ...]

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/services/authservice-layer/auth-service';
import type { Project, ProjectBody, PageParams } from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const projectKeys = {
  all: ['omniwatch', 'projects'] as const,
  list: (params?: PageParams) => ['omniwatch', 'projects', 'list', params ?? {}] as const,
  detail: (id: string) => ['omniwatch', 'projects', id] as const,
};

// ─── Read hooks ───────────────────────────────────────────────────────────────

/** Fetches a paginated list of all projects for the authenticated organisation. */
export function useProjects(params?: PageParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectsApi.list(params),
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Fetches a single project by UUID.
 * Query is disabled when `id` is an empty string.
 */
export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.get(id),
    staleTime: 30_000,
    retry: 1,
    enabled: !!id,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Creates a new project.
 * On success: invalidates the project list query.
 *
 * @example
 * const { mutate: create } = useCreateProject();
 * create({ name: 'Mission Alpha', description: 'Northern perimeter scan' });
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectBody>({
    mutationFn: (body) => projectsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Fully updates a project (PUT).
 * On success: invalidates both the list and the individual detail query.
 *
 * @example
 * const { mutate: update } = useUpdateProject();
 * update({ id: 'abc-123', body: { name: 'Renamed', description: '...' } });
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { id: string; body: ProjectBody }>({
    mutationFn: ({ id, body }) => projectsApi.update(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

/**
 * Permanently deletes a project.
 * On success: invalidates the project list query.
 *
 * @example
 * const { mutate: remove } = useDeleteProject();
 * remove('abc-123');
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
