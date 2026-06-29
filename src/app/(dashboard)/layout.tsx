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
import { useProject } from '@/providers/ProjectProvider';
import { Toaster } from 'sonner';

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

  // SSR / pre-hydration: nothing to render yet
  if (!mounted) return null;

  // Post-hydration, no project: redirect is in flight — block dashboard from rendering
  if (!activeProject) return null;

  return (
    <>
      {children}
      <Toaster position='top-right' richColors />
    </>
  );
}
