'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Download, Image, CheckSquare, Square, Eye, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getToken } from '@/lib/config/token-store';
import type { MediaFile, MediaListResponse } from '@/lib/types/media';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

function isImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

interface MediaTableProps {
  data: MediaListResponse | undefined;
  isLoading: boolean;
  workspaceId: string;
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return '-';
  return dateStr;
}

async function proxyDownload(workspaceId: string, file: MediaFile): Promise<void> {
  const token = getToken() ?? '';
  const params = new URLSearchParams({
    workspaceId,
    fileId: file.file_id,
    fileName: file.file_name,
  });

  const res = await fetch(`/api/media/download?${params}`, {
    headers: { 'x-auth-token': token },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const detail = body.details ? ` — ${body.details}` : '';
    throw new Error(body.error || `Download failed (${res.status})${detail}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchPreviewBlob(workspaceId: string, file: MediaFile): Promise<string> {
  const token = getToken() ?? '';
  const params = new URLSearchParams({
    workspaceId,
    fileId: file.file_id,
    fileName: file.file_name,
  });

  const res = await fetch(`/api/media/preview?${params}`, {
    headers: { 'x-auth-token': token },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Preview failed (${res.status})`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function MediaTable({ data, isLoading, workspaceId }: MediaTableProps) {
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  const toggleSelect = useCallback((fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!data) return;
    setSelectedIds((prev) => {
      if (prev.size === data.list.length) return new Set();
      return new Set(data.list.map((f) => f.file_id));
    });
  }, [data]);

  const allSelected = data && data.list.length > 0 && selectedIds.size === data.list.length;

  async function handleDownload(file: MediaFile) {
    setDownloadingFileId(file.file_id);
    try {
      await proxyDownload(workspaceId, file);
      toast.success(`Downloaded: ${file.file_name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Download failed: ${message}`, { duration: 6000 });
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function handleBulkDownload() {
    if (!data || selectedIds.size === 0) return;
    setBulkDownloading(true);
    const files = data.list.filter((f) => selectedIds.has(f.file_id));
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await proxyDownload(workspaceId, file);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success(`Downloaded ${successCount} file${successCount !== 1 ? 's' : ''}`);
    } else {
      toast.error(`Downloaded ${successCount}, failed ${failCount}`);
    }
    setSelectedIds(new Set());
    setBulkDownloading(false);
  }

  if (isLoading) {
    return (
      <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-zinc-800/50'>
              <th className='px-4 py-3 w-8'></th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>File Name</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Drone</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Payload</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Original</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Created</th>
              <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className='border-b border-zinc-800/20'>
                <td className='px-4 py-3'></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-32' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-16' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-8' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-24' /></td>
                <td className='px-4 py-3'><div className='h-3 bg-zinc-800 rounded animate-pulse w-8' /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.list.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Image aria-hidden size={16} className='text-zinc-600' />
        <p className='text-xs font-poppins text-zinc-600 mt-2'>No media files found</p>
      </div>
    );
  }

  return (
    <div className='bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden'>
      {selectedIds.size > 0 && (
        <div className='flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/50'>
          <span className='text-xs font-poppins text-zinc-400'>
            {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className='flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-poppins font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50'
          >
            {bulkDownloading ? (
              <Loader2 size={10} className='animate-spin' />
            ) : (
              <Download size={10} />
            )}
            Download Selected
          </button>
        </div>
      )}

      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-zinc-800/50'>
            <th className='px-4 py-3 w-8'>
              <button onClick={toggleSelectAll} className='text-zinc-500 hover:text-zinc-300'>
                {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
              </button>
            </th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>File Name</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Drone</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Payload</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Original</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Created</th>
            <th className='px-4 py-3 text-[10px] font-poppins font-medium text-zinc-500 uppercase'>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.list.map((file) => (
            <tr
              key={file.file_id}
              className={`border-b border-zinc-800/20 hover:bg-zinc-800/30 transition-colors ${
                selectedIds.has(file.file_id) ? 'bg-zinc-800/20' : ''
              }`}
            >
              <td className='px-4 py-3'>
                <button
                  onClick={() => toggleSelect(file.file_id)}
                  className='text-zinc-500 hover:text-zinc-300'
                >
                  {selectedIds.has(file.file_id) ? (
                    <CheckSquare size={12} className='text-sky-400' />
                  ) : (
                    <Square size={12} />
                  )}
                </button>
              </td>
              <td className='px-4 py-3'>
                <span className='text-xs font-poppins text-[#E2E2E8] truncate max-w-[200px] block'>
                  {file.file_name}
                </span>
                <span className='text-[9px] font-poppins text-zinc-600 block'>
                  {file.file_path}
                </span>
              </td>
              <td className='px-4 py-3'>
                <span className='text-[10px] font-mono font-poppins text-zinc-500'>
                  {file.drone || '-'}
                </span>
              </td>
              <td className='px-4 py-3'>
                <span className='text-[10px] font-mono font-poppins text-zinc-500'>
                  {file.payload || '-'}
                </span>
              </td>
              <td className='px-4 py-3'>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    file.is_original
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-600/30 text-zinc-500'
                  }`}
                >
                  {file.is_original ? 'Yes' : 'No'}
                </span>
              </td>
              <td className='px-4 py-3'>
                <span className='text-[10px] font-poppins text-zinc-500'>
                  {formatTimestamp(file.create_time)}
                </span>
              </td>
              <td className='px-4 py-3'>
                <div className='flex items-center gap-1'>
                  {isImageFile(file.file_name) && (
                    <button
                      onClick={() => setPreviewFile(file)}
                      className='p-1 rounded hover:bg-zinc-700/50 transition-colors'
                      title='Preview'
                    >
                      <Eye className='w-3.5 h-3.5 text-zinc-500 hover:text-sky-400' />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFileId === file.file_id}
                    className='p-1 rounded hover:bg-zinc-700/50 transition-colors disabled:opacity-50'
                    title='Download'
                  >
                    {downloadingFileId === file.file_id ? (
                      <Loader2 className='w-3.5 h-3.5 text-zinc-500 animate-spin' />
                    ) : (
                      <Download className='w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300' />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='flex items-center justify-center py-3'>
        <span className='text-[10px] font-poppins text-zinc-600'>
          {data.pagination.total} file{data.pagination.total !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          workspaceId={workspaceId}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  workspaceId,
  file,
  onClose,
}: {
  workspaceId: string;
  file: MediaFile;
  onClose: () => void;
}) {
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPreviewBlob(workspaceId, file)
      .then((url) => {
        if (!cancelled) {
          setBlobUrl(url);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setImgState('error');
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load preview');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, file]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative max-w-[90vw] max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-4 py-2 border-b border-zinc-800'>
          <span className='text-xs font-poppins text-zinc-400 truncate max-w-[300px]'>
            {file.file_name}
          </span>
          <button
            onClick={onClose}
            className='p-1 rounded hover:bg-zinc-800 transition-colors'
          >
            <X className='w-4 h-4 text-zinc-400' />
          </button>
        </div>
        <div className='flex items-center justify-center p-2 min-h-[200px] min-w-[300px]'>
          {imgState === 'loading' && !blobUrl && (
            <div className='flex flex-col items-center gap-2'>
              <Loader2 className='w-6 h-6 text-zinc-600 animate-spin' />
              <span className='text-[10px] font-poppins text-zinc-600'>Loading preview...</span>
            </div>
          )}
          {imgState === 'error' && (
            <div className='flex flex-col items-center gap-2 p-6'>
              <AlertTriangle className='w-8 h-8 text-zinc-600' />
              <span className='text-xs font-poppins text-zinc-500 text-center max-w-[280px]'>
                {errorMsg}
              </span>
            </div>
          )}
          {blobUrl && (
            <img
              src={blobUrl}
              alt={file.file_name}
              className={`max-w-[85vw] max-h-[75vh] object-contain ${imgState === 'loaded' ? '' : 'hidden'}`}
              onLoad={() => setImgState('loaded')}
              onError={() => {
                setImgState('error');
                setErrorMsg('Image could not be rendered.');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
