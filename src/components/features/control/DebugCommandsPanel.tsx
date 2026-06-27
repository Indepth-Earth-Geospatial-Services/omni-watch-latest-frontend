'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useExecuteJob, useRequestFlightAuthority } from '@/hooks/useDockController';
import type { JoystickInvalidState } from '@/hooks/useDockMQTT';
import { useDRC } from '@/hooks/useDRC';
import { DOCK_MODE_LABELS } from './ControlShared';
import { DebugActivationModal } from './DebugActivationModal';
import { DebugModeTab } from './DebugModeTab';
import { FlightAuthorityTab } from './FlightAuthorityTab';

export interface DebugCommandsPanelProps {
  dockSn: string;
  dockOnline: boolean;
  dockModeCode?: number;
  joystickInvalidState?: JoystickInvalidState | null;
  droneAltitude?: number;
  onTakeoffSucceeded?: (lat: number, lng: number) => void;
}

export const DebugCommandsPanel = ({
  dockSn,
  dockOnline,
  dockModeCode = -1,
  joystickInvalidState,
  droneAltitude = 0,
  onTakeoffSucceeded,
}: DebugCommandsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'debug' | 'flight'>('debug');
  const [debugActive, setDebugActive] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [flightAuth, setFlightAuth] = useState(false);
  const [isGrabbingAuth, setIsGrabbingAuth] = useState(false);
  const [confirmPending, setConfirmPending] = useState<string | null>(null);

  // DRC lives here so it persists across tab switches within the Command & Control drawer.
  // FlightAuthorityTab unmounts when the user switches to the Debug tab — keeping the hook
  // one level up means the MQTT channel (and emergency stop) stays alive.
  const {
    status: drcStatus,
    activate: drcActivate,
    deactivate: drcDeactivate,
    sendEmergencyStop,
  } = useDRC();

  // Trigger DRC connection when dock becomes ready. drcActivate is idempotent —
  // if already connected it returns immediately, so dockOnline fluctuations are harmless.
  // No cleanup here: a brief dockOnline flicker must NOT disconnect the MQTT session.
  useEffect(() => {
    if (!dockSn || !dockOnline) return;
    drcActivate(dockSn).catch((err: Error) => {
      console.warn('[DRC] Auto-activate failed:', err.message);
    });
  }, [dockSn, dockOnline]); // intentionally no cleanup

  // Disconnect only when the selected dock changes or this panel unmounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      drcDeactivate();
    };
  }, [dockSn]);

  // Sync debug state from MQTT mode_code — skip while a toggle is in-flight
  useEffect(() => {
    if (dockModeCode === -1) return;
    if (isToggling) return;
    console.log(
      `[Debug:MQTT] mode_code=${dockModeCode} (${DOCK_MODE_LABELS[dockModeCode] ?? 'unknown'}) → debugActive=${dockModeCode === 2}`
    );
    setDebugActive(dockModeCode === 2);
  }, [dockModeCode, isToggling]);

  // Auto-revoke flight authority when dock fires joystick_invalid_notify
  useEffect(() => {
    if (joystickInvalidState) setFlightAuth(false);
  }, [joystickInvalidState?.ts]);

  const { mutate: runJob, isPending } = useExecuteJob(dockSn);
  const { mutate: grabAuthority } = useRequestFlightAuthority(dockSn);

  const exec = useCallback(
    (serviceIdentifier: string, body?: object) => {
      const payload = { action: 0, ...body };
      runJob(
        { serviceIdentifier, body: payload },
        {
          onSuccess: () => toast.success(`${serviceIdentifier.replace(/_/g, ' ')} sent`),
          onError: (err) => toast.error(`Command failed: ${err.message}`),
        }
      );
    },
    [runJob]
  );

  const handleDangerClick = useCallback(
    (serviceIdentifier: string) => {
      if (confirmPending === serviceIdentifier) {
        setConfirmPending(null);
        exec(serviceIdentifier);
      } else {
        setConfirmPending(serviceIdentifier);
        setTimeout(() => setConfirmPending(null), 3000);
      }
    },
    [confirmPending, exec]
  );

  const handleDebugToggle = useCallback(
    (on: boolean) => {
      console.log(
        `[Debug] toggle → on=${on} | dockOnline=${dockOnline} | dockModeCode=${dockModeCode} | dockSn=${dockSn}`
      );
      if (!dockOnline) {
        console.warn('[Debug] aborted — dock is offline');
        return;
      }
      setIsToggling(true);
      if (on) {
        console.log('[Debug] step 1 — grabbing flight authority…');
        grabAuthority(undefined, {
          onSuccess: () => {
            console.log('[Debug] step 2 — authority granted, sending debug_mode_open…');
            runJob(
              { serviceIdentifier: 'debug_mode_open', body: { action: 1 } },
              {
                onSuccess: () => {
                  console.log('[Debug] step 3 — debug_mode_open accepted ✓');
                  setDebugActive(true);
                  setIsToggling(false);
                  toast.success('Debug mode enabled');
                },
                onError: (err) => {
                  console.error('[Debug] debug_mode_open failed:', err.message);
                  setIsToggling(false);
                  toast.error(`Debug mode failed: ${err.message}`);
                },
              }
            );
          },
          onError: (err) => {
            console.error('[Debug] grabAuthority failed:', err.message);
            setIsToggling(false);
            toast.error(`Authority grab failed: ${err.message}`);
          },
        });
      } else {
        console.log('[Debug] sending debug_mode_close…');
        runJob(
          { serviceIdentifier: 'debug_mode_close', body: { action: 0 } },
          {
            onSuccess: () => {
              console.log('[Debug] debug_mode_close accepted ✓');
              setDebugActive(false);
              setIsToggling(false);
              setConfirmPending(null);
              toast.success('Debug mode disabled');
            },
            onError: (err) => {
              console.error('[Debug] debug_mode_close failed:', err.message);
              setIsToggling(false);
              toast.error(`Debug mode failed: ${err.message}`);
            },
          }
        );
      }
    },
    [dockOnline, dockModeCode, dockSn, grabAuthority, runJob]
  );

  const handleFlightAuthToggle = useCallback(
    (on: boolean) => {
      if (!dockOnline) return;
      if (!on) {
        setFlightAuth(false);
        toast.info('Flight authority released locally — pilot can reclaim via stick input');
        return;
      }
      setIsGrabbingAuth(true);
      grabAuthority(undefined, {
        onSuccess: () => {
          setFlightAuth(true);
          setIsGrabbingAuth(false);
          toast.success('Flight authority granted — cloud controls drone');
        },
        onError: (err) => {
          setIsGrabbingAuth(false);
          toast.error(`Flight authority failed: ${err.message}`);
        },
      });
    },
    [dockOnline, grabAuthority]
  );

  const restricted = !debugActive || !dockOnline;

  return (
    <div className='flex flex-col gap-0 pb-2'>
      {/* ── Tab bar ── */}
      <div className='flex gap-1 mb-3 bg-[#0D0F14] rounded-lg p-1 flex-shrink-0'>
        <button
          onClick={() => setActiveTab('debug')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-150 ${
            activeTab === 'debug'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
              debugActive ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-zinc-700'
            }`}
          />
          Debug Mode
        </button>
        <button
          onClick={() => setActiveTab('flight')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-150 ${
            activeTab === 'flight'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
              : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
              flightAuth ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-zinc-700'
            }`}
          />
          Flight Authority
        </button>
      </div>

      {/* ── Active tab content ── */}
      {activeTab === 'debug' && (
        <DebugModeTab
          debugActive={debugActive}
          isToggling={isToggling}
          dockOnline={dockOnline}
          dockModeCode={dockModeCode}
          isPending={isPending}
          restricted={restricted}
          confirmPending={confirmPending}
          exec={exec}
          handleDangerClick={handleDangerClick}
          onToggle={(on) => (on ? setShowDebugModal(true) : handleDebugToggle(false))}
        />
      )}
      {activeTab === 'flight' && (
        <FlightAuthorityTab
          dockSn={dockSn}
          flightAuth={flightAuth}
          isGrabbingAuth={isGrabbingAuth}
          dockOnline={dockOnline}
          joystickInvalidState={joystickInvalidState}
          isPending={isPending}
          onToggle={handleFlightAuthToggle}
          exec={exec}
          droneAltitude={droneAltitude}
          onTakeoffSucceeded={onTakeoffSucceeded}
          drcStatus={drcStatus}
          drcActivate={drcActivate}
          drcDeactivate={drcDeactivate}
          sendEmergencyStop={sendEmergencyStop}
        />
      )}

      {/* ── Debug activation modal ── */}
      {showDebugModal && (
        <DebugActivationModal
          onClose={() => setShowDebugModal(false)}
          onConfirm={() => {
            setShowDebugModal(false);
            handleDebugToggle(true);
          }}
        />
      )}
    </div>
  );
};
