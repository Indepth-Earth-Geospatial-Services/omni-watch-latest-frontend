'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import { getMediaFiles } from '@/services/djiservice-layer/dji-service';
import type { MediaListResponse } from '@/lib/types/media';

export const mediaKeys = {
  all: ['dji', 'media'] as const,
  list: (workspaceId: string, params?: { page?: number; page_size?: number }) =>
    [...mediaKeys.all, workspaceId, 'list', params] as const,
};

export function useMediaFiles(
  workspaceId: string,
  params?: { page?: number; page_size?: number }
) {
  const { user } = useAuth();
  const wid = workspaceId || user?.workspace_id || DJI_CONFIG.WORKSPACE_ID;

  return useQuery<MediaListResponse>({
    queryKey: mediaKeys.list(wid, params),
    queryFn: () => getMediaFiles(wid, params),
    staleTime: 2 * 60 * 1000,
    enabled: !!wid,
  });
}
