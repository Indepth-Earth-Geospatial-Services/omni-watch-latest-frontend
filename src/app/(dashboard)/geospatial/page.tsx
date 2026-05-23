'use client';
import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import GeoMap from '@/components/features/geospaital-map/geo-map';
import { MapStatusHeader } from '@/components/features/geospaital-map/MapStatusHeader';
import { Loader2 } from 'lucide-react';

export default function GeospatialPage() {
  return (
    <MainLayout
      title='Geospatial Intelligence'
      subtitle='Interactive mission planning and tactical mapping'
    >
      <MapStatusHeader />

      <div className='relative bg-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl'>
        <Suspense
          fallback={
            <div className='flex flex-col items-center justify-center min-h-[67dvh] bg-neutral-950 text-gray-400 gap-3'>
              <Loader2 className='w-10 h-10 animate-spin text-blue-500' />
              <p className='text-sm animate-pulse'>Initializing Tactical Map…</p>
            </div>
          }
        >
          <GeoMap />
        </Suspense>
      </div>
    </MainLayout>
  );
}
