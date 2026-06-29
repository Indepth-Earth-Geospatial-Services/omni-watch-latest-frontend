'use client';

import { lazy, Suspense, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import ProjectHeader from '../components/project-components/ProjectKpi';
import ProjectTabs, { ProjectTabType } from '../components/project-components/ProjectTabs';
import ProjectTable from '../components/project-components/ProjectTable';
import type { Project } from '@/lib/types';

const CreateProjectModal = lazy(() => import('../components/project-components/CreateProjectModal'));
const EditProjectModal   = lazy(() => import('../components/project-components/EditProjectModal'));

export default function Project() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col gap-4 font-ui p-6'>
      <ProjectHeader onNewProject={() => setShowCreateModal(true)} />

      {/* Search bar */}
      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Search size={12} className='text-zinc-500' />
          </div>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search projects...'
            className='w-full text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-zinc-600'
          />
        </div>
      </div>

      {/* Tabs */}
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Table */}
      <ProjectTable
        activeTab={activeTab}
        searchQuery={searchQuery}
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
