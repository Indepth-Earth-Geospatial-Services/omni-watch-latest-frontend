'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import TelemetryHeader from '@/components/features/control/TelemetryHeader';
import FlightStatsBar from '@/components/features/control/FlightStatsBar';
import MissionControlViewport from '@/components/features/control/MissionControlViewport';
import TacticalMiniMap from '@/components/features/control/TacticalMiniMap';
import DockMonitor from '@/components/features/control/DockMonitor';
import SystemStatusFooter from '@/components/features/control/SystemStatusFooter';
import {
  useLiveCapacity,
  useStartStream,
  useStopStream,
  useUpdateStreamQuality,
  useSwitchStreamCamera,
} from '@/hooks/useLiveStreams';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { useAuth } from '@/providers/AuthProvider';

function formatElapsed(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ControlPage() {
  // ─── Livestream hooks ──────────────────────────────────────────────────────
  const { data: capacityMap, isLoading: capacityLoading } = useLiveCapacity();
  const { mutate: startStream, isPending: isStarting } = useStartStream();
  const { mutate: stopStream, isPending: isStopping } = useStopStream();
  const { mutate: updateQuality } = useUpdateStreamQuality();
  const { mutate: switchCamera } = useSwitchStreamCamera();

  // ─── Telemetry & device data ───────────────────────────────────────────────
  const { getProcessedDroneData } = useTelemetry();
  const { data: deviceList = [] } = useDJIDevices();
  const { user } = useAuth();

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selectedSn, setSelectedSn] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState('zoom');
  const [streamQuality, setStreamQuality] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  // ─── Elapsed time timer ────────────────────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isStreaming) { setElapsedSeconds(0); return; }
    const start = Date.now();
    const id = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isStreaming]);

  // ─── Derived selections ───────────────────────────────────────────────────
  const devices = capacityMap ? Array.from(capacityMap.values()) : [];
  const selectedDevice = selectedSn ? capacityMap?.get(selectedSn) : undefined;
  const cameras = selectedDevice?.cameras_list ?? [];
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId);
  const videos = selectedCamera?.videos_list ?? [];
  // VideoCapacity has no switchVideoTypes — hide the lens selector
  const videoTypes: string[] = [];

  // ─── Header data ──────────────────────────────────────────────────────────
  // Find the dock (domain=1) whose child is the selected drone
  const dockDevice = useMemo(
    () => deviceList.find((d) => d.domain === '1' && d.childDeviceSn === selectedSn),
    [deviceList, selectedSn]
  );
  const dockName = dockDevice?.nickname || dockDevice?.deviceName;

  // Live OSD telemetry for the selected drone
  const droneData = selectedSn ? getProcessedDroneData(selectedSn) : null;

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

  const handleVideoChange = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    setIsStreaming(false);
  }, []);

  const handleStart = useCallback(() => {
    if (!selectedVideoId) return;
    startStream(
      {
        url: '',
        video_id: selectedVideoId,
        url_type: 4,
        video_quality: streamQuality,
        video_type: selectedVideoType,
      },
      { onSuccess: () => setIsStreaming(true) }
    );
  }, [selectedVideoId, streamQuality, selectedVideoType, startStream]);

  const handleStop = useCallback(() => {
    if (!selectedVideoId) return;
    stopStream(
      {
        url: '',
        video_id: selectedVideoId,
        url_type: 4,
        video_quality: streamQuality,
        video_type: selectedVideoType,
      },
      { onSuccess: () => setIsStreaming(false) }
    );
  }, [selectedVideoId, streamQuality, selectedVideoType, stopStream]);

  const handleQualityChange = useCallback(
    (quality: number) => {
      setStreamQuality(quality);
      if (isStreaming && selectedVideoId) {
        updateQuality({
          url: '',
          video_id: selectedVideoId,
          url_type: 4,
          video_quality: quality,
          video_type: selectedVideoType,
        });
      }
    },
    [isStreaming, selectedVideoId, selectedVideoType, updateQuality]
  );

  const handleVideoTypeChange = useCallback(
    (videoType: string) => {
      setSelectedVideoType(videoType);
      if (isStreaming && selectedVideoId) {
        switchCamera({
          url: '',
          video_id: selectedVideoId,
          url_type: 4,
          video_quality: streamQuality,
          video_type: videoType,
        });
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
              workspaceName={user?.workspace_name}
              dockName={dockName}
              windSpeed={droneData?.windSpeed}
              windDirection={droneData?.windDirection}
              elapsedTime={formatElapsed(elapsedSeconds)}
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

      <SystemStatusFooter
        droneData={droneData}
        elapsedTime={formatElapsed(elapsedSeconds)}
        deviceList={deviceList}
      />
    </div>
  );
}
