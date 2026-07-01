'use client';

import React, { useState } from 'react';
import { Send, X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFlyToPoint } from '@/hooks/useDockController';
import { FormInput } from './ControlShared';

interface FlyToPointModalProps {
  dockSn: string;
  onClose: () => void;
}

interface WaypointRow {
  id: string;
  lat: string;
  lng: string;
  height: string;
}

const newRow = (): WaypointRow => ({
  id: crypto.randomUUID(),
  lat: '',
  lng: '',
  height: '50',
});

export const FlyToPointModal = ({ dockSn, onClose }: FlyToPointModalProps) => {
  const [waypoints, setWaypoints] = useState<WaypointRow[]>([newRow()]);
  const [maxSpeed,  setMaxSpeed]  = useState('8');
  const [lastError, setLastError] = useState<string | null>(null);

  const { mutate: flyTo, isPending } = useFlyToPoint(dockSn);

  const updateRow = (id: string, field: keyof Omit<WaypointRow, 'id'>, value: string) =>
    setWaypoints((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addRow = () => setWaypoints((prev) => [...prev, newRow()]);

  const removeRow = (id: string) =>
    setWaypoints((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const handleSubmit = () => {
    const invalid = waypoints.findIndex(
      (r) => !r.lat || !r.lng || isNaN(Number(r.lat)) || isNaN(Number(r.lng)),
    );
    if (invalid !== -1) {
      setLastError(`Waypoint ${invalid + 1}: enter valid latitude and longitude.`);
      return;
    }

    const payload = {
      maxSpeed: Number(maxSpeed),
      points: waypoints.map((r) => ({
        latitude:  Number(r.lat),
        longitude: Number(r.lng),
        height:    Number(r.height),
      })),
    };

    console.log('[FlyToPoint] Sending payload →', JSON.stringify(payload, null, 2));
    setLastError(null);

    flyTo(payload, {
      onSuccess: () => {
        console.log('[FlyToPoint] ✅ Command accepted by DJI server');
        toast.success('Fly-to command sent successfully');
        onClose();
      },
      onError: (err) => {
        const detail = (err as { message?: string; response?: { data?: unknown } }).message ?? 'Unknown error';
        const responseData = (err as { response?: { data?: unknown } }).response?.data;
        console.error('[FlyToPoint] ❌ Failed:', err);
        if (responseData) {
          console.error('[FlyToPoint] Server response:', JSON.stringify(responseData, null, 2));
        }
        const displayMsg = responseData
          ? `${detail} — ${JSON.stringify(responseData)}`
          : detail;
        setLastError(displayMsg);
        toast.error(`Fly-to failed: ${detail}`);
      },
    });
  };

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />

      {/* Modal card */}
      <div className='relative z-10 w-full max-w-lg mx-4 bg-secondary border border-blue-500/30 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.10)] overflow-hidden'>

        {/* Accent bar */}
        <div className='h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500/70 to-transparent' />

        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-5 pb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0'>
              <Send size={15} className='text-blue-400' />
            </div>
            <div>
              <h2 className='text-sm font-black uppercase tracking-widest text-foreground'>Fly-To Point</h2>
              <p className='text-[10px] text-blue-500/60 font-logs tracking-wide mt-0.5'>
                fly-to-point · {dockSn.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground transition-colors p-1'
            aria-label='Close'
          >
            <X size={15} />
          </button>
        </div>

        <div className='h-px bg-border/80 mx-6' />

        {/* Form body */}
        <div className='px-6 py-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto'>

          {/* Global speed */}
          <div>
            <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2.5'>
              Flight Speed
            </p>
            <div className='w-1/2 pr-1.5'>
              <FormInput
                label='Max Speed'
                value={maxSpeed}
                onChange={setMaxSpeed}
                min={1}
                max={15}
                step={1}
                unit='m/s'
              />
            </div>
          </div>

          <div className='h-px bg-border/60' />

          {/* Waypoint rows */}
          <div>
            <div className='flex items-center justify-between mb-2.5'>
              <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground'>
                Waypoints
                <span className='ml-1.5 text-[9px] font-logs text-muted-foreground'>({waypoints.length})</span>
              </p>
              <button
                onClick={addRow}
                className='flex items-center gap-1 text-[9px] font-bold text-blue-500/70 hover:text-blue-400 transition-colors'
              >
                <Plus size={10} /> Add
              </button>
            </div>

            <div className='flex flex-col gap-3'>
              {waypoints.map((row, idx) => (
                <div key={row.id} className='rounded-lg bg-secondary/50 border border-border/50 p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-[8px] font-black uppercase tracking-widest text-muted-foreground'>
                      Point {idx + 1}
                    </span>
                    {waypoints.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className='text-muted-foreground hover:text-red-400 transition-colors'
                        aria-label='Remove waypoint'
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-2 mb-2'>
                    <FormInput
                      label='Latitude'
                      value={row.lat}
                      onChange={(v) => updateRow(row.id, 'lat', v)}
                      type='number'
                      min={-90}
                      max={90}
                      step={0.000001}
                      placeholder='e.g. 1.3521'
                    />
                    <FormInput
                      label='Longitude'
                      value={row.lng}
                      onChange={(v) => updateRow(row.id, 'lng', v)}
                      type='number'
                      min={-180}
                      max={180}
                      step={0.000001}
                      placeholder='e.g. 103.8198'
                    />
                  </div>
                  <div className='w-1/2 pr-1.5'>
                    <FormInput
                      label='Height'
                      value={row.height}
                      onChange={(v) => updateRow(row.id, 'height', v)}
                      min={20}
                      max={10000}
                      step={1}
                      unit='m'
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className='text-[8px] text-muted-foreground mt-2'>
              Min height 20 m — DJI safety floor · Drone visits points in order
            </p>
          </div>

          {/* Inline error panel */}
          {lastError && (
            <div className='rounded-lg bg-red-950/50 border border-red-800/50 px-3 py-2.5 flex gap-2.5'>
              <AlertTriangle size={13} className='text-red-400 flex-shrink-0 mt-0.5' />
              <div className='min-w-0'>
                <p className='text-[9px] font-black uppercase tracking-widest text-red-400 mb-1'>API Error</p>
                <p className='text-[10px] text-red-300/80 font-logs break-all leading-relaxed'>{lastError}</p>
                <p className='text-[8px] text-muted-foreground mt-1'>Full details logged to browser console.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex gap-3 px-6 py-4 border-t border-border/60'>
          <button
            onClick={onClose}
            className='flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-widest hover:border-border hover:text-foreground transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className='flex-1 py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[11px] font-black uppercase tracking-widest hover:bg-blue-500/30 hover:border-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          >
            {isPending
              ? <span className='flex items-center justify-center gap-2'><Loader2 size={12} className='animate-spin' /> Sending…</span>
              : 'Send Fly-To'}
          </button>
        </div>
      </div>
    </div>
  );
};
