'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { TabType } from './AssetManagement';
import { useDJIDevices, useUnbindDevice } from '@/hooks/useDJIDevices';
import { useProjects, useUnassignDevice } from '@/hooks/useProjects';
import AssignProjectModal from './AssignProjectModal';
import type { DJIDevice } from '@/lib/types';

// domain "0" = aircraft/drone; everything else (docks, RCs, payloads) treated as non-drone
const isDrone = (device: DJIDevice) => device.domain === '0';

const AssetTable = ({ activeTab }: { activeTab: TabType }) => {
  const { data: devices = [], isLoading: devicesLoading, error: devicesError } = useDJIDevices();
  const { data: projectsPage } = useProjects();
  const { mutate: unassign, isPending: isUnassigning, variables: unassignVars } = useUnassignDevice();
  const { mutate: unbind, isPending: isUnbinding, variables: unbindVars } = useUnbindDevice();

  const [assignTarget, setAssignTarget] = useState<{ sn: string; name: string } | null>(null);

  const allProjects = projectsPage?.list ?? [];

  // Find which project (if any) a device is assigned to
  const assignedProjectFor = (deviceSn: string) =>
    allProjects.find((p) => p.devices.some((d) => d.device_sn === deviceSn));

  const filtered = devices.filter((d) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Drones') return isDrone(d);
    if (activeTab === 'Docks') return !isDrone(d);
    return true;
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (devicesLoading) {
    return (
      <div className='w-[calc(100%-1rem)] bg-[#1D2026] rounded-lg border border-zinc-800/50 mx-2 flex items-center justify-center h-64 gap-3'>
        <Loader2 className='w-6 h-6 text-[#1C93FF] animate-spin' />
        <span className='text-sm text-zinc-500'>Loading devices…</span>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (devicesError) {
    return (
      <div className='w-[calc(100%-1rem)] bg-[#1D2026] rounded-lg border border-zinc-800/50 mx-2 flex flex-col items-center justify-center h-64 gap-3'>
        <AlertCircle className='w-7 h-7 text-red-400' />
        <span className='text-sm text-zinc-400'>Failed to load devices</span>
        <span className='text-xs text-zinc-600 max-w-[280px] text-center'>{devicesError.message}</span>
      </div>
    );
  }

  return (
    <>
      <div className='w-[calc(100%-1rem)] overflow-hidden bg-[#1D2026] rounded-lg border border-zinc-800/50 shadow-2xl mx-2 font-poppins'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[900px]'>
            <thead>
              <tr className='border-b border-zinc-800/50 bg-[#191C22]'>
                {['Asset Identity', 'Serial Number', 'Type', 'Status', 'Firmware', 'Project', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className='px-5 py-4 text-[10px] font-black tracking-[0.18em] text-zinc-500 uppercase'
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800/30'>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-5 py-14 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <PlaneTakeoff className='w-7 h-7 text-zinc-700' />
                      <span className='text-sm text-zinc-600'>No devices found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((device) => {
                  const drone = isDrone(device);
                  const online = device.status;
                  const assignedProject = assignedProjectFor(device.deviceSn);
                  const isThisUnassigning =
                    isUnassigning && unassignVars?.deviceSn === device.deviceSn;
                  const isThisUnbinding =
                    isUnbinding && unbindVars === device.deviceSn;

                  return (
                    <tr
                      key={device.deviceSn}
                      className='hover:bg-white/[0.02] transition-colors group'
                    >
                      {/* Asset Identity */}
                      <td className='px-5 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center'>
                            {drone ? (
                              <Activity size={16} className='text-blue-400' />
                            ) : (
                              <Box size={16} className='text-cyan-400' />
                            )}
                          </div>
                          <span className='text-sm font-bold text-zinc-100'>
                            {device.nickname || device.deviceName || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className='px-5 py-4'>
                        <span className='text-[11px] font-mono text-zinc-400'>{device.deviceSn}</span>
                      </td>

                      {/* Type */}
                      <td className='px-5 py-4'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${
                            drone
                              ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                              : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400'
                          }`}
                        >
                          {drone ? 'Drone' : 'Dock / Other'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className='px-5 py-4'>
                        <div className='flex items-center gap-2'>
                          <Wifi
                            size={13}
                            className={online ? 'text-emerald-400' : 'text-zinc-600'}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              online ? 'text-emerald-400' : 'text-zinc-600'
                            }`}
                          >
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>

                      {/* Firmware */}
                      <td className='px-5 py-4'>
                        <span className='text-[11px] font-mono text-zinc-400'>
                          {device.firmwareVersion || '—'}
                        </span>
                      </td>

                      {/* Project */}
                      <td className='px-5 py-4'>
                        {assignedProject ? (
                          <div className='flex items-center gap-1.5'>
                            <FolderOpen size={12} className='text-[#1C93FF]' />
                            <span className='text-xs font-semibold text-[#1C93FF]'>
                              {assignedProject.name}
                            </span>
                          </div>
                        ) : (
                          <span className='text-xs text-zinc-600 italic'>Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className='px-5 py-4'>
                        <div className='flex items-center gap-1.5'>
                          {/* Project assign / unassign */}
                          {assignedProject ? (
                            <button
                              onClick={() =>
                                unassign({
                                  projectId: assignedProject.id,
                                  deviceSn: device.deviceSn,
                                })
                              }
                              disabled={isUnassigning || isUnbinding}
                              title='Remove from project'
                              className='flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 hover:border-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                            >
                              {isThisUnassigning ? (
                                <Loader2 size={11} className='animate-spin' />
                              ) : (
                                <FolderMinus size={11} />
                              )}
                              Unassign
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setAssignTarget({
                                  sn: device.deviceSn,
                                  name: device.nickname || device.deviceName || device.deviceSn,
                                })
                              }
                              disabled={isUnbinding}
                              title='Assign to a project'
                              className='flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-white bg-[#1C93FF] border border-[#1C93FF] rounded hover:bg-[#1C93FF]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                            >
                              <FolderOpen size={11} />
                              Assign
                            </button>
                          )}

                          {/* Unbind from workspace */}
                          <button
                            onClick={() => unbind(device.deviceSn)}
                            disabled={isUnbinding || isUnassigning}
                            title='Unbind device from workspace'
                            className='flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                          >
                            {isThisUnbinding ? (
                              <Loader2 size={11} className='animate-spin' />
                            ) : (
                              <Link2Off size={11} />
                            )}
                            Unbind
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign-to-project modal */}
      <AssignProjectModal
        deviceSn={assignTarget?.sn ?? null}
        deviceName={assignTarget?.name ?? ''}
        onClose={() => setAssignTarget(null)}
      />
    </>
  );
};

export default AssetTable;
