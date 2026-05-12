// import MemberHeader from '@/feature/components/layout/MemberHeader';
import Navbar from '@/feature/components/layout/Navbar';
import Member from '@/feature/page/Member';

export default function FeaturePage() {
  return (
    <div className='min-h-screen bg-black'>
      <Navbar />
      <Member />
    </div>
  );
}
