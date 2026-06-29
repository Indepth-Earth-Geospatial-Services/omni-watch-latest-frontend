'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, Upload } from 'lucide-react';
import WaylineTable from '../components/flightroute-components/WeylineTable';
import { useWaylines, useDeleteWayline, useDownloadWayline, useUploadWayline } from '@/hooks/useWaylines';
import type { Wayline } from '@/lib/types';
import { toast } from 'sonner';

export default function FlightRoutesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Favorited'>('All');

  const { data: waylines = [], isLoading } = useWaylines();
  const deleteWayline = useDeleteWayline();
  const downloadWayline = useDownloadWayline();
  const uploadWayline = useUploadWayline();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileName = (fileName: string): boolean => {
    const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
    const invalidPattern = /[<>:"/|?*._\\]/;
    if (invalidPattern.test(nameWithoutExtension)) {
      toast.error(`Invalid filename: "${fileName}". The name cannot contain underscores, dots, or special characters.`);
      return false;
    }
    return true;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.kmz')) {
      toast.error('Only .kmz files are supported.');
      e.target.value = '';
      return;
    }

    if (!validateFileName(file.name)) {
      e.target.value = '';
      return;
    }

    try {
      await uploadWayline.mutateAsync(file);
      toast.success(`"${file.name}" uploaded successfully`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Upload failed: ${message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleDelete = useCallback(
    async (wayline: Wayline) => {
      try {
        await deleteWayline.mutateAsync(wayline.id);
        toast.success(`Deleted "${wayline.name}"`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to delete: ${message}`);
      }
    },
    [deleteWayline]
  );

  const handleDownload = useCallback(
    (wayline: Wayline) => {
      downloadWayline.mutate({ waylineId: wayline.id, fileName: wayline.name });
    },
    [downloadWayline]
  );

  return (
    <div className='font-ui space-y-4 px-4 pt-8 pb-4'>
      {/* Filter bar */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative flex-1 max-w-sm'>
          <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Search size={12} className='text-zinc-500' />
          </div>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search routes...'
            className='w-full text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-zinc-600'
          />
        </div>

        <div className='flex items-center gap-1'>
          {(['All', 'Favorited'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-ui font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-theme-accent/15 text-theme-accent border border-theme-accent/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={handleUploadClick}
          disabled={uploadWayline.isPending}
          className='flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#1C93FF] rounded-lg hover:bg-[#1C93FF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Upload size={13} />
          {uploadWayline.isPending ? 'Uploading...' : 'Upload Wayline'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='.kmz'
        className='hidden'
        onChange={handleFileChange}
      />

      <WaylineTable
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
}
