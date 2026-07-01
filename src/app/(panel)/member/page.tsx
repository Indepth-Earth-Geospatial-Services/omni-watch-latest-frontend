import Navbar from '@/feature-unbording/components/layout/Navbar';
import MembersPage from '@/features/members/page';

export default function TeamPage() {
  return (
    <div className='min-h-screen bg-background'>
      <Navbar />
      <MembersPage />
    </div>
  );
}
