'use client';

import { useState } from 'react';
import { Loader2, Settings2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useDeviceConfigs, useUpdateDeviceConfig } from '@/hooks/useDeviceConfig';
import AIDeviceConfigModal from './AIDeviceConfigModal';
import type { DeviceConfig } from '@/lib/types';

export default function AISettingsTab() {
  const { data: deviceConfigs = [], isLoading } = useDeviceConfigs();
  const { mutate: updateConfig, isPending } = useUpdateDeviceConfig();
  const [configTarget, setConfigTarget] = useState<DeviceConfig | null>(null);

  const handleToggleAI = (device: DeviceConfig, enabled: boolean) => {
    let parsedClasses: string[] = [];
    try {
      const parsed = JSON.parse(device.targetClasses.replace(/'/g, '"'));
      if (Array.isArray(parsed)) parsedClasses = parsed;
    } catch {
      // keep empty
    }

    updateConfig({
      deviceSn: device.device_sn,
      targetClasses: JSON.stringify(parsedClasses).replace(/"/g, "'"),
      ai_enabled: enabled,
    });
  };

  const parseClasses = (targetClasses: string): string[] => {
    try {
      const parsed = JSON.parse(targetClasses.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className='px-6 pb-6 flex items-center justify-center py-8'>
        <Loader2 size={16} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='px-6 pb-6'>
      <div className='space-y-2'>
        {deviceConfigs.length === 0 ? (
          <p className='text-xs text-muted-foreground text-center py-6'>
            No devices found. Assign devices to a project first.
          </p>
        ) : (
          deviceConfigs.map((device) => {
            const classes = parseClasses(device.targetClasses);
            return (
              <div
                key={device.device_sn}
                className='flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors'
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-bold font-ui text-foreground truncate'>
                    {device.name || device.device_sn}
                  </p>
                  <p className='text-[10px] font-mono text-muted-foreground truncate'>
                    {device.device_sn}
                  </p>
                  {classes.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-1.5'>
                      {classes.map((cls) => (
                        <span
                          key={cls}
                          className='inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    onClick={() => setConfigTarget(device)}
                    className='p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
                    title='Configure classes'
                  >
                    <Settings2 size={13} />
                  </button>
                  <Switch
                    checked={device.ai_enabled}
                    onCheckedChange={(checked) => handleToggleAI(device, checked)}
                    disabled={isPending}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {configTarget && (
        <AIDeviceConfigModal
          open={!!configTarget}
          onClose={() => setConfigTarget(null)}
          device={configTarget}
        />
      )}
    </div>
  );
}
