'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import TelemetryHeader from '@/components/features/control/TelemetryHeader';
import FlightStatsBar from '@/components/features/control/FlightStatsBar';
import MissionControlViewport from '@/components/features/control/MissionControlViewport';
import { WebRTCPlayer } from '@/components/features/streams/WebRTCPlayer';
import type { StreamState } from '@/components/features/streams/WebRTCPlayer';
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
import { useProject } from '@/providers/ProjectProvider';
import { toast } from 'sonner';
import type { LiveCapacity } from '@/lib/types';

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

  // ─── Device & telemetry data ───────────────────────────────────────────────
  const { getProcessedDroneData } = useTelemetry();
  const { data: deviceList = [] } = useDJIDevices();
  const { user } = useAuth();

  // ─── Panel layout state ────────────────────────────────────────────────────
  const [mainPanel, setMainPanel] = useState<PanelId>('viewport');

  // ─── Project & Device state ───────────────────────────────────────────────
  const { activeProject } = useProject();
  const projectSnSet = useMemo(
    () => new Set(activeProject?.devices.map((d) => d.device_sn) ?? []),
    [activeProject]
  );

  // ─── Drone selection state ─────────────────────────────────────────────────
  // The operator selects a DRONE directly. The parent Dock SN is derived automatically.
  // All stream operations use the drone SN; all authority/control ops use the dock SN.
  const [selectedDroneSn, setSelectedDroneSn] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState('');
  const [streamQuality, setStreamQuality] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStreamVideoId, setActiveStreamVideoId] = useState('');
  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [streamConnectState, setStreamConnectState] = useState<StreamState | null>(null);

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

  // ─── Drone-first derivations ────────────────────────────────────────────────

  // All online docks in the workspace (domain 1 or 3 depending on DJI deployment)
  const docks = useMemo(
    () => deviceList.filter((d) => d.domain === '1' || d.domain === '3'),
    [deviceList]
  );

  // All online drones in the workspace (domain === '0') that are in the active project
  const projectDrones = useMemo(
    () => deviceList.filter((d) => d.domain === '0' && (projectSnSet.size === 0 || projectSnSet.has(d.deviceSn))),
    [deviceList, projectSnSet]
  );

  // The dock associated with the selected drone
  const selectedDock = useMemo(
    () => docks.find((d) => d.childDeviceSn === selectedDroneSn) ?? null,
    [docks, selectedDroneSn]
  );

  // Drone Sn equals selectedDroneSn
  const droneSn = selectedDroneSn;

  // Drone-shaped list for the device dropdown — shows drone names, values are drone SNs
  const droneDropdownList = useMemo<LiveCapacity[]>(
    () =>
      projectDrones.map((d) => ({
        sn: d.deviceSn,
        name: d.nickname || d.deviceName || d.deviceSn,
        cameras_list: [],
      })),
    [projectDrones]
  );

  // Drone's live capacity — indexed by drone SN (NOT dock SN)
  const droneCapacity = droneSn ? capacityMap?.get(droneSn) : undefined;
  const cameras = droneCapacity?.cameras_list ?? [];
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId);
  const videos = selectedCamera?.videos_list ?? [];
  const videoTypes: string[] = [];

  // Dock/drone references for header, telemetry, and control panels
  const dockDevice = selectedDock ?? undefined;
  const dockName = dockDevice?.nickname || dockDevice?.deviceName;

  // Drone telemetry (GPS, battery, mode) — keyed by drone SN
  const droneData = droneSn ? getProcessedDroneData(droneSn) : null;
  const isFlying = droneData ? droneData.modeCode !== 0 : false;

  // ─── Diagnostic logs (control page only) ──────────────────────────────────
  useEffect(() => {
    console.log(
      `[Control] project drones available: ${projectDrones.length}`,
      projectDrones.map((d) => `${d.nickname || d.deviceSn} (${d.status ? 'online' : 'offline'})`)
    );
  }, [projectDrones]);

  useEffect(() => {
    if (!selectedDroneSn) return;
    console.log(
      `[Control] drone selected: ${selectedDroneSn} → parent dock Sn: ${selectedDock?.deviceSn || '(none)'}`
    );
  }, [selectedDroneSn, selectedDock]);

  useEffect(() => {
    if (!droneSn) return;
    console.log(
      `[Control] drone capacity — cameras: ${droneCapacity?.cameras_list?.length ?? 0}`,
      droneCapacity?.cameras_list?.map(
        (c) => `${c.name || c.index} (${c.videos_list?.length ?? 0} videos)`
      ) ?? 'no capacity yet'
    );
  }, [droneSn, droneCapacity]);

  useEffect(() => {
    if (!isStreaming) return;
    console.log(
      `[Control] stream active — videoId: ${activeStreamVideoId}, url: ${activeStreamUrl}`
    );
  }, [isStreaming, activeStreamVideoId, activeStreamUrl]);

  useEffect(() => {
    if (!streamConnectState) return;
    console.log(`[Control] WebRTC state: ${streamConnectState}`);
  }, [streamConnectState]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleDeviceChange = useCallback((droneSn: string) => {
    setSelectedDroneSn(droneSn);
    setSelectedCameraId('');
    setSelectedVideoId('');
    setSelectedVideoType('');
    setActiveStreamVideoId('');
    setActiveStreamUrl('');
    setIsStreaming(false);
  }, []);

  // Automatically select camera, video source, and quality when selected drone/capacity changes
  useEffect(() => {
    if (isStreaming || !selectedDroneSn) return;

    const droneCapacity = capacityMap?.get(selectedDroneSn);
    if (!droneCapacity) return;

    const camera = droneCapacity.cameras_list?.[0];
    if (camera) {
      setSelectedCameraId(camera.id);
      
      const video = camera.videos_list?.[0];
      if (video) {
        setSelectedVideoId(video.id);
        setSelectedVideoType(video.type || '');
      }
    }
    setStreamQuality(0); // Auto quality
  }, [selectedDroneSn, capacityMap, isStreaming]);

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
      setSelectedVideoType(video?.type ?? '');
    },
    [videos]
  );

  const handleStart = useCallback(() => {
    if (!selectedVideoId || !selectedVideoType) {
      toast.error('Select a dock, camera, and video source first');
      return;
    }
    if (!droneSn) {
      toast.error('No drone attached to this dock');
      return;
    }
    const video = videos.find((v) => v.id === selectedVideoId);
    // composite video_id always uses the DRONE's SN
    const compositeId =
      selectedCamera && video ? `${droneSn}/${selectedCamera.index}/${video.index}` : null;
    if (!compositeId) {
      toast.error('Could not resolve video ID — try re-selecting the dock');
      return;
    }
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
          setIsStreaming(true);
          setActiveStreamVideoId(compositeId);
          setActiveStreamUrl(data?.url ?? '');
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
    droneSn,
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className='bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30'>
      {/* Persistent WebRTC connection — survives panel switches */}
      {activeStreamUrl && (
        <WebRTCPlayer
          url={activeStreamUrl}
          onStateChange={setStreamConnectState}
          onMediaStream={setMediaStream}
        />
      )}

      <main className='flex-1 flex flex-col items-center py-4 px-6 pb-[80px] overflow-y-auto overflow-x-hidden'>
        <div className='w-full space-y-4'>
          <section className='space-y-2'>
            <TelemetryHeader
              deviceName={dockDevice?.nickname || dockDevice?.deviceName}
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

            // Drone feed panel — shows Matrice 4TD camera via drone SN capacity
            const viewportPanel = (isMain: boolean) => (
              <MissionControlViewport
                devices={droneDropdownList}
                cameras={cameras}
                videos={videos}
                videoTypes={videoTypes}
                selectedSn={selectedDroneSn}
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
                mediaStream={mediaStream}
                streamConnectState={streamConnectState}
                dockSn={dockDevice?.deviceSn}
                droneSn={droneSn}
                className={isMain ? undefined : 'h-[342px]'}
                compact={!isMain}
              />
            );

            const sidePanelIds = (['viewport', 'map', 'dock'] as const).filter(
              (p) => p !== mainPanel
            );

            return (
              <div className='flex flex-row gap-4 justify-center'>
                {/* Main panel */}
                <div className='relative flex-1 min-w-0'>
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

                {/* Side panels */}
                <aside className='flex flex-col gap-4 w-[316px] flex-shrink-0'>
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
        dockDevice={dockDevice}
        selectedCameraId={selectedCameraId}
        selectedVideoType={selectedVideoType}
      />
    </div>
  );
}
