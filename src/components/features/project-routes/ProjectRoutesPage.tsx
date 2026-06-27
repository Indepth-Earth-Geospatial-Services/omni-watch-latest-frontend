'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Route } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import { ProjectRoutesTable } from './ProjectRoutesTable';
import { ConfirmActionModal } from '@/components/features/tasks/ConfirmActionModal';
import { useProjectWaylines } from '@/hooks/useProjectWaylines';
import { useProject } from '@/providers/ProjectProvider';
import { projectsApi } from '@/services/authservice-layer/auth-service';
import type { Wayline } from '@/lib/types';

export default function ProjectRoutesPage() {
  const { activeProject } = useProject();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: waylines, isLoading } = useProjectWaylines();

  const [modal, setModal] = useState<{ open: boolean; wayline: Wayline | null }>({
    open: false,
    wayline: null,
  });
  const [isPending, setIsPending] = useState(false);

  function handleUnassign(wayline: Wayline) {
    setModal({ open: true, wayline });
  }

  async function handleConfirm() {
    if (!activeProject || !modal.wayline) return;
    setIsPending(true);
    try {
      await projectsApi.unassignFlightArea(activeProject.id, modal.wayline.id);
      toast.success('Flight route unassigned');
      queryClient.invalidateQueries({ queryKey: ['omniwatch', 'projects'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to unassign: ${message}`);
    } finally {
      setIsPending(false);
      setModal({ open: false, wayline: null });
    }
  }

  if (!activeProject) {
    return (
      <EmptyPage
        icon={<Route aria-hidden className='w-6 h-6 text-zinc-400' />}
        title='No Project Selected'
        body='Please select a project from the sidebar to view flight routes.'
        action={{
          label: 'Go to Projects',
          onClick: () => router.push('/projects'),
        }}
      />
    );
  }

  return (
    <MainLayout title='Flight Routes' subtitle='Waylines assigned to this project'>
      <div className='font-poppins space-y-4'>
        <ProjectRoutesTable
          waylines={waylines}
          isLoading={isLoading}
          onUnassign={handleUnassign}
        />
      </div>

      <ConfirmActionModal
        open={modal.open}
        onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}
        title='Unassign Flight Route'
        description={
          modal.wayline
            ? `Remove ${modal.wayline.name} from this project? This will not delete the wayline from the workspace.`
            : ''
        }
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </MainLayout>
  );
}
