'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAIClasses } from '@/hooks/useAIClasses';
import { useUpdateDeviceConfig } from '@/hooks/useDeviceConfig';
import type { DeviceConfig } from '@/lib/types';

interface AIDeviceConfigModalProps {
  open: boolean;
  onClose: () => void;
  device: DeviceConfig;
}

export default function AIDeviceConfigModal({ open, onClose, device }: AIDeviceConfigModalProps) {
  const { data: aiClasses = [] } = useAIClasses();
  const { mutate: updateConfig, isPending } = useUpdateDeviceConfig();

  const parsedTargetClasses: string[] = (() => {
    try {
      const parsed = JSON.parse(device.targetClasses.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const [aiEnabled, setAiEnabled] = useState(device.ai_enabled);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    new Set(parsedTargetClasses)
  );

  useEffect(() => {
    if (open) {
      setAiEnabled(device.ai_enabled);
      try {
        const parsed = JSON.parse(device.targetClasses.replace(/'/g, '"'));
        setSelectedClasses(new Set(Array.isArray(parsed) ? parsed : []));
      } catch {
        setSelectedClasses(new Set());
      }
    }
  }, [open, device]);

  if (!open) return null;

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(className)) next.delete(className);
      else next.add(className);
      return next;
    });
  };

  const handleSave = () => {
    updateConfig(
      {
        deviceSn: device.device_sn,
        targetClasses: JSON.stringify(Array.from(selectedClasses)).replace(/"/g, "'"),
        ai_enabled: aiEnabled,
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className='fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm flex items-center justify-center'>
      <div className='bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl shadow-black/60'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <div>
            <h3 className='text-lg font-semibold font-ui text-foreground'>AI Configuration</h3>
            <p className='text-xs text-muted-foreground mt-0.5 font-mono'>
              {device.name || device.device_sn}
            </p>
          </div>
          <button onClick={onClose} className='p-1 hover:bg-secondary rounded transition-colors'>
            <X className='w-5 h-5 text-muted-foreground' />
          </button>
        </div>

        <div className='px-6 pb-4'>
          <div className='flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border'>
            <div>
              <p className='text-sm font-semibold font-ui text-foreground'>Enable AI Detection</p>
              <p className='text-[10px] text-muted-foreground mt-0.5'>
                Toggle AI-powered threat detection for this device
              </p>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </div>

        <div className='px-6 pb-4'>
          <p className='text-xs font-semibold font-ui text-muted-foreground uppercase tracking-wider mb-3'>
            Detection Classes
          </p>
          <div className='grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1'>
            {aiClasses.map((cls) => {
              const isSelected = selectedClasses.has(cls.name);
              return (
                <button
                  key={cls.id}
                  onClick={() => toggleClass(cls.name)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-sky-500/60 bg-sky-500/10'
                      : 'border-border bg-secondary/30 hover:border-zinc-600'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500'
                        : 'border-zinc-600 bg-transparent'
                    }`}
                  >
                    {isSelected && (
                      <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='3'>
                        <path d='M5 13l4 4L19 7' />
                      </svg>
                    )}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-bold font-ui text-foreground'>{cls.name}</p>
                    <p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-2'>
                      {cls.description}
                    </p>
                  </div>
                </button>
              );
            })}
            {aiClasses.length === 0 && (
              <p className='col-span-2 text-xs text-muted-foreground text-center py-4'>
                No AI classes available
              </p>
            )}
          </div>
        </div>

        <div className='px-6 pb-5 flex gap-2'>
          <button
            onClick={onClose}
            className='flex-1 py-2 text-xs font-bold font-ui text-muted-foreground border border-border rounded-lg hover:border-zinc-500 hover:text-foreground transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className='flex-1 py-2 text-xs font-bold font-ui text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {isPending && <Loader2 size={12} className='animate-spin' />}
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
