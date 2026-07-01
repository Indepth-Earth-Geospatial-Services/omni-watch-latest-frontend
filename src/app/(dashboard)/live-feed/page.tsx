'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaneTakeoff } from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { useProject } from '@/providers/ProjectProvider';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { useActiveStreams } from '@/hooks/useLiveStreams';
import { useDeviceConfigs, useUpdateDeviceConfig, useStartAI, useStopAI } from '@/hooks/useDeviceConfig';
import { WebRTCPlayer } from '@/components/features/streams/WebRTCPlayer';
import { DeviceSidebar } from '@/components/features/streams/DeviceSidebar';
import { FeedToolbar } from '@/components/features/streams/FeedToolbar';
import { SingleFeedView } from '@/components/features/streams/SingleFeedView';
import { MultiFeedView } from '@/components/features/streams/MultiFeedView';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import type { StreamState } from '@/components/features/streams/WebRTCPlayer';

export default function LiveFeedPage() {
  const router = useRouter();
  const { activeProject } = useProject();
  const { data: djiDevices = [], isLoading: devicesLoading } = useDJIDevices({
    refetchInterval: 5_000,
  });
  const { data: deviceConfigs = [] } = useDeviceConfigs();
  const { mutate: updateDeviceConfig } = useUpdateDeviceConfig();
  const { mutate: startAI, isPending: startingAI } = useStartAI();
  const { mutate: stopAI, isPending: stoppingAI } = useStopAI();

  const aiPending = startingAI || stoppingAI;

  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [selectedSn, setSelectedSn] = useState<string | null>(null);

  const [streamingDevices, setStreamingDevices] = useState<Map<string, string>>(new Map());
  const [mediaStreams, setMediaStreams] = useState<Map<string, MediaStream | null>>(new Map());
  const [streamStates, setStreamStates] = useState<
    Map<string, { state: StreamState; errorMsg?: string }>
  >(new Map());
  const [stopSignals, setStopSignals] = useState<Map<string, number>>(new Map());

  const projectSnSet = useMemo(
    () => new Set(activeProject?.devices.map((d) => d.device.device_sn) ?? []),
    [activeProject]
  );

  const projectDevices = useMemo(
    () => djiDevices.filter((d) => projectSnSet.has(d.deviceSn)),
    [djiDevices, projectSnSet]
  );

  // Auto-connect active streams on load — fetch workspace-active streams and
  // populate streamingDevices for any project device that is already live.
  const { data: activeStreams = [] } = useActiveStreams();
  useEffect(() => {
    if (activeStreams.length === 0 || projectSnSet.size === 0) return;
    setStreamingDevices((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const { sn, url } of activeStreams) {
        if (projectSnSet.has(sn) && !next.has(sn)) {
          next.set(sn, url);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeStreams, projectSnSet]);

  const selectedDevice =
    projectDevices.find((d) => d.deviceSn === selectedSn) ?? projectDevices[0] ?? null;

  const handleSelectDevice = useCallback((sn: string, switchToSingle = false) => {
    setSelectedSn(sn);
    if (switchToSingle) setViewMode('single');
  }, []);

  const handleStreamingChange = useCallback((sn: string, isStreaming: boolean, url?: string) => {
    setStreamingDevices((prev) => {
      const next = new Map(prev);
      if (isStreaming && url) next.set(sn, url);
      else next.delete(sn);
      return next;
    });
    if (!isStreaming) {
      setMediaStreams((prev) => {
        const n = new Map(prev);
        n.delete(sn);
        return n;
      });
      setStreamStates((prev) => {
        const n = new Map(prev);
        n.delete(sn);
        return n;
      });
    }
  }, []);

  const handleMediaStream = useCallback((sn: string, stream: MediaStream | null) => {
    setMediaStreams((prev) => new Map(prev).set(sn, stream));
  }, []);

  const handleStreamState = useCallback((sn: string, state: StreamState, errorMsg?: string) => {
    setStreamStates((prev) => new Map(prev).set(sn, { state, errorMsg }));
  }, []);

  const stopDevice = useCallback(
    (sn: string) => setStopSignals((prev) => new Map(prev).set(sn, (prev.get(sn) ?? 0) + 1)),
    []
  );

  const handleAIToggle = useCallback(
    (sn: string, enabled: boolean) => {
      const config = deviceConfigs.find((c) => c.device_sn === sn);
      let parsedClasses: string[] = [];
      if (config) {
        try {
          const parsed = JSON.parse(config.targetClasses.replace(/'/g, '"'));
          if (Array.isArray(parsed)) parsedClasses = parsed;
        } catch {
          // keep empty
        }
      }
      updateDeviceConfig({
        deviceSn: sn,
        targetClasses: JSON.stringify(parsedClasses).replace(/"/g, "'"),
        ai_enabled: enabled,
      });

      const streamUrl = streamingDevices.get(sn);
      if (streamUrl) {
        if (enabled) {
          startAI({ streamId: streamUrl });
        } else {
          stopAI({ streamId: streamUrl });
        }
      }
    },
    [deviceConfigs, updateDeviceConfig, streamingDevices, startAI, stopAI]
  );

  const stopAll = useCallback(() => {
    setStopSignals((prev) => {
      const next = new Map(prev);
      streamingDevices.forEach((_, sn) => next.set(sn, (next.get(sn) ?? 0) + 1));
      return next;
    });
  }, [streamingDevices]);

  if (!activeProject) {
    return (
      <div className='bg-background text-foreground min-h-screen'>
        <MainLayout title='Live Feeds' subtitle=''>
          <EmptyPage
            icon={<PlaneTakeoff className='w-8 h-8 text-muted-foreground' />}
            title='No project open'
            body='Open a project from the Projects page to begin monitoring.'
            action={{ label: 'Go to Projects', onClick: () => router.push('/projects') }}
          />
        </MainLayout>
      </div>
    );
  }

  if (activeProject.devices.length === 0) {
    return (
      <div className='bg-background text-foreground min-h-screen'>
        <MainLayout title='Live Feeds' subtitle={activeProject.name}>
          <EmptyPage
            icon={<PlaneTakeoff className='w-8 h-8 text-muted-foreground' />}
            title='No devices assigned'
            body={
              <>
                Assign at least one device to{' '}
                <span className='text-muted-foreground font-semibold'>{activeProject.name}</span> to start
                monitoring live feeds.
              </>
            }
            action={{ label: 'Assign Devices', onClick: () => router.push('/projects') }}
          />
        </MainLayout>
      </div>
    );
  }

  return (
    <div className='bg-background text-foreground min-h-screen'>
      <div className='sr-only' aria-hidden>
        {Array.from(streamingDevices.entries()).map(([sn, url]) => (
          <WebRTCPlayer
            key={sn}
            url={url}
            onMediaStream={(stream) => handleMediaStream(sn, stream)}
            onStateChange={(state, errorMsg) => handleStreamState(sn, state, errorMsg)}
          />
        ))}
      </div>

      <MainLayout title='Live Feeds' subtitle={activeProject.name}>
        <div className='flex gap-4 h-[calc(100vh-10rem)] font-ui'>
          {/* Sidebar — desktop only */}
          <div className='hidden lg:flex h-full'>
            <DeviceSidebar
              projectDevices={projectDevices}
              unboundDevices={activeProject.devices}
              selectedSn={selectedSn}
              viewMode={viewMode}
              streamingDevices={streamingDevices}
              onSelect={(sn) => handleSelectDevice(sn, true)}
              onStop={stopDevice}
              isLoading={devicesLoading}
              isOpen={true}
              onClose={() => {}}
              deviceConfigs={deviceConfigs}
              onAIToggle={handleAIToggle}
              aiPending={aiPending}
            />
          </div>

          <div className='flex-1 flex flex-col bg-background border border-border rounded-xl overflow-hidden min-w-0'>
            <FeedToolbar
              viewMode={viewMode}
              selectedDevice={selectedDevice}
              streamingDevices={streamingDevices}
              onViewModeChange={setViewMode}
              onStop={stopDevice}
              onStopAll={stopAll}
            />

            <div
              className={`flex-1 min-h-0 ${
                viewMode === 'multi' ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'
              }`}
            >
              {viewMode === 'single' ? (
                selectedDevice ? (
                  <SingleFeedView
                    device={selectedDevice}
                    allDevices={projectDevices}
                    onSwitch={(sn) => handleSelectDevice(sn)}
                    stopSignal={stopSignals.get(selectedDevice.deviceSn) ?? 0}
                    onStreamingChange={(s, url) =>
                      handleStreamingChange(selectedDevice.deviceSn, s, url)
                    }
                    activeStreamUrl={streamingDevices.get(selectedDevice.deviceSn) ?? null}
                    mediaStream={mediaStreams.get(selectedDevice.deviceSn) ?? null}
                    streamState={streamStates.get(selectedDevice.deviceSn) ?? null}
                    onRetry={() => stopDevice(selectedDevice.deviceSn)}
                  />
                ) : (
                  <div className='flex flex-col items-center justify-center h-full gap-3 text-center'>
                    <PlaneTakeoff className='w-8 h-8 text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>Select a device from the panel.</p>
                  </div>
                )
              ) : (
                <MultiFeedView
                  devices={projectDevices}
                  onExpand={(sn) => handleSelectDevice(sn, true)}
                  stopSignals={stopSignals}
                  onStreamingChange={handleStreamingChange}
                  streamingDevices={streamingDevices}
                  mediaStreams={mediaStreams}
                  streamStates={streamStates}
                  onRetryDevice={stopDevice}
                />
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
