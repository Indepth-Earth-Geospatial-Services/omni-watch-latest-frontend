'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface DebugActivationModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const DebugActivationModal = ({ onClose, onConfirm }: DebugActivationModalProps) => (
  <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
    <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />
    <div className='relative z-10 w-full max-w-md mx-4 bg-secondary border border-amber-500/30 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden'>
      <div className='h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600' />
      <div className='flex items-start justify-between px-6 pt-5 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center'>
            <AlertTriangle size={18} className='text-amber-400' />
          </div>
          <div>
            <h2 className='text-sm font-black uppercase tracking-widest text-foreground'>Activate Debug Mode</h2>
            <p className='text-[10px] text-amber-500/80 font-mono tracking-wide mt-0.5'>REMOTE HARDWARE ACCESS</p>
          </div>
        </div>
        <button onClick={onClose} className='text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5'>
          <X size={16} />
        </button>
      </div>
      <div className='h-px bg-border/80 mx-6' />
      <div className='px-6 py-4 space-y-4'>
        <p className='text-[11px] text-zinc-400 leading-relaxed'>
          Enabling debug mode grants direct hardware access to the dock and drone. Commands execute
          immediately with no additional confirmation.
        </p>
        <div className='rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3 space-y-2'>
          <p className='text-[9px] font-black uppercase tracking-[0.18em] text-amber-500/70 mb-2'>
            The following will become active
          </p>
          {[
            'Dock cover open / close',
            'Charging control',
            'Supplemental lighting',
            'Drone power on / off',
            'Device reboot & format',
            'Battery maintenance',
          ].map((item) => (
            <div key={item} className='flex items-center gap-2'>
              <div className='w-1 h-1 rounded-full bg-amber-400 flex-shrink-0' />
              <span className='text-[10px] text-zinc-300'>{item}</span>
            </div>
          ))}
        </div>
        <p className='text-[10px] text-zinc-600'>
          Debug mode will be reported via MQTT and visible to all operators. Deactivate when finished.
        </p>
      </div>
      <div className='flex gap-3 px-6 pb-6'>
        <button
          onClick={onClose}
          className='flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-foreground transition-colors'
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className='flex-1 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/30 hover:border-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.1)]'
        >
          Activate
        </button>
      </div>
    </div>
  </div>
);
