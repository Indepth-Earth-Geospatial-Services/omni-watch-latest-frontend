'use client';

import React from 'react';
import { AlertTriangle, Gamepad2, X } from 'lucide-react';

interface ManualFlightActivateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ManualFlightActivateModal({
  isOpen,
  onConfirm,
  onCancel,
}: ManualFlightActivateModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onCancel} />

      {/* Modal */}
      <div className='relative bg-[#0E1015] border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 p-6 w-[360px] flex flex-col gap-5'>

        {/* Close */}
        <button
          onClick={onCancel}
          className='absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-500 transition-colors'
        >
          <X size={11} />
        </button>

        {/* Icon + heading */}
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center'>
            <Gamepad2 size={24} className='text-amber-400' />
          </div>
          <div>
            <h2 className='text-[13px] font-black uppercase tracking-widest text-white'>
              Activate Manual Flight Mode?
            </h2>
            <p className='text-[10px] text-zinc-500 mt-1 font-mono'>
              Direct control via DRC channel
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className='flex items-start gap-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2.5'>
          <AlertTriangle size={13} className='text-amber-400 flex-shrink-0 mt-0.5' />
          <div className='flex flex-col gap-1'>
            <p className='text-[10px] font-bold text-amber-300'>Use with caution</p>
            <p className='text-[9px] text-zinc-400 leading-relaxed'>
              You will take direct control of the drone via the DRC MQTT channel.
              Incorrect inputs or losing focus may cause unexpected movement.
              Flight Authority must be held and DRC must be active.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className='flex flex-col gap-1.5'>
          {[
            'Ensure Flight Authority is granted',
            'Ensure DRC channel is active (green)',
            'Drone must be airborne before input takes effect',
            'Release all controls to hover in place',
          ].map((item) => (
            <div key={item} className='flex items-start gap-2'>
              <span className='text-amber-500 text-[10px] mt-px flex-shrink-0'>·</span>
              <span className='text-[9px] text-zinc-400'>{item}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className='flex gap-2'>
          <button
            onClick={onCancel}
            className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='flex-1 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 hover:border-amber-400 transition-colors'
          >
            Activate
          </button>
        </div>
      </div>
    </div>
  );
}
