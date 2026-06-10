'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import TelemetryHeader from '@/components/features/control/TelemetryHeader';
import FlightStatsBar from '@/components/features/control/FlightStatsBar';
import MissionControlViewport from '@/components/features/control/MissionControlViewport';
import TacticalMiniMap from '@/components/features/control/TacticalMiniMap';
import DockMonitor from '@/components/features/control/DockMonitor';
import SystemStatusFooter from '@/components/features/control/SystemStatusFooter';
import { ControlErrorBoundary } from '@/components/features/control/ControlErrorBoundary';
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
import { DJIApiError } from '@/lib/config/client';
import { getToken } from '@/lib/config/token-store';
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
  const { user } = useAuth();

  // ─── Livestream hooks ──────────────────────────────────────────────────────
  const {
    data: capacityMap,
    isLoading: capacityLoading,
    error: capacityError,
  } = useLiveCapacity({ enabled: !!getToken() });
  const { mutate: startStream, isPending: isStarting } = useStartStream();
  const { mutate: stopStream, isPending: isStopping } = useStopStream();
  const { mutate: updateQuality } = useUpdateStreamQuality();
  const { mutate: switchCamera } = useSwitchStreamCamera();

  // ─── Device data ───────────────────────────────────────────────────────────
  const {
    data: deviceList = [],
    error: devicesError,
  } = useDJIDevices();

  // ─── Telemetry ────────────────────────────────────────────────────────────
  const { getProcessedDroneData, getDroneTelemetry } = useTelemetry();

  // ─── Log API errors via toast so they surface in the UI ───────────────────
  useEffect(() => {
    if (!capacityError) return;
    const msg = capacityError instanceof Error ? capacityError.message : String(capacityError);
    console.error('[Control:LiveCapacity]', capacityError);
    toast.error(`Live capacity failed: ${msg}`, { id: 'capacity-error' });
  }, [capacityError]);

  useEffect(() => {
    if (!devicesError) return;
    const msg = devicesError instanceof Error ? devicesError.message : String(devicesError);
    console.error('[Control:DJIDevices]', devicesError);
    toast.error(`Device list failed: ${msg}`, { id: 'devices-error' });
  }, [devicesError]);

  // ─── Panel layout state ───────────────────────────────────────────────────
  const [mainPanel, setMainPanel] = useState<PanelId>('viewport');
  const [coverOpen, setCoverOpen] = useState(false);

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selectedSn, setSelectedSn] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState('');
  const [streamQuality, setStreamQuality] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStreamVideoId, setActiveStreamVideoId] = useState('');
  const [activeStreamUrl, setActiveStreamUrl] = useState('');

  // ─── Elapsed stream timer ──────────────────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isStreaming) { setElapsedSeconds(0); return; }
    const start = Date.now();
    const id = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isStreaming]);

  // ─── Derived selections ───────────────────────────────────────────────────
  // Drone SNs only (domain '0') — docks are domain '1' or '3' and stream separately
  const droneSns = useMemo(
    () => new Set(deviceList.filter((d) => d.domain === '0').map((d) => d.deviceSn)),
    [deviceList]
  );
  // Only drone capacity entries go to MissionControlViewport
  const devices = useMemo(
    () => (capacityMap ? Array.from(capacityMap.values()).filter((c) => droneSns.has(c.sn)) : []),
    [capacityMap, droneSns]
  );
  const selectedDevice = selectedSn ? capacityMap?.get(selectedSn) : undefined;
  const cameras = useMemo(() => selectedDevice?.cameras_list ?? [], [selectedDevice]);
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId);
  const videos = useMemo(() => selectedCamera?.videos_list ?? [], [selectedCamera]);
  const videoTypes: string[] = [];

  // ─── Dock & telemetry ─────────────────────────────────────────────────────
  const dockDevice = useMemo(
    () =>
      deviceList.find((d) => (d.domain === '1' || d.domain === '3') && d.status) ??
      deviceList.find((d) => d.domain === '1' || d.domain === '3'),
    [deviceList]
  );
  const dockCapacity = dockDevice ? capacityMap?.get(dockDevice.deviceSn) : undefined;
  const dockName = dockDevice?.nickname || dockDevice?.deviceName;
  const dockWsState = dockDevice ? getDroneTelemetry(dockDevice.deviceSn) : undefined;
  const dockOnline = dockWsState ? dockWsState.online_status : (dockDevice?.status ?? false);
  const droneData = selectedSn ? getProcessedDroneData(selectedSn) : null;
  const dockData = dockDevice ? getProcessedDroneData(dockDevice.deviceSn) : null;
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
      setSelectedVideoType(video?.type || 'normal');
    },
    [videos]
  );

  const handleStart = useCallback(() => {
    if (!selectedVideoId) {
      toast.error('[Stream] No video selected — waiting for dock to come online');
      return;
    }
    const video = videos.find((v) => v.id === selectedVideoId);
    const compositeId =
      selectedCamera && video ? `${selectedSn}/${selectedCamera.index}/${video.index}` : null;
    if (!compositeId) {
      toast.error('[Stream] Could not resolve composite video ID — try re-selecting the device');
      return;
    }
    console.log(`[Control:Stream] starting — videoId: ${compositeId}, quality: ${streamQuality}`);
    const videoType = selectedVideoType || 'normal';
    startStream(
      { url: '', video_id: compositeId, url_type: 4, video_quality: streamQuality, video_type: videoType },
      {
        onSuccess: (data) => {
          const streamUrl = data?.url ?? '';
          if (!streamUrl) {
            toast.error('[Stream] DJI returned no WHEP URL — verify the drone supports url_type 4');
            return;
          }
          console.log(`[Control:Stream] WHEP url received: ${streamUrl}`);
          setIsStreaming(true);
          setActiveStreamVideoId(compositeId);
          setActiveStreamUrl(streamUrl);
          toast.success('Stream started');
        },
        onError: (err: Error) => {
          if (err instanceof DJIApiError && err.code === 513003) {
            const existingUrl = (err.data as { url?: string } | undefined)?.url ?? '';
            if (existingUrl) {
              console.log(`[Control:Stream] 513003 — reusing existing WHEP url: ${existingUrl}`);
              setIsStreaming(true);
              setActiveStreamVideoId(compositeId);
              setActiveStreamUrl(existingUrl);
              toast.success('Connected to existing stream');
              return;
            }
          }
          console.error('[Control:Stream] startStream error:', err);
          toast.error(`[Stream] ${err.message}`);
        },
      }
    );
  }, [selectedVideoId, selectedVideoType, videos, selectedCamera, selectedSn, streamQuality, startStream]);

  const handleStop = useCallback(() => {
    if (!activeStreamVideoId) return;
    stopStream(
      { url: '', video_id: activeStreamVideoId, url_type: 4, video_quality: streamQuality, video_type: selectedVideoType },
      {
        onSettled: () => { setIsStreaming(false); setActiveStreamVideoId(''); setActiveStreamUrl(''); },
        onError: (err: Error) => {
          console.error('[Control:Stream] stopStream error:', err);
          toast.error(`[Stream] Stop failed: ${err.message}`);
        },
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

  // ─── Auto-select chain ────────────────────────────────────────────────────
  useEffect(() => {
    if (dockDevice?.childDeviceSn && !selectedSn && capacityMap?.has(dockDevice.childDeviceSn)) {
      console.log(`[Control:AutoSelect] drone → ${dockDevice.childDeviceSn}`);
      setSelectedSn(dockDevice.childDeviceSn);
    }
  }, [dockDevice, capacityMap, selectedSn]);

  useEffect(() => {
    if (cameras.length > 0 && !selectedCameraId) {
      console.log(`[Control:AutoSelect] camera → ${cameras[0].id}`);
      handleCameraChange(cameras[0].id);
    }
  }, [cameras, selectedCameraId, handleCameraChange]);

  useEffect(() => {
    if (videos.length > 0 && !selectedVideoId) {
      console.log(`[Control:AutoSelect] video → ${videos[0].id}`);
      handleVideoChange(videos[0].id);
    }
  }, [videos, selectedVideoId, handleVideoChange]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className='bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30'>
      <main className='flex-1 flex flex-col items-center py-4 px-6 pb-[80px] overflow-y-auto overflow-x-hidden'>
        <div className='w-full space-y-4'>

          {/* ── Header section ── */}
          <section className='space-y-2'>
            <ControlErrorBoundary section='TelemetryHeader'>
              <TelemetryHeader
                workspaceName={user?.workspace_name}
                dockName={dockName}
                dockOnline={dockOnline}
                dockBattery={dockData?.battery}
                windSpeed={dockData?.windSpeed}
                windDirection={dockData?.windDirection}
                coverOpen={coverOpen}
              />
            </ControlErrorBoundary>
            <ControlErrorBoundary section='FlightStatsBar'>
              <FlightStatsBar droneData={droneData} elapsedTime={formatElapsed(elapsedSeconds)} />
            </ControlErrorBoundary>
          </section>

          {/* ── Panel grid ── */}
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
              <ControlErrorBoundary section='MissionControlViewport'>
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
                  dockSn={dockDevice?.deviceSn}
                  dockOnline={dockOnline}
                  onDeviceChange={handleDeviceChange}
                  onVideoTypeChange={handleVideoTypeChange}
                  onQualityChange={handleQualityChange}
                  onStart={handleStart}
                  onStop={handleStop}
                  className={isMain ? undefined : 'h-[342px]'}
                  isMini={!isMain}
                />
              </ControlErrorBoundary>
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
                    <ControlErrorBoundary section='TacticalMiniMap'>
                      <TacticalMiniMap droneData={droneData} dockData={dockData} className='w-full h-[700px]' />
                    </ControlErrorBoundary>
                  )}
                  {mainPanel === 'dock' && (
                    <ControlErrorBoundary section='DockMonitor'>
                      <DockMonitor dockDevice={dockDevice} droneData={droneData} dockCapacity={dockCapacity} onCoverChange={setCoverOpen} className='w-full h-[700px]' />
                    </ControlErrorBoundary>
                  )}
                </div>

                {/* ── Side panels (right column) ── */}
                <aside className='flex flex-col gap-4'>
                  {sidePanelIds.map((id) => (
                    <div key={id} className='relative'>
                      {swapBtn(id)}
                      {id === 'viewport' && viewportPanel(false)}
                      {id === 'map' && (
                        <ControlErrorBoundary section='TacticalMiniMap'>
                          <TacticalMiniMap droneData={droneData} />
                        </ControlErrorBoundary>
                      )}
                      {id === 'dock' && (
                        <ControlErrorBoundary section='DockMonitor'>
                          <DockMonitor dockDevice={dockDevice} droneData={droneData} dockCapacity={dockCapacity} onCoverChange={setCoverOpen} />
                        </ControlErrorBoundary>
                      )}
                    </div>
                  ))}
                </aside>
              </div>
            );
          })()}
        </div>
      </main>

      <ControlErrorBoundary section='SystemStatusFooter'>
        <SystemStatusFooter
          deviceList={deviceList}
          dockSn={dockDevice?.deviceSn}
          dockOnline={dockOnline}
        />
      </ControlErrorBoundary>
    </div>
  );
}
