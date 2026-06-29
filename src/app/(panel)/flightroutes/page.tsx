import Navbar from '@/feature-unbording/components/layout/Navbar';
import FlightRoutesPage from '@/feature-unbording/page/FlightRoutesPage';

export default function FeaturePage() {
  return (
    <div className='min-h-screen bg-black'>
      <Navbar />
      <FlightRoutesPage />
    </div>
  );
}
