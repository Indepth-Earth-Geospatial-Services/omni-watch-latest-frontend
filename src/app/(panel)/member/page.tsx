// import MemberHeader from '@/feature/components/layout/MemberHeader';
import Navbar from '@/feature-unbording/components/layout/Navbar';
import Member from '@/feature-unbording/page/Member';

export default function FeaturePage() {
  return (
    <div className='min-h-screen bg-black'>
      <Navbar />
      <Member />
    </div>
  );
}
