'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface EmptyPageProps {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action: { label: string; onClick: () => void };
}

export function EmptyPage({ icon, title, body, action }: EmptyPageProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 py-24 text-center font-ui'>
      <div className='w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center'>
        {icon}
      </div>
      <div className='max-w-xs'>
        <h2 className='text-base font-bold text-zinc-200'>{title}</h2>
        <p className='text-sm text-zinc-500 mt-1.5 leading-relaxed'>{body}</p>
      </div>
      <button
        onClick={action.onClick}
        className='flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-bold rounded-xl transition-colors'
      >
        <ChevronRight size={13} />
        {action.label}
      </button>
    </div>
  );
}
