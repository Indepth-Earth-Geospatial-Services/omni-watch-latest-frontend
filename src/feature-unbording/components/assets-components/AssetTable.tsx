'use client';

import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  Wifi,
  Activity,
  Box,
  Loader2,
  AlertCircle,
  FolderOpen,
  FolderMinus,
  PlaneTakeoff,
  Link2Off,
  MoreVertical,
  X,
  AlertTriangle,
  RefreshCw,
  Download,
  Brain,
} from 'lucide-react';
import { TabType } from './AssetManagement';
import { useUnbindDevice, useDeviceOTA } from '@/hooks/useDJIDevices';
import { useDJIWebSocket } from '@/hooks/useDJIWebSocket';
import { useProjects, useUnassignDevice } from '@/hooks/useProjects';
import { useDeviceConfigs } from '@/hooks/useDeviceConfig';
const AssignProjectModal = lazy(() => import('./AssignProjectModal'));
const AIDeviceConfigModal = lazy(() => import('@/components/settings/AIDeviceConfigModal'));
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { DJIDevice } from '@/lib/types';

const isDrone = (device: DJIDevice) => device.domain === '0';
const isDock  = (device: DJIDevice) => device.domain === '1' || device.domain === '3';

interface AssetTableProps {
  activeTab: TabType;
  devices: DJIDevice[];
  isLoading: boolean;
  error: Error | null;
  searchQuery?: string;
}

const AssetTable = ({ activeTab, devices, isLoading: devicesLoading, error: devicesError, searchQuery = '' }: AssetTableProps) => {
  const { data: projectsPage } = useProjects();
  const { data: deviceConfigs = [] } = useDeviceConfigs();
  const { mutate: unassign, isPending: isUnassigning } = useUnassignDevice();
  const { mutate: unbind, isPending: isUnbinding } = useUnbindDevice();
  const { mutate: triggerOTA, isPending: isOTAPending } = useDeviceOTA();
  const { upgradeStates } = useDJIWebSocket();

  const [assignTarget, setAssignTarget] = useState<{ sn: string; name: string } | null>(null);
  const [pendingUnbind, setPendingUnbind] = useState<{ sn: string; name: string } | null>(null);
  const [pendingOTA, setPendingOTA] = useState<DJIDevice | null>(null);
  const [aiConfigTarget, setAiConfigTarget] = useState<{ sn: string; name: string } | null>(null);
  const [openMenuSn, setOpenMenuSn] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const allProjects = projectsPage?.list ?? [];

  const assignedProjectFor = (deviceSn: string) =>
    allProjects.find((p) => p.devices.some((d) => d.device.device_sn === deviceSn));

  const filtered = devices.filter((d) => {
    if (activeTab === 'Drones' && !isDrone(d)) return false;
    if (activeTab === 'Docks' && !isDock(d)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (d.nickname || d.deviceName || '').toLowerCase();
      const sn = (d.deviceSn || '').toLowerCase();
      if (!name.includes(q) && !sn.includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuSn(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuOpen = (e: React.MouseEvent, sn: string) => {
    e.stopPropagation();
    if (openMenuSn === sn) {
      setOpenMenuSn(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = rect.bottom + 6;
    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = rect.top - menuHeight - 6;
    }

    setMenuPosition({ top, right: window.innerWidth - rect.right });
    setOpenMenuSn(sn);
  };

  const activeMenuDevice = openMenuSn
    ? filtered.find((d) => d.deviceSn === openMenuSn) ?? null
    : null;

  const activeMenuProject = activeMenuDevice
    ? assignedProjectFor(activeMenuDevice.deviceSn)
    : undefined;

  return (
    <>
      {/* Desktop Table */}
      <div className='hidden md:block bg-background rounded-xl border border-border/50 overflow-hidden font-ui'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[900px]'>
            <thead>
              <tr className='border-b border-border/50 text-muted-foreground'>
                {['Asset Identity', 'Serial Number', 'Type', 'Status', 'Firmware', 'Project', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className='px-3 py-2.5 text-left text-xs font-medium'
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-border/30'>
              {devicesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className='px-3 py-2'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded bg-secondary animate-pulse' />
                        <div className='h-3 w-28 bg-secondary rounded animate-pulse' />
                      </div>
                    </td>
                    <td className='px-3 py-2'>
                      <div className='h-3 w-36 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-3 py-2'>
                      <div className='h-4 w-14 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-3 py-2'>
                      <div className='h-3 w-16 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-3 py-2'>
                      <div className='h-3 w-20 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-3 py-2'>
                      <div className='h-3 w-24 bg-secondary rounded animate-pulse' />
                    </td>
                    <td className='px-3 py-2'>
                      <div className='w-7 h-7 bg-secondary rounded-md animate-pulse' />
                    </td>
                  </tr>
                ))
              ) : devicesError ? (
                <tr>
                  <td colSpan={7} className='px-3 py-14 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <AlertCircle className='w-7 h-7 text-red-400' />
                      <span className='text-sm text-muted-foreground'>Failed to load devices</span>
                      <span className='text-xs text-red-400/80 font-mono max-w-[380px] text-center px-4'>
                        {devicesError.message}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-3 py-14 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <PlaneTakeoff className='w-7 h-7 text-muted-foreground' />
                      <span className='text-sm text-muted-foreground'>No devices found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((device, idx) => {
                  const drone = isDrone(device);
                  const online = device.status;
                  const assignedProject = assignedProjectFor(device.deviceSn);

                  return (
                    <tr
                      key={device.deviceSn ?? `device-${idx}`}
                      className='hover:bg-secondary/50 transition-colors group'
                    >
                      {/* Asset Identity */}
                      <td className='px-3 py-2'>
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded bg-secondary border border-border flex items-center justify-center'>
                            {drone ? (
                              <Activity size={16} className='text-blue-400' />
                            ) : (
                              <Box size={16} className='text-cyan-400' />
                            )}
                          </div>
                          <span className='text-sm font-semibold text-foreground'>
                            {device.nickname || device.deviceName || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className='px-3 py-2'>
                        <span className='text-[11px] font-mono text-muted-foreground'>{device.deviceSn}</span>
                      </td>

                      {/* Type */}
                      <td className='px-3 py-2'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            drone
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          }`}
                        >
                          {drone ? 'Drone' : isDock(device) ? 'Dock' : 'Other'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className='px-3 py-2'>
                        <div className='flex items-center gap-2'>
                          <Wifi
                            size={13}
                            className={online ? 'text-emerald-400' : 'text-muted-foreground'}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              online ? 'text-emerald-400' : 'text-muted-foreground'
                            }`}
                          >
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>

                      {/* Firmware */}
                      <td className='px-3 py-2'>
                        {(() => {
                          const upgrade = upgradeStates.get(device.deviceSn);
                          if (upgrade) {
                            const pct = upgrade.host.progress.percent;
                            const step = upgrade.host.progress.step_key;
                            return (
                              <div className='space-y-1 min-w-[100px]'>
                                <div className='flex items-center gap-1.5'>
                                  <Download size={11} className='text-blue-400 animate-pulse' />
                                  <span className='text-[10px] text-blue-400 font-semibold capitalize'>
                                    {step}… {pct}%
                                  </span>
                                </div>
                                <div className='w-full h-1 bg-secondary rounded-full overflow-hidden'>
                                  <div
                                    className='h-full bg-blue-500 rounded-full transition-all duration-300'
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          }
                          return (
                            <span className='text-[11px] font-mono text-muted-foreground'>
                              {device.firmwareVersion || '—'}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Project */}
                      <td className='px-3 py-2'>
                        {assignedProject ? (
                          <div className='flex items-center gap-1.5'>
                            <FolderOpen size={12} className='text-theme-accent' />
                            <span className='text-xs font-semibold text-theme-accent'>
                              {assignedProject.name}
                            </span>
                          </div>
                        ) : (
                          <span className='text-xs text-muted-foreground italic'>Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className='px-3 py-2'>
                        <button
                          onClick={(e) => handleMenuOpen(e, device.deviceSn)}
                          className={`p-1.5 rounded-md border transition-colors ${
                            openMenuSn === device.deviceSn
                              ? 'bg-muted border-border text-foreground'
                              : 'bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border'
                          }`}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className='md:hidden space-y-3 font-ui'>
        {devicesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='bg-card rounded-lg border border-border/50 p-4 space-y-3 animate-pulse'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded bg-secondary' />
                  <div className='h-4 w-24 bg-secondary rounded' />
                </div>
                <div className='w-6 h-6 bg-secondary rounded' />
              </div>
              <div className='grid grid-cols-2 gap-2 pt-2 border-t border-border/30'>
                <div className='h-3 w-16 bg-secondary rounded' />
                <div className='h-3 w-20 bg-secondary rounded' />
                <div className='h-3 w-16 bg-secondary rounded' />
                <div className='h-3 w-20 bg-secondary rounded' />
              </div>
            </div>
          ))
        ) : devicesError ? (
          <div className='bg-card rounded-lg border border-border/50 p-8 text-center'>
            <AlertCircle className='w-7 h-7 text-red-400 mx-auto mb-2' />
            <p className='text-sm text-muted-foreground'>Failed to load devices</p>
            <p className='text-xs text-red-400/80 font-mono mt-1'>{devicesError.message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className='bg-card rounded-lg border border-border/50 p-8 text-center'>
            <PlaneTakeoff className='w-7 h-7 text-muted-foreground mx-auto mb-2' />
            <p className='text-sm text-muted-foreground'>No devices found.</p>
          </div>
        ) : (
          filtered.map((device, idx) => {
            const drone = isDrone(device);
            const online = device.status;
            const assignedProject = assignedProjectFor(device.deviceSn);
            const upgrade = upgradeStates.get(device.deviceSn);

            return (
              <div
                key={device.deviceSn ?? `device-card-${idx}`}
                className='bg-card rounded-lg border border-border/50 p-4 space-y-3'
              >
                {/* Header */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0'>
                      {drone ? (
                        <Activity size={14} className='text-blue-400' />
                      ) : (
                        <Box size={14} className='text-cyan-400' />
                      )}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-foreground truncate'>
                        {device.nickname || device.deviceName || '—'}
                      </p>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border mt-0.5 ${
                          drone
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {drone ? 'Drone' : isDock(device) ? 'Dock' : 'Other'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleMenuOpen(e, device.deviceSn)}
                    className={`p-1.5 rounded-md border transition-colors ${
                      openMenuSn === device.deviceSn
                        ? 'bg-muted border-border text-foreground'
                        : 'bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border'
                    }`}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>

                {/* Details Grid */}
                <div className='grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-border/30 text-xs'>
                  <div>
                    <span className='text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block'>Serial Number</span>
                    <span className='font-mono text-foreground truncate block mt-0.5'>{device.deviceSn}</span>
                  </div>

                  <div>
                    <span className='text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block'>Status</span>
                    <div className='flex items-center gap-1.5 mt-0.5'>
                      <Wifi size={12} className={online ? 'text-emerald-400' : 'text-muted-foreground'} />
                      <span className={`font-semibold ${online ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className='text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block'>Firmware</span>
                    <div className='mt-0.5'>
                      {upgrade ? (
                        <div className='space-y-1'>
                          <span className='text-[9px] text-blue-400 font-semibold capitalize animate-pulse'>
                            {upgrade.host.progress.step_key}… {upgrade.host.progress.percent}%
                          </span>
                          <div className='w-full h-1 bg-secondary rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-blue-500 rounded-full'
                              style={{ width: `${upgrade.host.progress.percent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className='font-mono text-foreground'>{device.firmwareVersion || '—'}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className='text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block'>Project</span>
                    <div className='mt-0.5'>
                      {assignedProject ? (
                        <span className='font-semibold text-theme-accent truncate block'>
                          {assignedProject.name}
                        </span>
                      ) : (
                        <span className='text-muted-foreground italic block'>Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fixed-position action dropdown */}
      {activeMenuDevice && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.top, right: menuPosition.right }}
          className='fixed z-[9999] w-52 bg-card border border-border rounded-xl shadow-2xl shadow-black/60 font-ui overflow-hidden'
        >
          <div className='px-3.5 py-2.5 border-b border-border'>
            <p className='text-[9px] font-semibold uppercase tracking-wider text-muted-foreground'>Device</p>
            <p className='text-xs font-semibold text-foreground truncate mt-0.5'>
              {activeMenuDevice.nickname || activeMenuDevice.deviceName || activeMenuDevice.deviceSn}
            </p>
          </div>

          <div className='p-1.5 space-y-0.5 border-b border-border'>
            <button
              onClick={() => {
                setOpenMenuSn(null);
                setAssignTarget({
                  sn: activeMenuDevice.deviceSn,
                  name: activeMenuDevice.nickname || activeMenuDevice.deviceName || activeMenuDevice.deviceSn,
                });
              }}
              disabled={!!activeMenuProject}
              title={activeMenuProject ? 'Already assigned to a project' : undefined}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-theme-accent hover:bg-theme-accent/10 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed'
            >
              <FolderOpen size={13} className='flex-shrink-0' />
              Assign to Project
            </button>

            <button
              onClick={() => {
                if (!activeMenuProject) return;
                setOpenMenuSn(null);
                unassign({ projectId: activeMenuProject.id, deviceSn: activeMenuDevice.deviceSn });
              }}
              disabled={!activeMenuProject || isUnassigning}
              title={!activeMenuProject ? 'Not assigned to any project' : undefined}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed'
            >
              {isUnassigning ? (
                <Loader2 size={13} className='flex-shrink-0 animate-spin' />
              ) : (
                <FolderMinus size={13} className='flex-shrink-0' />
              )}
              Unassign from Project
            </button>
          </div>

          <div className='p-1.5 border-b border-border'>
            <button
              onClick={() => {
                setOpenMenuSn(null);
                setPendingOTA(activeMenuDevice);
              }}
              disabled={!!upgradeStates.get(activeMenuDevice.deviceSn)}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed'
            >
              {upgradeStates.get(activeMenuDevice.deviceSn) ? (
                <Loader2 size={13} className='flex-shrink-0 animate-spin' />
              ) : (
                <RefreshCw size={13} className='flex-shrink-0' />
              )}
              Update Firmware
            </button>
          </div>

          <div className='p-1.5 border-b border-border'>
            <button
              onClick={() => {
                setOpenMenuSn(null);
                setAiConfigTarget({
                  sn: activeMenuDevice.deviceSn,
                  name: activeMenuDevice.nickname || activeMenuDevice.deviceName || activeMenuDevice.deviceSn,
                });
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-violet-400 hover:bg-violet-500/10 transition-colors text-left'
            >
              <Brain size={13} className='flex-shrink-0' />
              AI Settings
            </button>
          </div>

          <div className='p-1.5'>
            <button
              onClick={() => {
                setOpenMenuSn(null);
                setPendingUnbind({
                  sn: activeMenuDevice.deviceSn,
                  name: activeMenuDevice.nickname || activeMenuDevice.deviceName || activeMenuDevice.deviceSn,
                });
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left'
            >
              <Link2Off size={13} className='flex-shrink-0' />
              Unbind Device
            </button>
          </div>
        </div>
      )}

      {/* OTA firmware update confirmation modal */}
      {pendingOTA && createPortal(
        <div className='fixed inset-0 z-[9999] flex items-center justify-center font-ui'>
          <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={() => setPendingOTA(null)} />
          <div className='relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-xl shadow-2xl shadow-black/60'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg'>
                  <RefreshCw size={15} className='text-emerald-400' />
                </div>
                <div>
                  <h2 className='text-sm font-bold text-foreground'>Update Firmware</h2>
                  <p className='text-[11px] text-muted-foreground truncate max-w-[180px]'>
                    {pendingOTA.nickname || pendingOTA.deviceName || pendingOTA.deviceSn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingOTA(null)}
                className='p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors'
              >
                <X size={15} />
              </button>
            </div>
            <div className='px-5 py-4 space-y-3'>
              <p className='text-sm text-muted-foreground'>
                Send a firmware update request to this device. The RC will prompt the operator to confirm and begin downloading.
              </p>
              <div className='bg-secondary border border-border rounded-lg px-4 py-3 space-y-1'>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>Current version</p>
                <p className='text-xs font-mono text-foreground'>{pendingOTA.firmwareVersion || '—'}</p>
              </div>
            </div>
            <div className='flex items-center gap-2 px-5 py-4 border-t border-border'>
              <button
                onClick={() => setPendingOTA(null)}
                className='flex-1 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:border-border hover:text-foreground transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pendingOTA) return;
                  triggerOTA(
                    [
                      {
                        deviceName: pendingOTA.deviceName,
                        sn: pendingOTA.deviceSn,
                        productVersion: pendingOTA.firmwareVersion ?? '',
                        firmwareUpgradeType: 1,
                      },
                    ],
                    {
                      onSuccess: () => {
                        toast.success('Firmware update sent — confirm on the RC screen');
                        setPendingOTA(null);
                      },
                      onError: (err) => {
                        toast.error(`Update failed: ${err.message}`);
                      },
                    }
                  );
                }}
                disabled={isOTAPending}
                className='flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isOTAPending ? <Loader2 size={12} className='animate-spin' /> : <RefreshCw size={12} />}
                Send Update
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Unbind confirmation modal */}
      {pendingUnbind && createPortal(
        <div className='fixed inset-0 z-[9999] flex items-center justify-center font-ui'>
          <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={() => setPendingUnbind(null)} />
          <div className='relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-xl shadow-2xl shadow-black/60'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-500/10 border border-red-500/20 rounded-lg'>
                  <AlertTriangle size={15} className='text-red-400' />
                </div>
                <div>
                  <h2 className='text-sm font-bold text-foreground'>Unbind Device</h2>
                  <p className='text-[11px] text-muted-foreground truncate max-w-[180px]'>{pendingUnbind.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPendingUnbind(null)}
                className='p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors'
              >
                <X size={15} />
              </button>
            </div>

            <div className='px-5 py-4 space-y-2'>
              <p className='text-sm text-muted-foreground'>
                Are you sure you want to unbind this device from the workspace?
              </p>
              <p className='text-xs text-muted-foreground'>
                The device will be removed from all projects and will need to be re-bound to appear again.
              </p>
            </div>

            <div className='flex items-center gap-2 px-5 py-4 border-t border-border'>
              <button
                onClick={() => setPendingUnbind(null)}
                className='flex-1 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:border-border hover:text-foreground transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  unbind(pendingUnbind.sn, { onSettled: () => setPendingUnbind(null) });
                }}
                disabled={isUnbinding}
                className='flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isUnbinding ? <Loader2 size={12} className='animate-spin' /> : <Link2Off size={12} />}
                Unbind
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assign-to-project modal */}
      {assignTarget && (
        <Suspense fallback={null}>
          <AssignProjectModal
            deviceSn={assignTarget.sn}
            deviceName={assignTarget.name}
            onClose={() => setAssignTarget(null)}
          />
        </Suspense>
      )}

      {/* AI device config modal */}
      {aiConfigTarget && (
        <Suspense fallback={null}>
          {(() => {
            const deviceConfig = deviceConfigs.find((c) => c.device_sn === aiConfigTarget.sn);
            return (
              <AIDeviceConfigModal
                open={!!aiConfigTarget}
                onClose={() => setAiConfigTarget(null)}
                device={deviceConfig ?? {
                  device_sn: aiConfigTarget.sn,
                  name: aiConfigTarget.name,
                  targetClasses: '[]',
                  isActive: true,
                  ai_enabled: false,
                  created_at: '',
                  updated_at: '',
                }}
              />
            );
          })()}
        </Suspense>
      )}
    </>
  );
};

export default AssetTable;
