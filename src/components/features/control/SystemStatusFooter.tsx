'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  Send,
  Home,
  Camera,
  Monitor,
  Shield,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useToggleDebugMode,
  useRequestFlightAuthority,
  useRequestPayloadAuthority,
} from '@/hooks/useDJIDevices';
import { useLiveCapacity } from '@/hooks/useLiveStreams';
import { toast } from 'sonner';
import type { DJIDevice } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceRowProps {
  name: string;
  type: string;
  status: string;
  icon: React.ElementType;
}

export interface SystemStatusFooterProps {
  deviceList?: DJIDevice[];
  dockDevice?: DJIDevice;
  selectedCameraId?: string;
  selectedVideoType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deviceIcon(domain: string): React.ElementType {
  if (domain === '0') return Send;
  if (domain === '1') return Home;
  if (domain === '2') return Monitor;
  return Camera;
}

function deviceTypeLabel(domain: string): string {
  if (domain === '0') return 'UAV Platform';
  if (domain === '1') return 'Docking Station';
  if (domain === '2') return 'Remote Controller';
  return 'Payload';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DeviceRow = ({ name, type, status, icon: Icon }: DeviceRowProps) => {
  const isOnline = status === 'Online';
  return (
    <div className='flex items-center gap-3 py-2.5 border-b bg-[#33353980]/50 border-zinc-800/60 last:border-0 rounded-lg px-2'>
      <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 flex-shrink-0'>
        <Icon size={15} className='text-zinc-400' strokeWidth={1.5} />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs font-semibold text-[#E2E2E8] font-poppins leading-none mb-0.5 truncate'>
          {name}
        </p>
        <p className='text-[10px] text-zinc-500 font-poppins'>{type}</p>
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        <span className='text-[10px] font-semibold text-[#45F0CF] font-poppins border border-[#45F0CF]/30 px-2 py-0.5 rounded'>
          {status}
        </span>
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'
          }`}
        />
      </div>
    </div>
  );
};

// ─── Debug Options Panel ──────────────────────────────────────────────────────

interface DebugOptionsPanelProps {
  dockDevice?: DJIDevice;
  selectedCameraId?: string;
  selectedVideoType?: string;
}

const DebugOptionsPanel = ({
  dockDevice,
  selectedCameraId,
  selectedVideoType,
}: DebugOptionsPanelProps) => {
  const [debugModeActive, setDebugModeActive] = useState(false);
  const [flightAuthHeld, setFlightAuthHeld] = useState(false);
  const [payloadAuthHeld, setPayloadAuthHeld] = useState(false);

  const { mutate: toggleDebug, isPending: isTogglingDebug } = useToggleDebugMode();
  const { mutate: grabFlight, isPending: isGrabbingFlight } = useRequestFlightAuthority();
  const { mutate: grabPayload, isPending: isGrabbingPayload } = useRequestPayloadAuthority();

  const { data: capacityMap } = useLiveCapacity();

  const dockOnline = dockDevice?.status ?? false;
  const dockName = dockDevice?.nickname || dockDevice?.deviceName || 'No dock selected';

  // Reset all state whenever the active dock changes
  useEffect(() => {
    setDebugModeActive(false);
    setFlightAuthHeld(false);
    setPayloadAuthHeld(false);
  }, [dockDevice?.deviceSn]);

  const handleDebugToggle = (checked: boolean) => {
    if (!dockDevice) return;
    toggleDebug(
      { sn: dockDevice.deviceSn, open: checked },
      {
        onSuccess: () => {
          setDebugModeActive(checked);
          // Closing debug mode implicitly releases held authorities
          if (!checked) {
            setFlightAuthHeld(false);
            setPayloadAuthHeld(false);
          }
          toast.success(checked ? 'Debug mode enabled' : 'Debug mode disabled');
        },
        onError: (err) => toast.error(`Debug mode toggle failed: ${err.message}`),
      }
    );
  };

  const handleFlightToggle = (checked: boolean) => {
    if (!checked) {
      setFlightAuthHeld(false);
      return;
    }
    if (!dockDevice) return;
    grabFlight(dockDevice.deviceSn, {
      onSuccess: () => {
        setFlightAuthHeld(true);
        toast.success('Flight authority granted');
      },
      onError: (err) => toast.error(`Flight authority failed: ${err.message}`),
    });
  };

  const handlePayloadToggle = (checked: boolean) => {
    if (!checked) {
      setPayloadAuthHeld(false);
      return;
    }
    if (!dockDevice) return;

    const droneSn = dockDevice.childDeviceSn ?? '';
    const droneCapacity = droneSn ? capacityMap?.get(droneSn) : undefined;
    const cameras = droneCapacity?.cameras_list ?? [];
    const payloadIndex = selectedCameraId || cameras[0]?.id || '';
    const cameraType = (selectedVideoType || 'zoom') as any;

    if (!payloadIndex) {
      toast.error('No camera payload detected for this drone.');
      setTimeout(() => setPayloadAuthHeld(false), 100);
      return;
    }

    grabPayload(
      {
        sn: dockDevice.deviceSn,
        body: {
          payloadIndex,
          cameraType,
          zoomFactor: 0,
          cameraMode: '0',
          locked: true,
          pitchSpeed: 0,
          yawSpeed: 0,
          x: 0,
          y: 0,
          resetMode: '0',
          controlType: 0,
          rotation: {
            pitch: 0,
            roll: 0,
            yaw: 0,
          },
        },
      },
      {
        onSuccess: () => {
          setPayloadAuthHeld(true);
          toast.success('Payload authority granted');
        },
        onError: (err) => {
          toast.error(`Payload authority failed: ${err.message}`);
          setPayloadAuthHeld(false);
        },
      }
    );
  };

  return (
    <div className='flex flex-col flex-1 min-w-0'>
      <div className='flex flex-col gap-2 flex-1'>
        {/* Step 1: Debug Mode — no prerequisites, unlocks authority controls */}
        <div
          className={`flex items-center justify-between border rounded-lg px-4 py-3 transition-colors ${
            debugModeActive
              ? 'bg-amber-500/10 border-amber-500/40'
              : 'bg-[#13151A] border-zinc-800/50'
          }`}
        >
          <div className='flex flex-col gap-0.5'>
            <Label
              htmlFor='debug-mode'
              className='text-[11px] font-semibold text-zinc-200 cursor-pointer'
            >
              Debug Mode
            </Label>
            <span className='text-[9px] text-zinc-600'>Required before grabbing authority</span>
          </div>
          <Switch
            id='debug-mode'
            checked={debugModeActive}
            onCheckedChange={handleDebugToggle}
            disabled={!dockOnline || isTogglingDebug}
            aria-label='Toggle debug mode'
          />
        </div>

        {/* Step 2: Flight Authority */}
        <div className='flex items-center justify-between bg-[#13151A] border border-zinc-800/50 rounded-lg px-4 py-3'>
          <div className='flex flex-col gap-0.5'>
            <Label
              htmlFor='flight-auth'
              className='text-[11px] font-semibold cursor-pointer text-zinc-200'
            >
              Flight Authority
            </Label>
            <span className='text-[9px] text-zinc-600'>Exclusive drone flight control</span>
          </div>
          <Switch
            id='flight-auth'
            checked={flightAuthHeld}
            onCheckedChange={handleFlightToggle}
            disabled={!dockOnline || isGrabbingFlight}
            aria-label='Grab flight authority'
          />
        </div>

        {/* Step 3: Payload Authority */}
        <div className='flex items-center justify-between bg-[#13151A] border border-zinc-800/50 rounded-lg px-4 py-3'>
          <div className='flex flex-col gap-0.5'>
            <Label
              htmlFor='payload-auth'
              className='text-[11px] font-semibold cursor-pointer text-zinc-200'
            >
              Payload Authority
            </Label>
            <span className='text-[9px] text-zinc-600'>Camera &amp; gimbal control</span>
          </div>
          <Switch
            id='payload-auth'
            checked={payloadAuthHeld}
            onCheckedChange={handlePayloadToggle}
            disabled={!dockOnline || isGrabbingPayload}
            aria-label='Grab payload authority'
          />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SystemStatusFooter = ({
  deviceList = [],
  dockDevice,
  selectedCameraId,
  selectedVideoType,
}: SystemStatusFooterProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

  const onlineCount = deviceList.filter((d) => d.status).length;

  return (
    <div className='fixed bottom-0 left-0 lg:left-64 right-0 z-50 flex flex-col items-center pointer-events-none'>
      <div className='w-[calc(100%-48px)] bg-[#0A0C10] shadow-2xl pointer-events-auto'>
        {/* Drag handle */}
        <div
          className='flex flex-col items-center gap-1 py-2 cursor-pointer group'
          onClick={toggle}
        >
          <div className='w-12 border-t-[2px] border-zinc-600 group-hover:border-white transition-colors rounded-full' />
          <div className='w-12 border-t-[2px] border-zinc-600 group-hover:border-white transition-colors rounded-full' />
        </div>

        {/* Persistent header */}
        <div
          className='flex items-center justify-between px-8 p-4 cursor-pointer bg-[#1A1C20] rounded-t-lg'
          onClick={toggle}
        >
          <div className='flex items-center gap-3 flex-1'>
            <Shield size={16} strokeWidth={2.5} className='text-zinc-400' />
            <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
              Debug Options
            </span>
          </div>

          <div className='flex items-center justify-end w-[440px] gap-4 pl-4 border-l border-zinc-800/50'>
            <div className='flex items-center gap-3'>
              <Cpu size={16} className='text-zinc-400' strokeWidth={2.5} />
              <span className='text-sm font-black tracking-[0.2em] text-zinc-100 uppercase'>
                Network Devices
              </span>
            </div>
            <div className='px-2 py-0.5 bg-red-600/10 border border-red-600/40 rounded-md flex items-center'>
              <span className='text-[9px] font-black text-red-600 tracking-widest uppercase p-1'>
                {onlineCount} Online
              </span>
            </div>
          </div>
        </div>

        {/* Expandable drawer */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out rounded-b-lg bg-[#1A1C20] ${
            expanded ? 'max-h-[300px] opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className='flex items-stretch justify-between px-6 py-4 gap-6 h-[220px]'>
            {/* Left: Debug options with authority switches */}
            <DebugOptionsPanel
              dockDevice={dockDevice}
              selectedCameraId={selectedCameraId}
              selectedVideoType={selectedVideoType}
            />

            {/* Right: Network device list */}
            <div className='w-[440px] flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar'>
              {deviceList.length === 0 ? (
                <p className='text-center text-[10px] text-zinc-600 py-6'>No devices found</p>
              ) : (
                deviceList.map((d) => (
                  <DeviceRow
                    key={d.deviceSn}
                    name={d.nickname || d.deviceName}
                    type={deviceTypeLabel(d.domain)}
                    status={d.status ? 'Online' : 'Offline'}
                    icon={deviceIcon(d.domain)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusFooter;
