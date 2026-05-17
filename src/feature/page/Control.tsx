'use client';

import React, { useState, useCallback } from 'react';
import TelemetryHeader from '@/feature/components/control-components/TelemetryHeader';
import FlightStatsBar from '@/feature/components/control-components/FlightStatsBar';
import MissionControlViewport from '@/feature/components/control-components/MissionControlViewport';
import TacticalMiniMap from '@/feature/components/control-components/TacticalMiniMap';
import DockMonitor from '@/feature/components/control-components/DockMonitor';
import SystemStatusFooter from '@/feature/components/control-components/SystemStatusFooter';
import {
  useLiveCapacity,
  useStartStream,
  useStopStream,
  useUpdateStreamQuality,
  useSwitchStreamCamera,
} from '@/hooks/useLiveStreams';

export default function ControlPage() {
  // ─── Livestream hooks ──────────────────────────────────────────────────────
  const { data: capacityMap, isLoading: capacityLoading } = useLiveCapacity();
  const { mutate: startStream, isPending: isStarting } = useStartStream();
  const { mutate: stopStream,  isPending: isStopping  } = useStopStream();
  const { mutate: updateQuality } = useUpdateStreamQuality();
  const { mutate: switchCamera  } = useSwitchStreamCamera();

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selectedSn,        setSelectedSn]        = useState('');
  const [selectedCameraId,  setSelectedCameraId]  = useState('');
  const [selectedVideoId,   setSelectedVideoId]   = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState('zoom');
  const [streamQuality,     setStreamQuality]     = useState('0');
  const [isStreaming,       setIsStreaming]        = useState(false);

  // ─── Derived selections ───────────────────────────────────────────────────
  const devices       = capacityMap ? Array.from(capacityMap.values()) : [];
  const selectedDevice = selectedSn ? capacityMap?.get(selectedSn) : undefined;
  const cameras       = selectedDevice?.camerasList ?? [];
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId);
  const videos        = selectedCamera?.videosList ?? [];
  const selectedVideo = videos.find((v) => v.id === selectedVideoId);
  const videoTypes    = selectedVideo?.switchVideoTypes ?? [];

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleDeviceChange = useCallback((sn: string) => {
    setSelectedSn(sn);
    setSelectedCameraId('');
    setSelectedVideoId('');
    setSelectedVideoType('zoom');
    setIsStreaming(false);
  }, []);

  const handleCameraChange = useCallback((cameraId: string) => {
    setSelectedCameraId(cameraId);
    setSelectedVideoId('');
    setSelectedVideoType('zoom');
    setIsStreaming(false);
  }, []);

  const handleVideoChange = useCallback(
    (videoId: string) => {
      setSelectedVideoId(videoId);
      const video = cameras
        .find((c) => c.id === selectedCameraId)
        ?.videosList.find((v) => v.id === videoId);
      const firstType = video?.switchVideoTypes[0];
      if (firstType) setSelectedVideoType(firstType);
      setIsStreaming(false);
    },
    [cameras, selectedCameraId]
  );

  const handleStart = useCallback(() => {
    if (!selectedVideoId) return;
    startStream(
      { video_id: selectedVideoId, url_type: '2', video_quality: streamQuality, videoType: selectedVideoType },
      { onSuccess: () => setIsStreaming(true) }
    );
  }, [selectedVideoId, streamQuality, selectedVideoType, startStream]);

  const handleStop = useCallback(() => {
    if (!selectedVideoId) return;
    stopStream(
      { video_id: selectedVideoId, url_type: '2', video_quality: streamQuality, videoType: selectedVideoType },
      { onSuccess: () => setIsStreaming(false) }
    );
  }, [selectedVideoId, streamQuality, selectedVideoType, stopStream]);

  const handleQualityChange = useCallback(
    (quality: string) => {
      setStreamQuality(quality);
      if (isStreaming && selectedVideoId) {
        updateQuality({ video_id: selectedVideoId, url_type: '2', video_quality: quality, videoType: selectedVideoType });
      }
    },
    [isStreaming, selectedVideoId, selectedVideoType, updateQuality]
  );

  const handleVideoTypeChange = useCallback(
    (videoType: string) => {
      setSelectedVideoType(videoType);
      if (isStreaming && selectedVideoId) {
        switchCamera({ video_id: selectedVideoId, url_type: '2', video_quality: streamQuality, videoType });
      }
    },
    [isStreaming, selectedVideoId, streamQuality, switchCamera]
  );

  return (
    <div className='bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30'>
      <main className='flex-1 flex flex-col items-center py-4 px-6 pb-[80px] overflow-y-auto overflow-x-hidden'>
        <div className='w-full space-y-4'>
          <section className='space-y-2'>
            <TelemetryHeader
              deviceName={selectedDevice?.name}
              cameraName={selectedCamera?.name}
              isStreaming={isStreaming}
            />
            <FlightStatsBar />
          </section>

          <div className='flex flex-row gap-4 justify-center'>
            <MissionControlViewport
              devices={devices}
              cameras={cameras}
              videos={videos}
              videoTypes={videoTypes}
              selectedSn={selectedSn}
              selectedCameraId={selectedCameraId}
              selectedVideoId={selectedVideoId}
              selectedVideoType={selectedVideoType}
              streamQuality={streamQuality}
              isStreaming={isStreaming}
              isStarting={isStarting}
              isStopping={isStopping}
              capacityLoading={capacityLoading ?? false}
              onDeviceChange={handleDeviceChange}
              onCameraChange={handleCameraChange}
              onVideoChange={handleVideoChange}
              onVideoTypeChange={handleVideoTypeChange}
              onQualityChange={handleQualityChange}
              onStart={handleStart}
              onStop={handleStop}
            />

            <aside className='flex flex-col gap-4'>
              <TacticalMiniMap />
              <DockMonitor />
            </aside>
          </div>
        </div>
      </main>

      <SystemStatusFooter />
    </div>
  );
}
