'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import { TaskTable } from './TaskTable';
import { CreatePlanForm } from './CreatePlanForm';
import { ConfirmActionModal } from './ConfirmActionModal';
import {
  useFlightTasks,
  useCreateFlightTask,
  useDeleteFlightTask,
  useUpdateTaskStatus,
  useUploadMediaNow,
} from '@/hooks/useFlightTasks';
import { useWaylines } from '@/hooks/useWaylines';
import { useProject } from '@/providers/ProjectProvider';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import type { WaylineJobItem, CreateFlightTask } from '@/lib/types';

export function TaskPage() {
  const { activeProject } = useProject();
  const { user } = useAuth();
  const router = useRouter();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isPending: boolean;
  }>({ open: false, title: '', description: '', onConfirm: () => {}, isPending: false });

  // Fetch task list
  const { data: taskData, isLoading } = useFlightTasks(workspaceId, { page, page_size: pageSize });

  // Fetch all waylines for the workspace
  const { data: allWaylines = [] } = useWaylines();

  // Resolve project waylines from flight_areas
  const projectWaylines = useMemo(() => {
    if (!activeProject) return [];
    const waylineIds = new Set(activeProject.flight_areas.map((fa) => fa.wayline_id));
    return allWaylines.filter((w) => waylineIds.has(w.id));
  }, [activeProject, allWaylines]);

  // Project devices
  const projectDevices = activeProject?.devices ?? [];

  // Mutations
  const createMutation = useCreateFlightTask();
  const deleteMutation = useDeleteFlightTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const uploadMutation = useUploadMediaNow();

  // Handlers
  function handleCreate(body: CreateFlightTask) {
    createMutation.mutate(
      { workspaceId, body },
      {
        onSuccess: () => {
          toast.success('Flight plan created successfully');
          setMode('list');
          setPage(1);
        },
        onError: (err) => {
          toast.error(`Failed to create plan: ${err.message}`);
        },
      }
    );
  }

  function handleDelete(task: WaylineJobItem) {
    setActionModal({
      open: true,
      title: 'Delete Task',
      description: `Are you sure you want to delete "${task.job_name}"? This action cannot be undone.`,
      isPending: deleteMutation.isPending,
      onConfirm: () => {
        deleteMutation.mutate(
          { workspaceId, jobId: task.job_id },
          {
            onSuccess: () => {
              toast.success('Task deleted');
              setActionModal((prev) => ({ ...prev, open: false }));
            },
            onError: (err) => {
              toast.error(`Failed to delete: ${err.message}`);
              setActionModal((prev) => ({ ...prev, open: false }));
            },
          }
        );
      },
    });
  }

  function handleSuspend(task: WaylineJobItem) {
    setActionModal({
      open: true,
      title: 'Suspend Task',
      description: `Are you sure you want to suspend "${task.job_name}"?`,
      isPending: updateStatusMutation.isPending,
      onConfirm: () => {
        updateStatusMutation.mutate(
          { workspaceId, jobId: task.job_id, status: 0 },
          {
            onSuccess: () => {
              toast.success('Task suspended');
              setActionModal((prev) => ({ ...prev, open: false }));
            },
            onError: (err) => {
              toast.error(`Failed to suspend: ${err.message}`);
              setActionModal((prev) => ({ ...prev, open: false }));
            },
          }
        );
      },
    });
  }

  function handleResume(task: WaylineJobItem) {
    setActionModal({
      open: true,
      title: 'Resume Task',
      description: `Are you sure you want to resume "${task.job_name}"?`,
      isPending: updateStatusMutation.isPending,
      onConfirm: () => {
        updateStatusMutation.mutate(
          { workspaceId, jobId: task.job_id, status: 1 },
          {
            onSuccess: () => {
              toast.success('Task resumed');
              setActionModal((prev) => ({ ...prev, open: false }));
            },
            onError: (err) => {
              toast.error(`Failed to resume: ${err.message}`);
              setActionModal((prev) => ({ ...prev, open: false }));
            },
          }
        );
      },
    });
  }

  function handleUploadMedia(task: WaylineJobItem) {
    uploadMutation.mutate(
      { workspaceId, jobId: task.job_id },
      {
        onSuccess: () => {
          toast.success('Media upload triggered');
        },
        onError: (err) => {
          toast.error(`Failed to trigger upload: ${err.message}`);
        },
      }
    );
  }

  if (!activeProject) {
    return (
      <EmptyPage
        icon={<Calendar className='w-6 h-6 text-muted-foreground' />}
        title='No Project Selected'
        body='Please select a project from the sidebar to access the Task Plan Library.'
        action={{
          label: 'Go to Projects',
          onClick: () => router.push('/projects'),
        }}
      />
    );
  }

  return (
    <MainLayout title='Task Plan Library' subtitle='Manage flight tasks and create new mission plans'>
      <div className='-my-6 -mr-6'>
        <div className='flex flex-col h-[calc(100vh-10rem)] font-ui'>
          {/* Header */}
          <div className='px-4 pt-4 flex items-center justify-between flex-shrink-0'>
            <h2 className='text-sm font-semibold text-foreground'>
              {mode === 'list' ? 'Flight Tasks' : 'New Flight Plan'}
            </h2>
            {mode === 'list' && (
              <button
                onClick={() => setMode('create')}
                className='flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors'
              >
                <Plus className='w-4 h-4' />
                New Plan
              </button>
            )}
          </div>

          {/* Content */}
          <div className='flex-1 min-h-0 overflow-y-auto px-4 pt-3'>
            {mode === 'list' ? (
              <TaskTable
                tasks={taskData?.list ?? []}
                isLoading={isLoading}
                pagination={{ page, pageSize, total: taskData?.pagination.total ?? 0 }}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                onDelete={handleDelete}
                onSuspend={handleSuspend}
                onResume={handleResume}
                onUploadMedia={handleUploadMedia}
              />
            ) : (
              <CreatePlanForm
                onSubmit={handleCreate}
                onCancel={() => setMode('list')}
                isPending={createMutation.isPending}
                projectWaylines={projectWaylines}
                projectDevices={projectDevices}
              />
            )}
          </div>
        </div>
      </div>

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        open={actionModal.open}
        onOpenChange={(open) => setActionModal((prev) => ({ ...prev, open }))}
        title={actionModal.title}
        description={actionModal.description}
        onConfirm={actionModal.onConfirm}
        isPending={actionModal.isPending}
      />
    </MainLayout>
  );
}
