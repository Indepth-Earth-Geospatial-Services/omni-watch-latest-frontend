'use client';
import { MainLayout } from '@/components/layout/main-layout';
import GeoMap from '@/components/features/geospaital-map/geo-map';
import { MapStatusHeader } from '@/components/features/geospaital-map/MapStatusHeader';

export default function GeospatialPage() {
  return (
    <MainLayout
      title='Geospatial Intelligence'
      subtitle='Interactive mission planning and tactical mapping'
    >
      <MapStatusHeader />

      <div className='relative bg-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl'>
        <GeoMap />
      </div>
    </MainLayout>
  );
}
