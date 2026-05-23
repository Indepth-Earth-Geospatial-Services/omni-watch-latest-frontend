'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
      </div>
    );
  }

  return <>{children}</>;
}
