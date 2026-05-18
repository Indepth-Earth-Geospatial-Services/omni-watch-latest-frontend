'use client';

// Dashboard layout guard — every page under (dashboard) is protected by this layout.
// It checks whether an active project has been selected (via ProjectProvider / sessionStorage).
// If no project is selected, the user is redirected to /projects to choose one.
//
// Why the `mounted` flag:
//   ProjectProvider reads from sessionStorage in its useState initializer.
//   During SSR the initializer returns null (no window). On the client, React
//   re-runs the initializer during hydration and may find a stored project.
//   We wait until after the first client-side render before acting on null,
//   so we never redirect a user who legitimately has a project stored.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FolderOpen } from 'lucide-react';
import { useProject } from '@/providers/ProjectProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { activeProject } = useProject();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !activeProject) {
      router.replace('/projects');
    }
  }, [mounted, activeProject, router]);

  // SSR / pre-hydration: show a neutral loading screen
  // (we don't yet know whether sessionStorage holds a project)
  if (!mounted) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='w-7 h-7 text-[#1C93FF] animate-spin' />
      </div>
    );
  }

  // Post-hydration, no project: redirect is in flight — block dashboard from rendering
  if (!activeProject) {
    return (
      <div className='min-h-screen bg-background flex flex-col items-center justify-center gap-4'>
        <div className='p-4 bg-zinc-900 border border-zinc-800 rounded-2xl'>
          <FolderOpen className='w-8 h-8 text-zinc-600' />
        </div>
        <div className='text-center space-y-1'>
          <p className='text-sm font-semibold text-zinc-300'>No project selected</p>
          <p className='text-xs text-zinc-600'>Redirecting to Projects…</p>
        </div>
        <Loader2 className='w-5 h-5 text-[#1C93FF] animate-spin' />
      </div>
    );
  }

  return <>{children}</>;
}
