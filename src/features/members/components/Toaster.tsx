'use client';

import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position='top-right'
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'hsl(var(--foreground))',
        },
      }}
      closeButton
      richColors
    />
  );
}
