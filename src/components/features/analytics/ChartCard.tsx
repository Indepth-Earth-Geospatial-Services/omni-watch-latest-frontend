'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  footer,
  isLoading = false,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border/50 rounded-xl overflow-hidden',
        className
      )}
    >
      <div className='px-4 pt-4 pb-2'>
        <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
        {description && (
          <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
        )}
      </div>
      <div className='px-2 pb-2'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 size={16} className='text-muted-foreground animate-spin' />
            <span className='text-xs text-muted-foreground ml-2'>Loading chart...</span>
          </div>
        ) : (
          children
        )}
      </div>
      {footer && (
        <div className='px-4 py-2.5 border-t border-border/30'>{footer}</div>
      )}
    </div>
  );
}
