'use client';

import ProjectHeader from '../components/project-components/ProjectKpi';
import ProjectManagement from '../components/project-components/ProjectManagement';

export default function Project() {
  return (
    <>
      <div className='mt-6 font-poppins'>
        <ProjectHeader />
      </div>
      <main className='p-4 font-poppins'>
        <div className='flex items-center w-[calc(100%-2rem)] mx-4 mb-2'>
          <h2 className='text-3xl font-bold text-[#E2E2E8]'>Projects</h2>
        </div>
        <ProjectManagement />
      </main>
    </>
  );
}
