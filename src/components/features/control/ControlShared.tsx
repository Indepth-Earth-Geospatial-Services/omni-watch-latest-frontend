'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Labels ───────────────────────────────────────────────────────────────────

export const DOCK_MODE_LABELS: Record<number, string> = {
  0: 'Idle',
  1: 'On-site Debug',
  2: 'Remote Debug',
  3: 'Upgrading',
  4: 'Working',
  5: 'Dormant',
};

export const JOYSTICK_INVALID_REASONS: Record<number, string> = {
  0: 'RC lost connection',
  1: 'Low battery — returning home',
  2: 'Low battery — landing',
  3: 'Near flight restriction zone',
  4: 'Pilot takeover via RC',
};

// ─── CmdButton ────────────────────────────────────────────────────────────────

export interface CmdButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'confirm';
}

export const CmdButton = ({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading,
  variant = 'default',
}: CmdButtonProps) => {
  const base =
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed';
  const styles: Record<string, string> = {
    default:
      'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 hover:border-zinc-500 hover:text-white',
    danger:
      'bg-red-950/40 border-red-800/50 text-red-400 hover:bg-red-900/50 hover:border-red-600 hover:text-red-200',
    confirm: 'bg-amber-900/50 border-amber-600/60 text-amber-300 animate-pulse',
  };
  return (
    <button
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 size={11} className='animate-spin' /> : <Icon size={11} />}
      {label}
    </button>
  );
};

// ─── SectionHeader ────────────────────────────────────────────────────────────

export const SectionHeader = ({ title }: { title: string }) => (
  <p className='text-[9px] font-black tracking-[0.18em] text-zinc-600 uppercase mb-1.5'>{title}</p>
);

// ─── FormInput ────────────────────────────────────────────────────────────────

export interface FormInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const FormInput = ({
  label,
  value,
  onChange,
  type = 'number',
  min,
  max,
  step,
  unit,
  disabled,
  placeholder,
}: FormInputProps) => (
  <div className='flex flex-col gap-0.5'>
    <label className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>{label}</label>
    <div className='flex items-center gap-1'>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        className='w-full bg-[#0A0C10] border border-zinc-700/50 rounded text-[11px] text-zinc-300 px-2 py-1 focus:outline-none focus:border-zinc-500 disabled:opacity-40 placeholder:text-zinc-700'
      />
      {unit && <span className='text-[9px] text-zinc-600 flex-shrink-0 font-mono'>{unit}</span>}
    </div>
  </div>
);

// ─── FormSelect ───────────────────────────────────────────────────────────────

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FormSelectOption[];
  disabled?: boolean;
}

export const FormSelect = ({ label, value, onChange, options, disabled }: FormSelectProps) => (
  <div className='flex flex-col gap-0.5'>
    <label className='text-[8px] font-black uppercase tracking-widest text-zinc-600'>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className='bg-[#0A0C10] border border-zinc-700/50 rounded text-[11px] text-zinc-300 px-2 py-1 focus:outline-none focus:border-zinc-500 disabled:opacity-40 cursor-pointer'
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
