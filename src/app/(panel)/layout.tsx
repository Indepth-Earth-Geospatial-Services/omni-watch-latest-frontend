'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { getToken } from '@/lib/config/token-store';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // Redirect only after the server check confirms no valid session
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
      </div>
    );
  }

  // While the auth API is in flight, render immediately if a local token exists.
  // This eliminates the 5–15s blank screen caused by a slow /api/auth/me response.
  // If the token turns out to be invalid, the redirect effect above will catch it.
  if (isLoading) {
    if (!getToken()) {
      return (
        <div className='min-h-screen bg-background flex items-center justify-center'>
          <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
        </div>
      );
    }
    // Token exists → fall through and render children optimistically
  }

  // Auth check completed, no session → redirect is in flight
  if (!isLoading && !isAuthenticated) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
      </div>
    );
  }

  return <>{children}</>;
}
