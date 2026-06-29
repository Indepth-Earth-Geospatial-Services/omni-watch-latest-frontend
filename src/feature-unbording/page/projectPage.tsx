'use client';

import { lazy, Suspense, useState } from 'react';
import ProjectHeader from '../components/project-components/ProjectKpi';
import ProjectManagement from '../components/project-components/ProjectManagement';
import type { Project } from '@/lib/types';

// Lazy — chunks downloaded only when the user first opens each modal
const CreateProjectModal = lazy(() => import('../components/project-components/CreateProjectModal'));
const EditProjectModal   = lazy(() => import('../components/project-components/EditProjectModal'));

export default function Project() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  return (
    <>
      <div className='mt-6 font-poppins'>
        <ProjectHeader onNewProject={() => setShowCreateModal(true)} />
      </div>
      <main className='p-4 font-poppins'>
        <div className='flex items-center w-[calc(100%-2rem)] mx-4 mb-2'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#E2E2E8]'>Projects</h2>
        </div>
        <ProjectManagement onEditProject={(p) => setEditingProject(p)} />
      </main>

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
    </>
  );
}
