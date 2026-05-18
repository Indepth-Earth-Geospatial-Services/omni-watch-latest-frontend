'use client';

import React, { useEffect, useState } from 'react';
import { X, PlaneTakeoff, Box, Loader2 } from 'lucide-react';
import { useBindDevice } from '@/hooks/useDJIDevices';
import { useAuth } from '@/providers/AuthProvider';
import { DJIApiError } from '@/lib/config/client';

const resolveDJIError = (err: Error): string => {
  if (err instanceof DJIApiError) {
    if (err.code === -1)
      return 'Binding failed. Verify the serial number is correct and the device is reachable on the DJI network.';
    if (err.code === 401) return 'Session expired. Please sign in again.';
    return `DJI error (code ${err.code}): ${err.message}`;
  }
  return err.message;
};

// DJI domain values: 0 = aircraft/drone, 3 = dock
const DEVICE_TYPES = [
  { label: 'Drone', domain: '0', icon: PlaneTakeoff },
  { label: 'Dock', domain: '3', icon: Box },
] as const;

type DeviceTypeLabel = (typeof DEVICE_TYPES)[number]['label'];

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
}

const AddAssetModal = ({ open, onClose }: AddAssetModalProps) => {
  const { user } = useAuth();
  const [deviceSn, setDeviceSn] = useState('');
  const [nickname, setNickname] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceTypeLabel>('Drone');
  const [snError, setSnError] = useState('');

  const { mutate: bind, isPending, error, reset } = useBindDevice();

  useEffect(() => {
    if (open) {
      setDeviceSn('');
      setNickname('');
      setDeviceType('Drone');
      setSnError('');
      reset();
    }
  }, [open, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sn = deviceSn.trim();
    if (!sn) {
      setSnError('Device serial number is required.');
      return;
    }

    const selectedType = DEVICE_TYPES.find((t) => t.label === deviceType)!;
    const workspaceId = user?.workspace_id ?? '';

    bind(
      {
        deviceSn: sn,
        deviceName: nickname.trim() || sn,
        workspaceId,
        domain: selectedType.domain,
      },
      {
        onSuccess: onClose,
        onError: (err) => {
          console.error('[AddAsset] POST /binding failed:', {
            message: err.message,
            code: (err as DJIApiError).code,
            raw: err,
          });
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center font-poppins'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

      {/* Modal card */}
      <div className='relative w-full max-w-md bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-zinc-800'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-[#1C93FF]/10 border border-[#1C93FF]/20 rounded-lg'>
              <PlaneTakeoff size={16} className='text-[#1C93FF]' />
            </div>
            <div>
              <h2 className='text-sm font-bold text-zinc-100'>Add Asset</h2>
              <p className='text-[11px] text-zinc-500'>Bind a device to this workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
          {/* Device Type */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
              Device Type
            </label>
            <div className='flex gap-2'>
              {DEVICE_TYPES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type='button'
                  onClick={() => setDeviceType(label)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                    deviceType === label
                      ? 'bg-[#1C93FF]/10 border-[#1C93FF]/40 text-[#1C93FF]'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Serial Number */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
              Serial Number <span className='text-red-400'>*</span>
            </label>
            <input
              type='text'
              value={deviceSn}
              onChange={(e) => {
                setDeviceSn(e.target.value);
                if (snError) setSnError('');
              }}
              placeholder='e.g. 1ZNBJ9D001234'
              autoFocus
              className={`w-full px-3 py-2.5 bg-zinc-900 border rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 font-mono outline-none transition-colors
                ${snError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-[#1C93FF]'}`}
            />
            {snError && <p className='text-[11px] text-red-400'>{snError}</p>}
          </div>

          {/* Nickname */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
              Nickname{' '}
              <span className='text-zinc-600 font-normal normal-case tracking-normal'>
                (optional)
              </span>
            </label>
            <input
              type='text'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={deviceType === 'Drone' ? 'e.g. Raptor-01' : 'e.g. NestPoint-03'}
              className='w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-[#1C93FF] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors'
            />
          </div>

          {/* API error */}
          {error && (
            <p className='text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2'>
              {resolveDJIError(error)}
            </p>
          )}

          {/* Actions */}
          <div className='flex items-center justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              disabled={isPending}
              className='px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isPending}
              className='flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1C93FF] rounded-lg hover:bg-[#1C93FF]/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
            >
              {isPending ? (
                <>
                  <Loader2 size={12} className='animate-spin' />
                  Binding…
                </>
              ) : (
                <>
                  <PlaneTakeoff size={12} />
                  Add Asset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
