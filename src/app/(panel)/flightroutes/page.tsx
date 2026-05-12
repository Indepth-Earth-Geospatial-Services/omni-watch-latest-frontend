import Navbar from '@/feature/components/layout/Navbar';
import FlightRoutesPage from '@/feature/page/FlightRoutesPage';

export default function FeaturePage() {
  return (
    <div className='min-h-screen bg-black'>
      <Navbar />
      <FlightRoutesPage />
    </div>
  );
}
