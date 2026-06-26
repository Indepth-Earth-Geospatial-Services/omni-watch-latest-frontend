import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchDetections, detectionKeys, type DetectionFilters } from '@/lib/api/alerts';
import type { ThreatDetection } from '@/lib/types/threats';

interface UseDetectionsOptions {
  filters?: Omit<DetectionFilters, 'page' | 'page_size'>;
  enabled?: boolean;
}

export function useDetections({ filters = {}, enabled = true }: UseDetectionsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: detectionKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchDetections({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    maxPages: 5,
    staleTime: 30_000,
    enabled,
  });

  const detections = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.detections);
  }, [query.data]);

  return {
    detections,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    total: query.data?.pages[0]?.detections.length ?? 0,
  };
}

export type { DetectionFilters };
