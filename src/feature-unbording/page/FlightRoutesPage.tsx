'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import WaylineTable from '../components/flightroute-components/WeylineTable';

export default function FlightRoutesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col gap-4 font-poppins my-10'>
      <PageHeader
        searchPlaceholder='Search routes...'
        onSearch={setSearchQuery}
        actionLabel='Upload Wayline'
        actionIcon={Upload}
        isFileUpload
        actionAccept='.kmz,.kml'
      />
      <WaylineTable activeTab='All' searchQuery={searchQuery} />
    </div>
  );
}
