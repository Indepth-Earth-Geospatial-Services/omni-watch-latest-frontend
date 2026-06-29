'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <label
      className={cn(
        'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-[#1C93FF]' : 'bg-zinc-700',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        type='checkbox'
        ref={ref}
        className='sr-only'
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </label>
  )
);
Switch.displayName = 'Switch';

export { Switch };
