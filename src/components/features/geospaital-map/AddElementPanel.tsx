'use client';
import { memo } from 'react';
import { X, MapPin, Loader2, CheckCircle } from 'lucide-react';
import type { ElementGroup } from '@/lib/types';

interface AddElementPanelProps {
  elementGroups: ElementGroup[];
  selectedGroupId: string;
  elementName: string;
  hasClickTarget: boolean;
  isPending: boolean;
  onGroupChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const AddElementPanel = memo(
  ({
    elementGroups,
    selectedGroupId,
    elementName,
    hasClickTarget,
    isPending,
    onGroupChange,
    onNameChange,
    onSave,
    onCancel,
  }: AddElementPanelProps) => (
    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-neutral-950/95 border border-blue-700/60 rounded-xl p-4 w-80 shadow-2xl backdrop-blur-sm'>
      {/* Header */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <MapPin className='w-4 h-4 text-blue-400' />
          <span className='font-semibold text-sm'>Add Map Element</span>
        </div>
        <button
          onClick={onCancel}
          className='text-gray-500 hover:text-white transition-colors'
          aria-label='Cancel'
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      <div className='space-y-3'>
        {/* Layer group selector */}
        <div>
          <label className='block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
            Layer Group
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => onGroupChange(e.target.value)}
            className='w-full p-2 border border-gray-700 bg-neutral-900 rounded-lg text-sm focus:border-blue-500 outline-none'
          >
            <option value='' disabled>
              Select a group…
            </option>
            {elementGroups.map((g) => (
              <option key={g.id} value={g.id} disabled={g.is_lock}>
                {g.name}
                {g.is_lock ? ' 🔒' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Element name */}
        <div>
          <label className='block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1'>
            Element Name
          </label>
          <input
            type='text'
            value={elementName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder='e.g. Waypoint Alpha'
            className='w-full p-2 border border-gray-700 bg-neutral-900 rounded-lg text-sm placeholder:text-gray-600 focus:border-blue-500 outline-none'
          />
        </div>

        {/* Map click instruction */}
        <div
          className={`flex items-center gap-2 text-xs rounded-lg p-2.5 border ${
            hasClickTarget
              ? 'border-green-700 bg-green-950/30 text-green-400'
              : 'border-blue-800/60 bg-blue-950/20 text-blue-400'
          }`}
        >
          {hasClickTarget ? (
            <CheckCircle className='w-3.5 h-3.5 flex-shrink-0' />
          ) : (
            <MapPin className='w-3.5 h-3.5 flex-shrink-0 animate-bounce' />
          )}
          {hasClickTarget
            ? 'Location captured. Fill details above and save.'
            : 'Click anywhere on the map to place the point.'}
        </div>

        {/* Action buttons — only shown once user clicked the map */}
        {hasClickTarget && (
          <div className='flex gap-2 pt-1'>
            <button
              onClick={onCancel}
              className='flex-1 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!selectedGroupId || !elementName.trim() || isPending}
              className='flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm transition-colors'
            >
              {isPending ? (
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <MapPin className='w-3.5 h-3.5' />
              )}
              Save Element
            </button>
          </div>
        )}
      </div>
    </div>
  )
);

AddElementPanel.displayName = 'AddElementPanel';
