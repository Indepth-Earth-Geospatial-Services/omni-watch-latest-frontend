import Navbar from '@/feature/components/layout/Navbar';
import ProjectPage from '@/feature/page/projectPage';

export default function projects() {
  return (
    <div className='min-h-screen bg-black'>
      <Navbar />
      <ProjectPage />
    </div>
  );
}
