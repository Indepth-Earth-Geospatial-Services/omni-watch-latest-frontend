'use client';
import { memo } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';

interface ElementContextMenuProps {
  x: number;
  y: number;
  elementName: string;
  isPending: boolean;
  onDelete: () => void;
  onClose: () => void;
}

export const ElementContextMenu = memo(
  ({ x, y, elementName, isPending, onDelete, onClose }: ElementContextMenuProps) => (
    <>
      {/* Full-map invisible overlay — click anywhere outside to dismiss */}
      <div className='absolute inset-0 z-20' onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      <div
        className='absolute z-30 min-w-[180px] bg-neutral-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden'
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Element name header */}
        <div className='px-3 py-2 text-[11px] text-gray-400 font-medium truncate border-b border-gray-700/50 max-w-[220px]'>
          {elementName}
        </div>

        {/* Delete action */}
        <button
          onClick={onDelete}
          disabled={isPending}
          className='w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isPending ? (
            <Loader2 className='w-3.5 h-3.5 animate-spin flex-shrink-0' />
          ) : (
            <Trash2 className='w-3.5 h-3.5 flex-shrink-0' />
          )}
          Delete Element
        </button>

        {/* Cancel */}
        <button
          onClick={onClose}
          className='w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-800/50 hover:text-gray-300 transition-colors border-t border-gray-800/60'
        >
          <X className='w-3.5 h-3.5 flex-shrink-0' />
          Cancel
        </button>
      </div>
    </>
  )
);

ElementContextMenu.displayName = 'ElementContextMenu';
