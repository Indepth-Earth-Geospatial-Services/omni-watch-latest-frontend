'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { X, Palette, Sparkles } from 'lucide-react';
import AISettingsTab from './AISettingsTab';

const THEMES = [
  {
    id: 'dark',
    name: 'Dark',
    description: 'Default dark theme',
    colors: ['#0a0a0a', '#1C93FF', '#27272a', '#fafafa'],
    font: 'Poppins + JetBrains Mono',
  },
  {
    id: 'theme-midnight-phantom',
    name: 'Midnight Phantom',
    description: 'Stealth/Clinical — Deep obsidian blue',
    colors: ['#0B0F19', '#00FFCC', '#FF3B30', '#E2E8F0'],
    font: 'JetBrains Mono + Inter',
  },
  {
    id: 'theme-cyber-trench',
    name: 'Cyber Trench',
    description: 'Tactical/Military — Trench charcoal',
    colors: ['#121214', '#FFB300', '#FF453A', '#CFD8DC'],
    font: 'Share Tech Mono + Roboto Flex',
  },
  {
    id: 'theme-deep-matrix',
    name: 'Deep Matrix',
    description: 'Sovereign AI — Void black',
    colors: ['#070A0E', '#10B981', '#F59E0B', '#ECFDF5'],
    font: 'Space Grotesk + Space Mono',
  },
  {
    id: 'theme-solar-eclipse',
    name: 'Solar Eclipse',
    description: 'Aerospace Grid — Eclipse purple-black',
    colors: ['#0D0B14', '#2563EB', '#F43F5E', '#F3F4F6'],
    font: 'Plus Jakarta Sans + IBM Plex Mono',
  },
  {
    id: 'theme-absolute-zero',
    name: 'Absolute Zero',
    description: 'Monolithic/Stark — True pitch black',
    colors: ['#000000', '#94A3B8', '#FF0055', '#FFFFFF'],
    font: 'DM Sans + Geist Mono',
  },
];

type Tab = 'theme' | 'ai';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('theme');

  if (!open) return null;

  const handleSetTheme = (id: string) => {
    setTheme(id);
  };

  return (
    <div className='fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center'>
      <div className='bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl shadow-black/60'>
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg'>
              <Palette size={16} className='text-sky-400' />
            </div>
            <h3 className='text-lg font-semibold font-ui text-foreground'>Settings</h3>
          </div>
          <button onClick={onClose} className='p-1 hover:bg-secondary rounded transition-colors'>
            <X className='w-5 h-5 text-muted-foreground' />
          </button>
        </div>

        <div className='px-6 pb-4'>
          <div className='flex items-center gap-0.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg'>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'theme'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Palette size={11} />
              Theme
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'ai'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles size={11} />
              AI
            </button>
          </div>
        </div>

        {activeTab === 'theme' ? (
          <div className='px-6 pb-6 grid grid-cols-2 gap-3'>
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSetTheme(t.id)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30'
                      : 'border-border bg-secondary/50 hover:border-zinc-600 hover:bg-secondary/50'
                  }`}
                >
                  {isActive && (
                    <div className='absolute top-2 right-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center'>
                      <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='3'>
                        <path d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}

                  <div className='flex items-center gap-1.5 mb-2'>
                    {t.colors.map((c, i) => (
                      <div
                        key={i}
                        className='w-4 h-4 rounded-full border border-border'
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <p className='text-sm font-bold font-ui text-foreground'>{t.name}</p>
                  <p className='text-[10px] font-ui text-muted-foreground mt-0.5'>{t.description}</p>
                  <p className='text-[9px] font-mono text-muted-foreground mt-1'>{t.font}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <AISettingsTab />
        )}

        <div className='px-6 pb-5'>
          <button
            onClick={onClose}
            className='w-full py-2 text-xs font-bold font-ui text-muted-foreground border border-border rounded-lg hover:border-zinc-500 hover:text-foreground transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
