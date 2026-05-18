'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Project } from '@/lib/types';
import { useProjectDetail } from '@/hooks/useProjects';

const STORAGE_KEY = 'active_project';

// ─── Context shape ────────────────────────────────────────────────────────────

interface ProjectContextValue {
  /** The currently selected project, or null when none is open */
  activeProject: Project | null;
  /** Persist a project selection — survives page refresh, cleared on tab close */
  setActiveProject: (project: Project | null) => void;
  /** Convenience alias for setActiveProject(null) */
  clearActiveProject: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ─── Inner provider (needs to be a separate component so useProjectDetail
//     can be called inside ProjectContext.Provider without violating hook rules) ─

function ProjectProviderInner({
  children,
  activeProject,
  setActiveProject,
  clearActiveProject,
}: ProjectContextValue & { children: React.ReactNode }) {
  // Fetch the latest version of the active project from the API.
  // enabled: false when no project is selected → no unnecessary requests.
  const { data: freshProject } = useProjectDetail(activeProject?.id ?? '');

  // Sync context whenever the API returns data that differs from what we have stored.
  // Catches external changes: device assignments from another session, name edits, etc.
  useEffect(() => {
    if (!freshProject || !activeProject) return;
    if (freshProject.id !== activeProject.id) return;

    const hasChanged =
      freshProject.name !== activeProject.name ||
      freshProject.description !== activeProject.description ||
      JSON.stringify(freshProject.devices) !== JSON.stringify(activeProject.devices) ||
      JSON.stringify(freshProject.flight_areas) !== JSON.stringify(activeProject.flight_areas);

    if (hasChanged) {
      setActiveProject(freshProject);
    }
  }, [freshProject]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, clearActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Project) : null;
    } catch {
      return null;
    }
  });

  const setActiveProject = useCallback((project: Project | null) => {
    setActiveProjectState(project);
    if (typeof window === 'undefined') return;
    if (project) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearActiveProject = useCallback(() => {
    setActiveProject(null);
  }, [setActiveProject]);

  return (
    <ProjectProviderInner
      activeProject={activeProject}
      setActiveProject={setActiveProject}
      clearActiveProject={clearActiveProject}
    >
      {children}
    </ProjectProviderInner>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error(
      'useProject() must be called inside <ProjectProvider>. Check your Providers tree.'
    );
  }
  return ctx;
}
