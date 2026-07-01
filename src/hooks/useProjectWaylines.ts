'use client';

import { useMemo } from 'react';
import { useWaylines } from '@/hooks/useWaylines';
import { useProject } from '@/providers/ProjectProvider';
import type { Wayline } from '@/lib/types';

export function useProjectWaylines() {
  const { data: allWaylines = [], isLoading } = useWaylines();
  const { activeProject } = useProject();

  const data = useMemo(() => {
    if (!activeProject) return [];
    const waylineIds = new Set(activeProject.flight_areas.map((fa) => fa.wayline_id));
    return allWaylines.filter((w) => waylineIds.has(w.id));
  }, [activeProject, allWaylines]);

  return { data, isLoading };
}
