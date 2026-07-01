import Navbar from '@/feature-unbording/components/layout/Navbar';
import ProjectPage from '@/feature-unbording/page/projectPage';

export default function projects() {
  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <ProjectPage />
    </div>
  );
}
