'use client';

import React from 'react';
import {
  ShieldCheck,
  Eye,
  User,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

interface Operative {
  id: string;
  name: string;
  email: string;
  image?: string;
  initials?: string;
  role: 'Administrator' | 'Operator' | 'Viewer';
  status: 'ACTIVE' | 'NOT ACTIVE';
  lastTelemetry: string;
}

const operatives: Operative[] = [
  {
    id: '1',
    name: 'Elias Vance',
    email: 'evance@sector7.net',
    role: 'Administrator',
    status: 'ACTIVE',
    lastTelemetry: '2023-10-27 14:32Z',
  },
  {
    id: '2',
    name: 'Sarah Lin',
    email: 'slin@sector7.net',
    initials: 'SL',
    role: 'Operator',
    status: 'NOT ACTIVE',
    lastTelemetry: '2023-10-27 12:15Z',
  },
  {
    id: '3',
    name: 'Maya Rostova',
    email: 'mrostova@external.org',
    role: 'Viewer',
    status: 'ACTIVE',
    lastTelemetry: '--',
  },
  {
    id: '4',
    name: 'John Doe',
    email: 'jdoe@sector7.net',
    initials: 'JD',
    role: 'Operator',
    status: 'NOT ACTIVE',
    lastTelemetry: '2023-10-20 08:00Z',
  },
];

const MemberTable = () => {
  return (
    <div className='w-full overflow-x-auto bg-secondary rounded-lg border border-border/15'>
      <table className='w-full text-left border-collapse'>
        <thead>
          <tr className='border-b border-border/50 bg-card'>
            <th className='px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
              Operative
            </th>
            <th className='px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
              Clearance Level
            </th>
            <th className='px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
              Status
            </th>
            <th className='px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
              Last Telemetry
            </th>
            <th className='px-6 py-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-right'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border/30'>
          {operatives.map((op) => (
            <tr
              key={op.id}
              className='hover:bg-white/[0.02] transition-colors group'
            >
              {/* 1. Operative Identity */}
              <td className='px-6 py-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden border border-border'>
                    {op.initials ? (
                      <span className='text-xs font-bold text-muted-foreground'>
                        {op.initials}
                      </span>
                    ) : (
                      <div className='bg-cyan-900/20 w-full h-full flex items-center justify-center text-cyan-400'>
                        <User size={18} />
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>
                      {op.name}
                    </span>
                    <span className='text-xs text-muted-foreground'>{op.email}</span>
                  </div>
                </div>
              </td>

              {/* 2. Clearance Level */}
              <td className='px-6 py-4'>
                <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                  {op.role === 'Administrator' && (
                    <ShieldCheck className='w-4 h-4 text-yellow-500' />
                  )}
                  {op.role === 'Operator' && (
                    <Eye className='w-4 h-4 text-blue-400' />
                  )}
                  {op.role === 'Viewer' && (
                    <User className='w-4 h-4 text-muted-foreground' />
                  )}
                  <span>{op.role}</span>
                  {op.role !== 'Administrator' && (
                    <ChevronDown className='w-3 h-3 text-muted-foreground' />
                  )}
                </div>
              </td>

              {/* 3. Status Badge */}
              <td className='px-6 py-4'>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider
                  ${
                    op.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {op.status}
                </span>
              </td>

              {/* 4. Last Telemetry */}
              <td className='px-6 py-4 text-sm text-muted-foreground font-mono'>
                {op.lastTelemetry}
              </td>

              {/* 5. Actions */}
              <td className='px-6 py-4 text-right'>
                <button className='p-2 text-muted-foreground hover:text-foreground transition-colors'>
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberTable;
