'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaneTakeoff } from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { useProject } from '@/providers/ProjectProvider';
import { useDJIDevices } from '@/hooks/useDJIDevices';
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
  // Poll every 5 s on this page so device online/offline status reflects quickly
  const { data: djiDevices = [], isLoading: devicesLoading } = useDJIDevices({ refetchInterval: 5_000 });

  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [selectedSn, setSelectedSn] = useState<string | null>(null);

  // SN → WHEP URL (present = actively streaming; drives the hidden WebRTCPlayer layer)
  const [streamingDevices, setStreamingDevices] = useState<Map<string, string>>(new Map());
  // SN → live MediaStream from WebRTCPlayer (shared to whichever view is visible)
  const [mediaStreams, setMediaStreams] = useState<Map<string, MediaStream | null>>(new Map());
  // SN → WebRTC connection state
  const [streamStates, setStreamStates] = useState<
    Map<string, { state: StreamState; errorMsg?: string }>
  >(new Map());
  // Increment to signal stop to a specific device's StreamControlPanel
  const [stopSignals, setStopSignals] = useState<Map<string, number>>(new Map());

  const projectSnSet = useMemo(
    () => new Set(activeProject?.devices.map((d) => d.device_sn) ?? []),
    [activeProject]
  );

  const projectDevices = useMemo(
    () => djiDevices.filter((d) => projectSnSet.has(d.deviceSn)),
    [djiDevices, projectSnSet]
  );

  const selectedDevice =
    projectDevices.find((d) => d.deviceSn === selectedSn) ?? projectDevices[0] ?? null;

  const handleSelectDevice = useCallback((sn: string, switchToSingle = false) => {
    setSelectedSn(sn);
    if (switchToSingle) setViewMode('single');
  }, []);

  // Called by StreamControlPanel when a stream starts (url = WHEP URL) or stops
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

  // Fired by the hidden WebRTCPlayer layer when a MediaStream track arrives or tears down
  const handleMediaStream = useCallback((sn: string, stream: MediaStream | null) => {
    setMediaStreams((prev) => new Map(prev).set(sn, stream));
  }, []);

  // Fired by the hidden WebRTCPlayer layer on connection state changes
  const handleStreamState = useCallback((sn: string, state: StreamState, errorMsg?: string) => {
    setStreamStates((prev) => new Map(prev).set(sn, { state, errorMsg }));
  }, []);

  const stopDevice = useCallback(
    (sn: string) =>
      setStopSignals((prev) => new Map(prev).set(sn, (prev.get(sn) ?? 0) + 1)),
    []
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
            icon={<PlaneTakeoff className='w-8 h-8 text-zinc-600' />}
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
            icon={<PlaneTakeoff className='w-8 h-8 text-zinc-600' />}
            title='No devices assigned'
            body={
              <>
                Assign at least one device to{' '}
                <span className='text-zinc-300 font-semibold'>{activeProject.name}</span> to start
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
      {/*
        Persistent hidden WebRTC layer — one connection per actively streaming device.
        Lives OUTSIDE the single/multi view switch so unmounting a view never
        closes the RTCPeerConnection. The resulting MediaStream is shared via props
        to whichever view component is currently rendered.
      */}
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
        <div className='flex gap-4 h-[calc(100vh-13rem)] font-poppins'>
          <DeviceSidebar
            projectDevices={projectDevices}
            unboundDevices={activeProject.devices}
            selectedSn={selectedSn}
            viewMode={viewMode}
            streamingDevices={streamingDevices}
            onSelect={(sn) => handleSelectDevice(sn, true)}
            onStop={stopDevice}
            isLoading={devicesLoading}
          />

          <div className='flex-1 flex flex-col bg-[#0C0D10] border border-zinc-800 rounded-xl overflow-hidden min-w-0'>
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
                    <PlaneTakeoff className='w-8 h-8 text-zinc-700' />
                    <p className='text-sm text-zinc-600'>Select a device from the panel.</p>
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
