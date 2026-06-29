'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Image, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import { MediaTable } from './MediaTable';
import { useMediaFiles } from '@/hooks/useMedia';
import { useProject } from '@/providers/ProjectProvider';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import type { MediaFile } from '@/lib/types/media';

export default function MediaPage() {
  const { activeProject } = useProject();
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [droneFilter, setDroneFilter] = useState('');
  const pageSize = 20;

  const workspaceId = user?.workspace_id || DJI_CONFIG.WORKSPACE_ID;
  const { data, isLoading } = useMediaFiles(workspaceId, { page: 1, page_size: 500 });

  // Collect unique drone values for filter dropdown
  const uniqueDrones = useMemo(() => {
    if (!data) return [];
    const drones = new Set(data.list.map((f: MediaFile) => f.drone).filter(Boolean));
    return Array.from(drones).sort();
  }, [data]);

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (!data) return undefined;

    let filtered = data.list;

    // Date filter — create_time is "YYYY-MM-DD HH:mm:ss"
    if (dateFrom) {
      filtered = filtered.filter((f: MediaFile) => f.create_time >= dateFrom);
    }
    if (dateTo) {
      // Add end-of-day to include files created on the "to" date
      filtered = filtered.filter((f: MediaFile) => f.create_time <= dateTo + ' 23:59:59');
    }

    // Drone filter
    if (droneFilter) {
      filtered = filtered.filter((f: MediaFile) => f.drone === droneFilter);
    }

    return {
      ...data,
      list: filtered,
      pagination: {
        ...data.pagination,
        total: filtered.length,
      },
    };
  }, [data, dateFrom, dateTo, droneFilter]);

  // Paginate filtered results
  const paginatedData = useMemo(() => {
    if (!filteredData) return undefined;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      ...filteredData,
      list: filteredData.list.slice(start, end),
    };
  }, [filteredData, page]);

  if (!activeProject) {
    return (
      <EmptyPage
        icon={<Image aria-hidden className='w-6 h-6 text-zinc-400' />}
        title='No Project Selected'
        body='Please select a project from the sidebar to access Media Files.'
        action={{
          label: 'Go to Projects',
          onClick: () => router.push('/projects'),
        }}
      />
    );
  }

  const totalPages = filteredData
    ? Math.ceil(filteredData.list.length / pageSize)
    : 1;

  return (
    <MainLayout title='Media Files' subtitle='Review and download drone-captured media'>
      <div className='font-ui space-y-4'>
        {/* Filter bar */}
        <div className='flex items-center gap-3 flex-wrap'>
          <div className='flex items-center gap-2'>
            <Calendar size={12} className='text-zinc-500' />
            <span className='text-[10px] font-medium text-zinc-500 uppercase'>From</span>
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className='text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-600'
            />
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-[10px] font-medium text-zinc-500 uppercase'>To</span>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className='text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-600'
            />
          </div>
          {uniqueDrones.length > 0 && (
            <div className='flex items-center gap-2'>
              <span className='text-[10px] font-medium text-zinc-500 uppercase'>Drone</span>
              <select
                value={droneFilter}
                onChange={(e) => { setDroneFilter(e.target.value); setPage(1); }}
                className='text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-600'
              >
                <option value=''>All Drones</option>
                {uniqueDrones.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          {(dateFrom || dateTo || droneFilter) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setDroneFilter('');
                setPage(1);
              }}
              className='text-[10px] font-ui text-zinc-500 hover:text-zinc-300 transition-colors'
            >
              Clear filters
            </button>
          )}
        </div>

        <MediaTable data={paginatedData} isLoading={isLoading} workspaceId={workspaceId} />

        {/* Pagination controls */}
        {filteredData && filteredData.pagination.total > pageSize && (
          <div className='flex items-center justify-between'>
            <span className='text-xs text-zinc-500'>
              Page {page} of {totalPages}
            </span>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <ChevronLeft size={12} />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Next
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
