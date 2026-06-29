'use client';

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = 'default',
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='bg-background border-border/50'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-foreground'>{title}</AlertDialogTitle>
          <AlertDialogDescription className='text-muted-foreground'>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className='border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={
              variant === 'destructive'
                ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-400'
                : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400'
            }
          >
            {isPending && <Loader2 className='animate-spin h-4 w-4 mr-2' />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
