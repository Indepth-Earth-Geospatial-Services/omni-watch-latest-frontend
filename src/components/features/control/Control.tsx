'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { useDRC } from '@/hooks/useDRC';
import TelemetryHeader from '@/components/features/control/TelemetryHeader';
import FlightStatsBar from '@/components/features/control/FlightStatsBar';
import DroneFeed from '@/components/features/control/DroneFeed';
import { WebRTCPlayer } from '@/components/features/streams/WebRTCPlayer';
import type { StreamState } from '@/components/features/streams/WebRTCPlayer';
import TacticalMiniMap from '@/components/features/control/MiniMap';
import { FlightCommandModal } from '@/components/features/control/FlightCommandModal';
import DockFeed from '@/components/features/control/DockFeed';
import FlightControlActions from '@/components/features/control/FlightControlActions';
// import SensorToolbar from '@/components/features/control/SensorToolBar';
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
import type { DJIDevice, LiveCapacity } from '@/lib/types';
import { useDockMQTT } from '@/hooks/useDockMQTT';
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

  // ─── DRC (Drone Real-time Control) ───────────────────────────────────────
  // Owned here so the channel + sendJoystick survive panel/tab switches and
  // ManualFlightControls can be rendered inside the main panel container.
  const {
    status: drcStatus,
    activate: drcActivate,
    deactivate: drcDeactivate,
    sendEmergencyStop,
    sendJoystick,
  } = useDRC();
  const [isManualActive, setIsManualActive] = useState(false);

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
  const { data: deviceList = [], error: devicesError } = useDJIDevices();

  // ─── Telemetry ────────────────────────────────────────────────────────────
  const { getProcessedDroneData, getDroneTelemetry, droneUpdates } = useTelemetry();

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

  // ─── Map style — shared across both map instances, persisted to localStorage ─
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>(() => {
    try {
      return localStorage.getItem('omni_map_style') === 'satellite' ? 'satellite' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const handleMapStyleChange = useCallback((style: 'dark' | 'satellite') => {
    setMapStyle(style);
    try {
      localStorage.setItem('omni_map_style', style);
    } catch {}
  }, []);

  // ─── Active mission target (current destination) ─────────────────────────
  const [takeoffTarget, setTakeoffTarget] = useState<{ lat: number; lng: number } | null>(null);
  // Launch origin — dock position captured at the moment takeoff is commanded
  const [originPoint, setOriginPoint] = useState<{ lat: number; lng: number } | null>(null);
  // Ordered history of every destination the drone has been commanded to fly to
  const [flightWaypoints, setFlightWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);

  // ─── Flight command modal (unified Takeoff + Fly-To) ─────────────────────
  const [flightCommandTarget, setFlightCommandTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // ─── Selection state ──────────────────────────────────────────────────────
  const [selectedSn, setSelectedSn] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState('');
  const [streamQuality, setStreamQuality] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStreamVideoId, setActiveStreamVideoId] = useState('');
  const [activeStreamUrl, setActiveStreamUrl] = useState('');

  // ─── WebRTC stream state — lifted here so it survives panel swaps ─────────
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [streamConnectState, setStreamConnectState] = useState<StreamState | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);

  const handleReconnect = useCallback(() => {
    setMediaStream(null);
    setStreamConnectState(null);
    setReconnectKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!activeStreamUrl) {
      setMediaStream(null);
      setStreamConnectState(null);
    }
  }, [activeStreamUrl]);

  // ─── Elapsed stream timer ──────────────────────────────────────────────────
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
  // Drone SNs only (domain '0') — docks are domain '1' or '3' and stream separately
  const droneSns = useMemo(
    () => new Set(deviceList.filter((d) => d.domain === '0').map((d) => d.deviceSn)),
    [deviceList]
  );
  // Only drone capacity entries go to DroneFeed
  const devices = useMemo<LiveCapacity[]>(
    () =>
      capacityMap
        ? (Array.from(capacityMap.values()) as LiveCapacity[]).filter((c) => droneSns.has(c.sn))
        : [],
    [capacityMap, droneSns]
  );
  const selectedDevice = selectedSn ? capacityMap?.get(selectedSn) : undefined;
  const cameras = useMemo(() => selectedDevice?.cameras_list ?? [], [selectedDevice]);
  // CameraCapacity.id is absent from the DJI API response — use index (always present) as the key.
  const selectedCamera = cameras.find((c) => c.index === selectedCameraId);
  const videos = useMemo(() => selectedCamera?.videos_list ?? [], [selectedCamera]);

  // Lens selector options — two models:
  // • M4D Camera style: single stream slot with switch_video_types (Normal/Wide/Zoom/IR).
  //   Use switch_video_types directly so all options including 'normal' are available.
  // • Mavic 3T style: separate video entry per lens (wide-0, zoom-0, thermal-0).
  //   Derive one option per video entry.
  const videoTypes = useMemo((): string[] => {
    if (videos.length === 0) return [];
    const primary = videos[0];
    if (primary.switch_video_types && primary.switch_video_types.length > 0) {
      return primary.switch_video_types.filter((t) => t.toLowerCase() !== 'normal');
    }
    return videos.map((v) => v.type);
  }, [videos]);

  // ─── Dock MQTT (mode_code for debug/operation state) ─────────────────────
  const { getDockModeCode, getJoystickInvalidState, getDockCoverState } = useDockMQTT();

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
  const dockModeCode = dockDevice ? getDockModeCode(dockDevice.deviceSn) : -1;
  const joystickInvalidState = dockDevice ? getJoystickInvalidState(dockDevice.deviceSn) : null;
  const dockCoverState = dockDevice ? getDockCoverState(dockDevice.deviceSn) : null;

  // ─── DRC lifecycle ────────────────────────────────────────────────────────
  const dockSn = dockDevice?.deviceSn;
  // Auto-activate when the dock comes online. drcActivate is idempotent.
  useEffect(() => {
    if (!dockSn || !dockOnline) return;
    drcActivate(dockSn).catch((err: Error) =>
      console.warn('[DRC] Auto-activate failed:', err.message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dockSn, dockOnline]); // no cleanup — a brief flicker must not disconnect the session

  // Disconnect only when the dock changes or this component unmounts.
  useEffect(() => {
    return () => { drcDeactivate(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dockSn]);

  // Clear takeoff target when drone returns to dock (modeCode=0 = IDLE/in dock)
  useEffect(() => {
    if (droneData?.modeCode === 0) setTakeoffTarget(null);
  }, [droneData?.modeCode]);

  // Opens the unified FlightCommandModal; lat/lng null → fall back to dock position
  const handleOpenFlightCommand = useCallback(
    (lat: number | null, lng: number | null) => {
      setFlightCommandTarget({
        lat: lat ?? dockData?.latitude ?? 0,
        lng: lng ?? dockData?.longitude ?? 0,
      });
    },
    [dockData?.latitude, dockData?.longitude]
  );

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
    (videoIndex: string) => {
      setSelectedVideoId(videoIndex);
      setActiveStreamVideoId('');
      setActiveStreamUrl('');
      setIsStreaming(false);
      const video = videos.find((v) => v.index === videoIndex);
      const wideType = video?.switch_video_types?.find((t) => t.toLowerCase() === 'wide');
      const defaultType =
        wideType ??
        video?.switch_video_types?.find((t) => t.toLowerCase() !== 'normal') ??
        video?.type ??
        '';
      setSelectedVideoType(defaultType);
    },
    [videos]
  );

  const handleStart = useCallback(() => {
    if (!selectedVideoId) {
      toast.error('[Stream] No video selected — waiting for dock to come online');
      return;
    }
    const video = videos.find((v) => v.index === selectedVideoId);
    const compositeId =
      selectedCamera && video ? `${selectedSn}/${selectedCamera.index}/${video.index}` : null;
    if (!compositeId) {
      toast.error('[Stream] Could not resolve composite video ID — try re-selecting the device');
      return;
    }
    console.log(
      `[Control:Stream] starting — videoId: ${compositeId}, type: ${selectedVideoType}, quality: ${streamQuality}`
    );
    startStream(
      {
        url: '',
        video_id: compositeId,
        url_type: 4,
        video_quality: streamQuality,
        video_type: selectedVideoType,
      },
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
      // For Mavic-style cameras each lens has its own video entry — update selectedVideoId
      // so handleStart picks the correct index (e.g. zoom-0 when Zoom is selected).
      // For M4D-style cameras all lenses share one index (normal-0); no change needed.
      const matchingVideo = videos.find((v) => v.type === videoType);
      if (matchingVideo) setSelectedVideoId(matchingVideo.index);
      if (isStreaming && activeStreamVideoId) {
        const newId =
          matchingVideo && selectedCamera
            ? `${selectedSn}/${selectedCamera.index}/${matchingVideo.index}`
            : activeStreamVideoId;
        switchCamera({
          url: '',
          video_id: newId,
          url_type: 4,
          video_quality: streamQuality,
          video_type: videoType,
        });
      }
    },
    [
      isStreaming,
      activeStreamVideoId,
      streamQuality,
      switchCamera,
      videos,
      selectedSn,
      selectedCamera,
    ]
  );

  // ─── Auto-select chain ────────────────────────────────────────────────────
  // Priority 1: dock's childDeviceSn (available from the REST API binding record)
  // Priority 2: first drone SN in deviceList that has received any WebSocket event
  //             — fires the moment the drone comes online, no page refresh needed
  // Priority 3: first drone SN known from the device list (offline, no WS data yet)
  // We intentionally do NOT gate on capacityMap — that polls at 30s and would leave
  // FlightStatsBar blank for up to 30s after a sleeping drone wakes up.
  useEffect(() => {
    if (selectedSn) return;
    const droneSNs: string[] = (deviceList as DJIDevice[])
      .filter((d) => d.domain === '0')
      .map((d) => d.deviceSn)
      .filter(Boolean);
    const autoSn =
      dockDevice?.childDeviceSn ?? droneSNs.find((sn) => droneUpdates.has(sn)) ?? droneSNs[0];
    if (autoSn) {
      console.log(`[Control:AutoSelect] drone → ${autoSn}`);
      setSelectedSn(autoSn);
    }
  }, [dockDevice, selectedSn, deviceList, droneUpdates]);

  useEffect(() => {
    if (cameras.length > 0 && !selectedCameraId) {
      // Prefer cameras with non-'normal' video types (e.g., M4D Camera at 99-0-0 over
      // IR/Wide Gimbal at 176-0-0 which only supports 'normal', rejected by SDK v2).
      const preferred =
        cameras.find((cam) => cam.videos_list.some((v) => v.type !== 'normal')) ?? cameras[0];
      console.log(`[Control:AutoSelect] camera → ${preferred.index} (${preferred.name})`);
      handleCameraChange(preferred.index);
    }
  }, [cameras, selectedCameraId, handleCameraChange]);

  useEffect(() => {
    if (videos.length > 0 && !selectedVideoId) {
      console.log(`[Control:AutoSelect] video → ${videos[0].index}`);
      handleVideoChange(videos[0].index);
    }
  }, [videos, selectedVideoId, handleVideoChange]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className='bg-background text-foreground flex flex-col font-sans selection:bg-blue-500/30'>
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
              <ControlErrorBoundary section='DroneFeed'>
                {/* {isMain && (
                  <SensorToolbar
                    selectedVideoType={selectedVideoType}
                    onVideoTypeChange={handleVideoTypeChange}
                    isStreaming={isStreaming}
                  />
                )} */}
                <DroneFeed
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
                  activeStreamUrl={activeStreamUrl}
                  mediaStream={mediaStream}
                  streamConnectState={streamConnectState}
                  onReconnect={handleReconnect}
                  dockSn={dockDevice?.deviceSn}
                  payloadIndex={selectedCameraId}
                  onDeviceChange={handleDeviceChange}
                  onVideoTypeChange={handleVideoTypeChange}
                  onQualityChange={handleQualityChange}
                  onStart={handleStart}
                  onStop={handleStop}
                  latitude={droneData?.latitude}
                  longitude={droneData?.longitude}
                  className={isMain ? undefined : 'h-[342px]'}
                  isMini={!isMain}
                  isManualActive={isManualActive}
                  drcStatus={drcStatus}
                  sendJoystick={sendJoystick}
                  onManualDeactivate={() => setIsManualActive(false)}
                />
              </ControlErrorBoundary>
            );

            return (
              <div className='flex flex-row gap-4 justify-center'>
                {/* ── Main panel (left, big) + FlightControlActions below it ── */}
                <div className='relative flex-1 flex flex-col'>
                  {swapBtn(mainPanel)}
                  {mainPanel === 'viewport' && isStreaming && (
                    <button
                      onClick={handleReconnect}
                      title='Refresh feed'
                      className='absolute top-[50px] right-9 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg border backdrop-blur-sm bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/15 hover:border-white/25'
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}

                  {/* Viewport always mounted — CSS-hidden when not main.
                      Keeps the video element and WebRTC stream alive across swaps. */}
                  <div className={mainPanel !== 'viewport' ? 'hidden' : ''}>
                    {viewportPanel(true)}
                  </div>

                  {/* Main map — always mounted so MapLibre state survives panel swaps.
                      CSS-hidden when another panel is active; visible=true triggers
                      a canvas resize() after the div is revealed. */}
                  <div className={mainPanel !== 'map' ? 'hidden' : ''}>
                    <ControlErrorBoundary section='TacticalMiniMap'>
                      <TacticalMiniMap
                        droneData={droneData}
                        dockData={dockData}
                        targetLat={takeoffTarget?.lat}
                        targetLng={takeoffTarget?.lng}
                        originLat={originPoint?.lat}
                        originLng={originPoint?.lng}
                        waypoints={flightWaypoints}
                        onRightClick={handleOpenFlightCommand}
                        visible={mainPanel === 'map'}
                        mapStyle={mapStyle}
                        onMapStyleChange={handleMapStyleChange}
                        className='w-full h-[633px]'
                      />
                    </ControlErrorBoundary>
                  </div>
                  {mainPanel === 'dock' && (
                    <ControlErrorBoundary section='DockFeed'>
                      <DockFeed
                        dockDevice={dockDevice}
                        droneData={droneData}
                        dockCapacity={dockCapacity}
                        coverState={dockCoverState}
                        dockModeCode={dockModeCode}
                        onCoverChange={setCoverOpen}
                        className='w-full h-[700px]'
                      />
                    </ControlErrorBoundary>
                  )}
                  {/* Flight controls — hidden when DockFeed is the main panel */}
                  {mainPanel !== 'dock' && (
                    <FlightControlActions
                      dockSn={dockDevice?.deviceSn}
                      isFlying={isFlying}
                      dockOnline={dockOnline}
                    />
                  )}

                </div>

                {/* ── Side panels (right column) ── */}
                <aside className='flex flex-col gap-4'>
                  {/* Viewport mini always mounted — CSS-hidden when viewport is main */}
                  <div className={`relative ${mainPanel === 'viewport' ? 'hidden' : ''}`}>
                    {swapBtn('viewport')}
                    {isStreaming && (
                      <button
                        onClick={handleReconnect}
                        title='Refresh feed'
                        className='absolute top-[50px] right-9 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg border backdrop-blur-sm bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/15 hover:border-white/25'
                      >
                        <RefreshCw size={10} />
                      </button>
                    )}
                    {viewportPanel(false)}
                  </div>

                  {/* Sidebar map — always mounted, hidden when map is the main panel */}
                  <div className={`relative ${mainPanel === 'map' ? 'hidden' : ''}`}>
                    {swapBtn('map')}
                    <ControlErrorBoundary section='TacticalMiniMap'>
                      <TacticalMiniMap
                        droneData={droneData}
                        dockData={dockData}
                        targetLat={takeoffTarget?.lat}
                        targetLng={takeoffTarget?.lng}
                        originLat={originPoint?.lat}
                        originLng={originPoint?.lng}
                        waypoints={flightWaypoints}
                        onRightClick={handleOpenFlightCommand}
                        visible={mainPanel !== 'map'}
                        mapStyle={mapStyle}
                        onMapStyleChange={handleMapStyleChange}
                      />
                    </ControlErrorBoundary>
                  </div>

                  {mainPanel !== 'dock' && (
                    <div className='relative'>
                      {swapBtn('dock')}
                      <ControlErrorBoundary section='DockFeed'>
                        <DockFeed
                          dockDevice={dockDevice}
                          droneData={droneData}
                          dockCapacity={dockCapacity}
                          coverState={dockCoverState}
                          dockModeCode={dockModeCode}
                          onCoverChange={setCoverOpen}
                        />
                      </ControlErrorBoundary>
                    </div>
                  )}
                </aside>
              </div>
            );
          })()}
        </div>

        {/* WebRTC player — headless, lives here so it survives panel swaps.
            The resulting mediaStream is passed down to every DroneFeed
            instance, so both main and mini viewports share the same live feed. */}
        {activeStreamUrl && (
          <WebRTCPlayer
            key={reconnectKey}
            url={activeStreamUrl}
            onStateChange={(state) => setStreamConnectState(state)}
            onMediaStream={setMediaStream}
          />
        )}
      </main>

      <ControlErrorBoundary section='SystemStatusFooter'>
        <SystemStatusFooter
          deviceList={deviceList}
          dockSn={dockDevice?.deviceSn}
          dockOnline={dockOnline}
          dockModeCode={dockModeCode}
          joystickInvalidState={joystickInvalidState}
          droneAltitude={droneData?.altitude ?? 0}
          onTakeoffSucceeded={(lat, lng) => setTakeoffTarget({ lat, lng })}
          onOpenFlightCommand={handleOpenFlightCommand}
          drcStatus={drcStatus}
          drcActivate={drcActivate}
          drcDeactivate={drcDeactivate}
          sendEmergencyStop={sendEmergencyStop}
          isManualFlightActive={isManualActive}
          onManualFlightToggle={setIsManualActive}
        />
      </ControlErrorBoundary>

      {/* Unified flight command modal — opened via map right-click or sidebar buttons */}
      {flightCommandTarget && dockDevice?.deviceSn && (
        <FlightCommandModal
          dockSn={dockDevice.deviceSn}
          isAirborne={(droneData?.altitude ?? 0) > 60}
          initialLat={flightCommandTarget.lat}
          initialLng={flightCommandTarget.lng}
          dockLat={dockData?.latitude}
          dockLng={dockData?.longitude}
          onClose={() => setFlightCommandTarget(null)}
          onTakeoffSucceeded={(lat, lng) => {
            // Capture the dock as launch origin and start a fresh path for this mission
            setOriginPoint({ lat: dockData?.latitude ?? 0, lng: dockData?.longitude ?? 0 });
            setFlightWaypoints([]);
            setTakeoffTarget({ lat, lng });
            setFlightCommandTarget(null);
          }}
          onFlyToSucceeded={(lat, lng) => {
            // Move the current target into the waypoint history, then set the new destination
            setFlightWaypoints((prev) => [...prev, takeoffTarget ?? { lat, lng }]);
            setTakeoffTarget({ lat, lng });
            setFlightCommandTarget(null);
          }}
        />
      )}
    </div>
  );
}
