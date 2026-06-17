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
  // ─── Auth ─────────────────────────────────────────────────────────────────
  const { user, isLoading: authLoading } = useAuth();

  // ─── Livestream hooks ──────────────────────────────────────────────────────
  const { data: capacityMap, isLoading: capacityLoading } = useLiveCapacity({
    enabled: !authLoading,
  });
  const { mutate: startStream, isPending: isStarting } = useStartStream();
  const { mutate: stopStream, isPending: isStopping } = useStopStream();
  const { mutate: updateQuality } = useUpdateStreamQuality();
  const { mutate: switchCamera } = useSwitchStreamCamera();

  // ─── Telemetry & device data ───────────────────────────────────────────────
  const { getProcessedDroneData, getDroneTelemetry } = useTelemetry();
  const { data: deviceList = [] } = useDJIDevices();

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
    if (!isStreaming) {
      setElapsedSeconds(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isStreaming]);

  // ─── Derived selections ───────────────────────────────────────────────────
  const devices = capacityMap ? Array.from(capacityMap.values()) : [];
  const selectedDevice = selectedSn ? capacityMap?.get(selectedSn) : undefined;
  // useMemo keeps references stable so auto-select effects don't loop
  const cameras = useMemo(() => selectedDevice?.cameras_list ?? [], [selectedDevice]);
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId);
  const videos = useMemo(() => selectedCamera?.videos_list ?? [], [selectedCamera]);
  // VideoCapacity has no switchVideoTypes — hide the lens selector
  const videoTypes: string[] = [];

  // ─── Header data ──────────────────────────────────────────────────────────
  // Find the dock independently — prefer online, fall back to any registered dock.
  // DJI Dock 3 reports domain '3' in some firmware deployments.
  const dockDevice = useMemo(
    () =>
      deviceList.find((d) => (d.domain === '1' || d.domain === '3') && d.status) ??
      deviceList.find((d) => d.domain === '1' || d.domain === '3'),
    [deviceList]
  );
  const dockName = dockDevice?.nickname || dockDevice?.deviceName;

  // Real-time dock online status — WebSocket device_online_update is authoritative;
  // REST API status (polled every 30s) is the fallback for the initial render before
  // any WS event arrives.
  const dockWsState = dockDevice ? getDroneTelemetry(dockDevice.deviceSn) : undefined;
  const dockOnline = dockWsState ? dockWsState.online_status : (dockDevice?.status ?? false);

  // Live OSD telemetry for the selected drone
  const droneData = selectedSn ? getProcessedDroneData(selectedSn) : null;
  // Dock OSD — battery, wind etc. from the dock's own WebSocket events
  const dockData = dockDevice ? getProcessedDroneData(dockDevice.deviceSn) : null;
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

  const handleVideoChange = useCallback(
    (videoId: string) => {
      setSelectedVideoId(videoId);
      setActiveStreamVideoId('');
      setActiveStreamUrl('');
      setIsStreaming(false);
      const video = videos.find((v) => v.id === videoId);
      setSelectedVideoType(video?.type || 'zoom');
    },
    [videos]
  );

  const handleStart = useCallback(() => {
    if (!selectedVideoId) {
      toast.error('No device selected — waiting for dock to come online');
      return;
    }
    // DJI API requires composite video_id: {sn}/{camera_index}/{video_index}
    const video = videos.find((v) => v.id === selectedVideoId);
    const compositeId =
      selectedCamera && video ? `${selectedSn}/${selectedCamera.index}/${video.index}` : null;
    if (!compositeId) {
      toast.error('Could not resolve video ID — try selecting device again');
      return;
    }
    const videoType = selectedVideoType || 'normal';
    startStream(
      {
        url: '',
        video_id: compositeId,
        url_type: 4,
        video_quality: streamQuality,
        video_type: videoType,
      },
      {
        onSuccess: (data) => {
          const streamUrl = data?.url ?? '';
          if (!streamUrl) {
            toast.error(
              'DJI returned no stream URL — verify the drone supports WebRTC (url_type 4)'
            );
            return;
          }
          setIsStreaming(true);
          setActiveStreamVideoId(compositeId);
          setActiveStreamUrl(streamUrl);
          toast.success('Stream started');
        },
        onError: (err: Error) => toast.error(`Failed to start stream: ${err.message}`),
      }
    );
  }, [
    selectedVideoId,
    selectedVideoType,
    videos,
    selectedCamera,
    selectedSn,
    streamQuality,
    startStream,
  ]);

  const handleStop = useCallback(() => {
    if (!activeStreamVideoId) return;
    stopStream(
      {
        url: '',
        video_id: activeStreamVideoId,
        url_type: 4,
        video_quality: streamQuality,
        video_type: selectedVideoType,
      },
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
        updateQuality({
          url: '',
          video_id: activeStreamVideoId,
          url_type: 4,
          video_quality: quality,
          video_type: selectedVideoType,
        });
      }
    },
    [isStreaming, activeStreamVideoId, selectedVideoType, updateQuality]
  );

  const handleVideoTypeChange = useCallback(
    (videoType: string) => {
      setSelectedVideoType(videoType);
      if (isStreaming && activeStreamVideoId) {
        switchCamera({
          url: '',
          video_id: activeStreamVideoId,
          url_type: 4,
          video_quality: streamQuality,
          video_type: videoType,
        });
      }
    },
    [isStreaming, activeStreamVideoId, streamQuality, switchCamera]
  );

  // Auto-select the drone paired to the dock once live capacity loads
  useEffect(() => {
    if (dockDevice?.childDeviceSn && !selectedSn && capacityMap?.has(dockDevice.childDeviceSn)) {
      setSelectedSn(dockDevice.childDeviceSn);
    }
  }, [dockDevice, capacityMap, selectedSn]);

  // Auto-select first camera when a device is chosen (only one camera per dock in practice)
  useEffect(() => {
    if (cameras.length > 0 && !selectedCameraId) {
      handleCameraChange(cameras[0].id);
    }
  }, [cameras, selectedCameraId, handleCameraChange]);

  // Auto-select first video source — controller drives which feed is active;
  // the web app just needs a valid video_id to build the composite stream ID
  useEffect(() => {
    if (videos.length > 0 && !selectedVideoId) {
      handleVideoChange(videos[0].id);
    }
  }, [videos, selectedVideoId, handleVideoChange]);

  return (
    <div className='bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30'>
      <main className='flex-1 flex flex-col items-center py-4 px-6 pb-[80px] overflow-y-auto overflow-x-hidden'>
        <div className='w-full space-y-4'>
          <section className='space-y-2'>
            <TelemetryHeader
              workspaceName={user?.workspace_name}
              dockName={dockName}
              dockOnline={dockOnline}
              droneBattery={droneData?.battery ?? dockData?.battery}
              remainFlightTime={droneData?.remainFlightTime}
              cameraName={selectedCamera?.name}
              isStreaming={isStreaming}
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
                videoTypes={videoTypes}
                selectedSn={selectedSn}
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
                onVideoTypeChange={handleVideoTypeChange}
                onQualityChange={handleQualityChange}
                onStart={handleStart}
                onStop={handleStop}
                className={isMain ? undefined : 'h-[342px]'}
                isMini={!isMain}
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
        deviceList={deviceList}
        dockSn={dockDevice?.deviceSn}
        dockOnline={dockOnline}
      />
    </div>
  );
}
