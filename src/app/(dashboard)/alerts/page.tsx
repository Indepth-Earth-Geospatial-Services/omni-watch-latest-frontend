'use client';

import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from 'react';
import { Bell, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { useProject } from '@/providers/ProjectProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useAIDetections } from '@/hooks/useAIDetections';
import { useDetections } from '@/hooks/useDetections';
import { useApproveDetection, useDismissDetection } from '@/hooks/useDetectionActions';
import { AlertsHeader } from '@/components/features/alerts/AlertsHeader';
import { AlertListItem } from '@/components/features/alerts/AlertListItem';
import { AlertDetailModal } from '@/components/features/alerts/AlertDetailModal';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import type { ThreatDetection } from '@/lib/types/threats';

export default function AlertsPage() {
  const { activeProject } = useProject();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedDetection, setSelectedDetection] = useState<ThreatDetection | null>(null);
  const [, startTransition] = useTransition();

  // History fetch — only enabled when authenticated
  const {
    detections: historyDetections,
    isLoading: isLoadingHistory,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useDetections({
    filters: {
      class: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    },
    enabled: isAuthenticated && !authLoading,
  });

  // WebSocket live data
  const {
    detections: liveDetections,
    status,
    alerts,
    soundEnabled,
    dispatch,
    toggleSound,
    clearAlert,
  } = useAIDetections();

  // Approve/dismiss mutations
  const allDetections = useMemo(() => {
    // Merge history + live, deduplicate by ID, live overwrites history
    const map = new Map<string, ThreatDetection>();
    for (const d of historyDetections) {
      map.set(d.id, d);
    }
    for (const d of liveDetections) {
      map.set(d.id, d);
    }
    return Array.from(map.values()).sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }, [historyDetections, liveDetections]);

  const { approveDetection, isPending: isApproving } = useApproveDetection({
    detections: allDetections,
    dispatch,
  });
  const { dismissDetection, isPending: isDismissing } = useDismissDetection({
    detections: allDetections,
    dispatch,
  });

  // Filter detections
  const filteredDetections = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return allDetections.filter((d) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !d.isVerified && d.status !== 'approved' && d.status !== 'dismissed') ||
        (statusFilter === 'verified' && d.isVerified && d.status !== 'approved' && d.status !== 'dismissed') ||
        (statusFilter === 'approved' && d.status === 'approved') ||
        (statusFilter === 'dismissed' && d.status === 'dismissed');

      const matchesType = typeFilter === 'all' || d.type === typeFilter;

      const matchesSearch =
        searchTerm === '' ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.streamId.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTimeRange = true;
      if (timeRange === 'today') {
        matchesTimeRange = d.detectedAt >= todayStart;
      } else if (timeRange === '1h') {
        matchesTimeRange = d.detectedAt >= new Date(now - 3600000);
      } else if (timeRange === '24h') {
        matchesTimeRange = d.detectedAt >= new Date(now - 86400000);
      }

      return matchesStatus && matchesType && matchesSearch && matchesTimeRange;
    });
  }, [allDetections, statusFilter, typeFilter, searchTerm, timeRange]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      total: filteredDetections.length,
      pending: filteredDetections.filter((d) => !d.isVerified && d.status !== 'approved' && d.status !== 'dismissed').length,
      verified: filteredDetections.filter((d) => d.isVerified && d.status !== 'approved' && d.status !== 'dismissed').length,
      highConfidence: filteredDetections.filter((d) => d.confidence >= 0.8).length,
      today: filteredDetections.filter((d) => d.detectedAt >= todayStart).length,
    };
  }, [filteredDetections]);

  // Infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Approve/dismiss handlers
  const handleApprove = useCallback(
    (detection: ThreatDetection) => {
      approveDetection(detection);
      setSelectedDetection(null);
    },
    [approveDetection]
  );

  const handleDismiss = useCallback(
    (detection: ThreatDetection) => {
      dismissDetection(detection);
      setSelectedDetection(null);
    },
    [dismissDetection]
  );

  if (!activeProject) {
    return (
      <EmptyPage
        icon={<Bell className='w-6 h-6 text-muted-foreground' />}
        title='No Project Selected'
        body='Please select a project from the sidebar to access Alerts.'
        action={{
          label: 'Go to Projects',
          onClick: () => router.push('/projects'),
        }}
      />
    );
  }

  return (
    <MainLayout title='Alerts' subtitle='Review and manage AI detection alerts'>
      <div className='-my-6 -mr-6'>
        <div className='flex flex-col h-[calc(100vh-10rem)] font-ui'>
          {/* Header */}
          <div className='px-4 pt-4 flex-shrink-0'>
            <AlertsHeader
              connectionStatus={status}
              statusFilter={statusFilter}
              onStatusChange={(value) => startTransition(() => setStatusFilter(value))}
              typeFilter={typeFilter}
              onTypeChange={(value) => startTransition(() => setTypeFilter(value))}
              searchTerm={searchTerm}
              onSearchChange={(value) => startTransition(() => setSearchTerm(value))}
              timeRange={timeRange}
              onTimeRangeChange={(value) => startTransition(() => setTimeRange(value))}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              stats={stats}
            />
          </div>

          {/* Alert list */}
          <div ref={listRef} className='flex-1 min-h-0 overflow-y-auto px-4 pt-3'>
            {isLoadingHistory && filteredDetections.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <Loader2 size={16} className='text-muted-foreground animate-spin' />
                <p className='text-xs font-ui text-muted-foreground mt-2'>Loading alerts...</p>
              </div>
            ) : filteredDetections.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                {status === 'connecting' || status === 'reconnecting' ? (
                  <>
                    <Loader2 size={16} className='text-muted-foreground animate-spin' />
                    <p className='text-xs font-ui text-muted-foreground mt-2'>
                      {status === 'connecting' ? 'Connecting to AI server...' : 'Reconnecting to AI server...'}
                    </p>
                  </>
                ) : status === 'error' ? (
                  <>
                    <AlertTriangle size={16} className='text-red-500/60' />
                    <p className='text-xs font-ui text-red-400/60 mt-2'>Connection failed</p>
                    <button
                      onClick={() => window.location.reload()}
                      className='mt-2 flex items-center gap-1 text-[10px] font-ui text-muted-foreground hover:text-muted-foreground transition-colors'
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className='text-muted-foreground' />
                    <p className='text-xs font-ui text-muted-foreground mt-2'>
                      {historyDetections.length === 0 && liveDetections.length === 0
                        ? 'No alerts yet — waiting for detections...'
                        : 'No alerts match filters'}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className='bg-background border border-border/50 rounded-xl overflow-hidden'>
                {filteredDetections.map((d) => (
                  <AlertListItem
                    key={d.id}
                    detection={d}
                    onSelect={setSelectedDetection}
                    onApprove={handleApprove}
                    onDismiss={handleDismiss}
                    isPending={isApproving || isDismissing}
                  />
                ))}

                {/* Infinite scroll loader */}
                {isFetchingNextPage && (
                  <div className='flex items-center justify-center py-4'>
                    <RefreshCw size={14} className='text-muted-foreground animate-spin' />
                    <span className='text-xs font-ui text-muted-foreground ml-2'>Loading more...</span>
                  </div>
                )}

                {!hasNextPage && filteredDetections.length > 0 && (
                  <div className='flex items-center justify-center py-3'>
                    <span className='text-[10px] font-ui text-muted-foreground'>No more alerts</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AlertDetailModal
        detection={selectedDetection}
        onClose={() => setSelectedDetection(null)}
        onApprove={handleApprove}
        onDismiss={handleDismiss}
        isPending={isApproving || isDismissing}
      />
    </MainLayout>
  );
}
