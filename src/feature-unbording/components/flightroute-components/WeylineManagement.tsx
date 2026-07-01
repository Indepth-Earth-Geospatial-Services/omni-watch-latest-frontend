'use client';

import React, { useState } from 'react';
import WeylineTabs from './WeylineTabs';
import WeylineTable from './WeylineTable';
import type { WaylineTabType } from './WeylineTable';
import { useWaylines, useDeleteWayline, useDownloadWayline } from '@/hooks/useWaylines';
import type { Wayline } from '@/lib/types';
import { toast } from 'sonner';

const WeylineManagement = () => {
  const [activeTab, setActiveTab] = useState<WaylineTabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: waylines = [], isLoading } = useWaylines();
  const deleteWayline = useDeleteWayline();
  const downloadWayline = useDownloadWayline();

  const handleDelete = async (wayline: Wayline) => {
    try {
      await deleteWayline.mutateAsync(wayline.id);
      toast.success(`Deleted "${wayline.name}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to delete: ${message}`);
    }
  };

  const handleDownload = (wayline: Wayline) => {
    downloadWayline.mutate({ waylineId: wayline.id, fileName: wayline.name });
  };

  return (
    <div className='flex flex-col gap-4 w-full'>
      <WeylineTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={setSearchQuery}
      />
      <WeylineTable
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        waylines={waylines}
        isLoading={isLoading}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default WeylineManagement;
