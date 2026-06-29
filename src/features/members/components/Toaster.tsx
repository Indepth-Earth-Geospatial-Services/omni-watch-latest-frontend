'use client';

import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position='top-right'
      toastOptions={{
        style: {
          background: '#1A1C20',
          border: '1px solid rgba(255,255,255,0.07)',
          color: '#e2e4ec',
        },
      }}
      closeButton
      richColors
    />
  );
}
