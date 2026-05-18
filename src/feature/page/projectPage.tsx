'use client';

import { useState } from 'react';
import ProjectHeader from '../components/project-components/ProjectKpi';
import ProjectManagement from '../components/project-components/ProjectManagement';
import CreateProjectModal from '../components/project-components/CreateProjectModal';
import EditProjectModal from '../components/project-components/EditProjectModal';
import type { Project } from '@/lib/types';

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
          <h2 className='text-3xl font-bold text-[#E2E2E8]'>Projects</h2>
        </div>
        <ProjectManagement onEditProject={(p) => setEditingProject(p)} />
      </main>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />
    </>
  );
}
