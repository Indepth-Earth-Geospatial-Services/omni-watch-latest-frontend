'use client';

import React, { useState } from 'react';
import WeylineTabs from './WeylineTabs';
import WeylineTable from './WeylineTable';
import { WaylineTabType } from './WeylineTable';

const WeylineManagement = () => {
  const [activeTab, setActiveTab] = useState<WaylineTabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col gap-4 w-full'>
      <WeylineTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={setSearchQuery}
      />
      <WeylineTable activeTab={activeTab} searchQuery={searchQuery} />
    </div>
  );
};

export default WeylineManagement;
