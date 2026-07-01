'use client';

import { lazy, Suspense, useMemo, useState } from 'react';
import ProjectHeader from '../components/project-components/ProjectKpi';
import ProjectTabs, { ProjectTabType } from '../components/project-components/ProjectTabs';
import ProjectTable from '../components/project-components/ProjectTable';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/lib/types';

const CreateProjectModal = lazy(() => import('../components/project-components/CreateProjectModal'));
const EditProjectModal   = lazy(() => import('../components/project-components/EditProjectModal'));

export default function Project() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data } = useProjects();
  const allProjects = data?.list ?? [];

  const counts = useMemo(() => ({
    All: allProjects.length,
    Active: allProjects.filter((p) => p.devices.length > 0).length,
    Archived: allProjects.filter((p) => p.devices.length === 0 && p.flight_areas.length === 0).length,
  }), [allProjects]);

  return (
    <div className='flex flex-col gap-3 font-ui p-6'>
      {/* Header: title + New Project button */}
      <ProjectHeader onNewProject={() => setShowCreateModal(true)} />

      {/* Tabs */}
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {/* Table (includes search + filters inside) */}
      <ProjectTable
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEditProject={(p) => setEditingProject(p)}
      />

      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateProjectModal open={true} onClose={() => setShowCreateModal(false)} />
        </Suspense>
      )}

      {editingProject && (
        <Suspense fallback={null}>
          <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />
        </Suspense>
      )}
    </div>
  );
}
