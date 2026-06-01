'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
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
import { toast } from 'sonner';

type PanelId = 'viewport' | 'map' | 'dock';

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

  // ─── Panel layout state ───────────────────────────────────────────────────
  const [mainPanel, setMainPanel] = useState<PanelId>('viewport');

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selectedSn, setSelectedSn] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState('');
  const [streamQuality, setStreamQuality] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  // Composite video_id used to start the current stream — needed for stop/quality/switch
  // Composite video_id used to start the current stream — needed for stop/quality/switch
  const [activeStreamVideoId, setActiveStreamVideoId] = useState('');
  // WebRTC playback URL returned by the DJI API when a stream successfully starts
  const [activeStreamUrl, setActiveStreamUrl] = useState('');

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
  // modeCode 0 = standby/docked, anything else = airborne
  const isFlying = droneData ? droneData.modeCode !== 0 : false;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleDeviceChange = useCallback((sn: string) => {
    setSelectedSn(sn);
    setSelectedCameraId('');
    setSelectedVideoId('');
    setSelectedVideoType('');
    setActiveStreamVideoId('');
    setActiveStreamUrl('');
    setIsStreaming(false);
  }, []);

  const handleCameraChange = useCallback((cameraId: string) => {
    setSelectedCameraId(cameraId);
    setSelectedVideoId('');
    setSelectedVideoType('');
    setActiveStreamVideoId('');
    setActiveStreamUrl('');
    setIsStreaming(false);
  }, []);

  const handleVideoChange = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    setActiveStreamVideoId('');
    setActiveStreamUrl('');
    setIsStreaming(false);
    const video = videos.find((v) => v.id === videoId);
    setSelectedVideoType(video?.type ?? '');
  }, [videos]);

  const handleStart = useCallback(() => {
    if (!selectedVideoId || !selectedVideoType) {
      toast.error('Select a device, camera, and video source first');
      return;
    }
    // DJI API requires composite video_id: {sn}/{camera_index}/{video_index}
    const video = videos.find((v) => v.id === selectedVideoId);
    const compositeId =
      selectedCamera && video
        ? `${selectedSn}/${selectedCamera.index}/${video.index}`
        : null;
    if (!compositeId) {
      toast.error('Could not resolve video ID — try selecting device again');
      return;
    }
    startStream(
      { url: '', video_id: compositeId, url_type: 4, video_quality: streamQuality, video_type: selectedVideoType },
      {
        onSuccess: (data) => {
          setIsStreaming(true);
          setActiveStreamVideoId(compositeId);
          setActiveStreamUrl(data?.url ?? '');
          toast.success('Stream started');
        },
        onError: (err: Error) => toast.error(`Failed to start stream: ${err.message}`),
      }
    );
  }, [selectedVideoId, selectedVideoType, videos, selectedCamera, selectedSn, streamQuality, startStream]);

  const handleStop = useCallback(() => {
    if (!activeStreamVideoId) return;
    stopStream(
      { url: '', video_id: activeStreamVideoId, url_type: 4, video_quality: streamQuality, video_type: selectedVideoType },
      {
        onSettled: () => {
          setIsStreaming(false);
          setActiveStreamVideoId('');
          setActiveStreamUrl('');
        },
        onError: (err: Error) => toast.error(`Failed to stop stream: ${err.message}`),
      }
    );
  }, [activeStreamVideoId, streamQuality, selectedVideoType, stopStream]);

  const handleQualityChange = useCallback(
    (quality: number) => {
      setStreamQuality(quality);
      if (isStreaming && activeStreamVideoId) {
        updateQuality({ url: '', video_id: activeStreamVideoId, url_type: 4, video_quality: quality, video_type: selectedVideoType });
      }
    },
    [isStreaming, activeStreamVideoId, selectedVideoType, updateQuality]
  );

  const handleVideoTypeChange = useCallback(
    (videoType: string) => {
      setSelectedVideoType(videoType);
      if (isStreaming && activeStreamVideoId) {
        switchCamera({ url: '', video_id: activeStreamVideoId, url_type: 4, video_quality: streamQuality, video_type: videoType });
      }
    },
    [isStreaming, activeStreamVideoId, streamQuality, switchCamera]
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
            <FlightStatsBar droneData={droneData} elapsedTime={formatElapsed(elapsedSeconds)} />
          </section>

          {(() => {
            const swapBtn = (id: PanelId) => {
              const isMain = mainPanel === id;
              const pos = id === 'viewport' ? 'top-[50px] right-2' : 'top-2 right-2';
              return (
                <button
                  key={`swap-${id}`}
                  onClick={() => setMainPanel(isMain ? 'viewport' : id)}
                  className={`absolute ${pos} z-30 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg border backdrop-blur-sm ${
                    isMain
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/15 hover:border-white/25'
                  }`}
                  title={isMain ? 'Reset to default layout' : 'Switch to main view'}
                >
                  {isMain ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                </button>
              );
            };

            const viewportPanel = (isMain: boolean) => (
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
                isFlying={isFlying}
                activeStreamUrl={activeStreamUrl}
                onDeviceChange={handleDeviceChange}
                onCameraChange={handleCameraChange}
                onVideoChange={handleVideoChange}
                onVideoTypeChange={handleVideoTypeChange}
                onQualityChange={handleQualityChange}
                onStart={handleStart}
                onStop={handleStop}
                className={isMain ? undefined : 'h-[342px]'}
              />
            );

            const sidePanelIds = (['viewport', 'map', 'dock'] as const).filter(
              (p) => p !== mainPanel
            );

            return (
              <div className='flex flex-row gap-4 justify-center'>
                {/* ── Main panel (left, big) ── */}
                <div className='relative flex-1'>
                  {swapBtn(mainPanel)}
                  {mainPanel === 'viewport' && viewportPanel(true)}
                  {mainPanel === 'map' && (
                    <TacticalMiniMap droneData={droneData} className='w-full h-[700px]' />
                  )}
                  {mainPanel === 'dock' && (
                    <DockMonitor
                      dockDevice={dockDevice}
                      droneData={droneData}
                      className='w-full h-[700px]'
                    />
                  )}
                </div>

                {/* ── Side panels (right column) ── */}
                <aside className='flex flex-col gap-4'>
                  {sidePanelIds.map((id) => (
                    <div key={id} className='relative'>
                      {swapBtn(id)}
                      {id === 'viewport' && viewportPanel(false)}
                      {id === 'map' && <TacticalMiniMap droneData={droneData} />}
                      {id === 'dock' && (
                        <DockMonitor dockDevice={dockDevice} droneData={droneData} />
                      )}
                    </div>
                  ))}
                </aside>
              </div>
            );
          })()}
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
