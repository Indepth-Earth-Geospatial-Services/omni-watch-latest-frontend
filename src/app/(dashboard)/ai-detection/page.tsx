'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import React from 'react';
import { Brain, AlertTriangle, RefreshCw, LayoutGrid, LayoutList } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { useProject } from '@/providers/ProjectProvider';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { useStreamKeys } from '@/hooks/useStreamKeys';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import { useRouter } from 'next/navigation';
import { useAIDetections } from '@/hooks/useAIDetections';
import { DetectionStatsBar } from '@/components/features/ai-detection/DetectionStatsBar';
import { DetectionToolbar } from '@/components/features/ai-detection/DetectionToolbar';
import { StreamSelector } from '@/components/features/ai-detection/StreamSelector';
import { DetectionPanel } from '@/components/features/ai-detection/DetectionPanel';
import { VideoGrid } from '@/components/features/ai-detection/VideoGrid';
import { DetectionMap } from '@/components/features/ai-detection/DetectionMap';
import { DetectionCard } from '@/components/features/ai-detection/DetectionCard';
import { DetectionDetailModal } from '@/components/features/ai-detection/DetectionDetailModal';
import { AlertBanner } from '@/components/features/ai-detection/AlertBanner';
import type { ThreatDetection } from '@/lib/types/threats';

interface MapErrorBoundaryState {
  error: Error | null;
}

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MapErrorBoundary] render error:', error.message, '\nComponent stack:', info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className='flex flex-col items-center justify-center gap-3 bg-red-950/20 border border-red-800/40 rounded-lg p-6 min-h-[100px] text-center'>
        <AlertTriangle size={16} className='text-red-400 flex-shrink-0' />
        <div className='space-y-0.5'>
          <p className='text-[11px] font-bold text-red-400 uppercase tracking-widest'>
            Map failed to load
          </p>
          <p className='text-[10px] font-mono text-red-300/70 max-w-[320px] break-words'>
            {error.message}
          </p>
        </div>
        <button
          onClick={this.reset}
          className='flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-400 border border-red-700/50 rounded hover:bg-red-900/30 transition-colors'
        >
          <RefreshCw size={10} />
          Retry
        </button>
      </div>
    );
  }
}

const STREAM_SELECTION_KEY = 'ai-detection-selected-streams';

export default function AIDetectionPage() {
  const { activeProject } = useProject();
  const router = useRouter();
  const { detections, status, alerts, soundEnabled, toggleSound, clearAlert } =
    useAIDetections();
  const { data: djiDevices = [] } = useDJIDevices({ refetchInterval: 5_000 });
  const { data: streams = [], refetch: refetchStreamKeys, isFetching: isRefreshingStreams } =
    useStreamKeys();

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedDetection, setSelectedDetection] = useState<ThreatDetection | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<'panel' | 'grid'>('panel');
  const [selectedStreamIds, setSelectedStreamIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = sessionStorage.getItem(STREAM_SELECTION_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const projectSnSet = useMemo(
    () => new Set(activeProject?.devices.map((d) => d.device.device_sn) ?? []),
    [activeProject]
  );

  const projectDevices = useMemo(
    () => djiDevices.filter((d) => projectSnSet.has(d.deviceSn)),
    [djiDevices, projectSnSet]
  );

  const streamOptions = useMemo(
    () => Array.from(selectedStreamIds).sort(),
    [selectedStreamIds]
  );

  const selectedDeviceSns = useMemo(() => {
    return new Set(
      streams
        .filter((s) => selectedStreamIds.has(s.streamKey))
        .map((s) => s.deviceSn)
    );
  }, [streams, selectedStreamIds]);

  useEffect(() => {
    try {
      if (selectedStreamIds.size > 0) {
        sessionStorage.setItem(STREAM_SELECTION_KEY, JSON.stringify(Array.from(selectedStreamIds)));
      } else {
        sessionStorage.removeItem(STREAM_SELECTION_KEY);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [selectedStreamIds]);

  const filteredDetections = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return detections.filter((d) => {
      const matchesStream =
        selectedDeviceSns.size === 0 || selectedDeviceSns.has(d.streamId);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !d.isVerified) ||
        (statusFilter === 'verified' && d.isVerified);

      const matchesType = typeFilter === 'all' || d.type === typeFilter;

      const matchesSearch =
        searchTerm === '' ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTimeRange = true;
      if (timeRange === 'today') {
        matchesTimeRange = d.detectedAt >= todayStart;
      } else if (timeRange === '1h') {
        matchesTimeRange = d.detectedAt >= new Date(now - 3600000);
      } else if (timeRange === '24h') {
        matchesTimeRange = d.detectedAt >= new Date(now - 86400000);
      }

      return matchesStream && matchesStatus && matchesType && matchesSearch && matchesTimeRange;
    });
  }, [detections, selectedDeviceSns, statusFilter, typeFilter, searchTerm, timeRange]);

  // Video overlays use only stream filter (no search/time filtering)
  const videoDetections = useMemo(() => {
    return detections.filter((d) => {
      return selectedDeviceSns.size === 0 || selectedDeviceSns.has(d.streamId);
    });
  }, [detections, selectedDeviceSns]);

  const filteredStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      total: filteredDetections.length,
      yolo: filteredDetections.filter((d) => !d.isVerified).length,
      verified: filteredDetections.filter((d) => d.isVerified).length,
      highConfidence: filteredDetections.filter((d) => d.confidence >= 0.8).length,
      today: filteredDetections.filter((d) => d.detectedAt >= todayStart).length,
    };
  }, [filteredDetections]);

  const yoloDetections = useMemo(
    () => filteredDetections.filter((d) => !d.isVerified),
    [filteredDetections]
  );

  const verifiedDetections = useMemo(
    () => filteredDetections.filter((d) => d.isVerified),
    [filteredDetections]
  );

  const handleViewAlertDetection = useCallback(
    (detectionId: string) => {
      const det = detections.find((d) => d.id === detectionId);
      if (det) setSelectedDetection(det);
    },
    [detections]
  );

  if (!activeProject) {
    return (
      <EmptyPage
        icon={<Brain className='w-6 h-6 text-zinc-400' />}
        title='No Project Selected'
        body='Please select a project from the sidebar to access AI Detection features.'
        action={{
          label: 'Go to Projects',
          onClick: () => router.push('/projects'),
        }}
      />
    );
  }

  return (
    <MainLayout
      title='AI & Object Detection'
      subtitle='Intelligent threat detection and object recognition'
    >
      <div className='-my-6 -mr-6'>
        <div className='flex flex-col h-[calc(100vh-10rem)] font-poppins'>
          {/* Alert Banner */}
          <AlertBanner
            alerts={alerts}
            onDismiss={clearAlert}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onViewDetection={handleViewAlertDetection}
          />

          {/* Toolbar */}
          <div className='px-4 pt-4 flex-shrink-0'>
            <div className='flex items-center justify-between gap-3'>
              <DetectionToolbar
                connectionStatus={status}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                showMap={showMap}
                onToggleMap={() => setShowMap(!showMap)}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              />
              <StreamSelector
                selectedIds={selectedStreamIds}
                onSelectionChange={setSelectedStreamIds}
                streams={streams}
                onRefresh={() => refetchStreamKeys()}
                isRefreshing={isRefreshingStreams}
              />
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setViewMode('panel')}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-poppins font-semibold transition-colors ${
                    viewMode === 'panel'
                      ? 'bg-[#1C93FF]/15 text-[#1C93FF] border border-[#1C93FF]/30'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <LayoutList size={11} />
                  <span className='hidden sm:inline'>Panel</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-poppins font-semibold transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#1C93FF]/15 text-[#1C93FF] border border-[#1C93FF]/30'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <LayoutGrid size={11} />
                  <span className='hidden sm:inline'>Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className='px-4 pt-3 flex-shrink-0'>
            <DetectionStatsBar
              total={filteredStats.total}
              yoloAlerts={filteredStats.yolo}
              verified={filteredStats.verified}
              highConfidence={filteredStats.highConfidence}
              today={filteredStats.today}
              isConnected={status === 'connected'}
            />
          </div>

          {/* Map overlay (slide-over) */}
          {showMap && (
            <div className='px-4 pt-3 flex-shrink-0'>
              <MapErrorBoundary>
                <DetectionMap
                  detections={filteredDetections}
                  onSelectDetection={setSelectedDetection}
                />
              </MapErrorBoundary>
            </div>
          )}

          {/* Content Area */}
          {viewMode === 'grid' ? (
            <div className='flex-1 min-h-0 overflow-y-auto p-4 pt-3'>
              {filteredDetections.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <AlertTriangle size={16} className='text-zinc-600' />
                  <p className='text-xs font-poppins text-zinc-600 mt-2'>
                    {status === 'connecting'
                      ? 'Connecting to AI server...'
                      : 'No detections match filters'}
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                  {filteredDetections.map((d) => (
                    <DetectionCard
                      key={d.id}
                      detection={d}
                      onSelect={setSelectedDetection}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 3-Column Layout */
            <div className='flex gap-4 flex-1 min-h-0 p-4 pt-3'>
              {/* Left: YOLO Detections */}
              <DetectionPanel
                title='YOLO Detections'
                accentColor='orange'
                detections={yoloDetections}
                onSelectDetection={setSelectedDetection}
                emptyMessage={
                  status === 'connecting'
                    ? 'Connecting to AI server...'
                    : 'Waiting for YOLO detections...'
                }
              />

              {/* Center: Video Grid */}
              <VideoGrid
                selectedStreamKeys={selectedStreamIds}
                streams={streams}
                devices={djiDevices}
                detections={videoDetections}
              />

              {/* Right: Verified Threats */}
              <DetectionPanel
                title='Verified Threats'
                accentColor='red'
                detections={verifiedDetections}
                onSelectDetection={setSelectedDetection}
                emptyMessage={
                  status === 'connecting'
                    ? 'Connecting to AI server...'
                    : 'Waiting for LLM verification...'
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <DetectionDetailModal
        detection={selectedDetection}
        onClose={() => setSelectedDetection(null)}
      />
    </MainLayout>
  );
}
