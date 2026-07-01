'use client';

import React from 'react';
import { Users } from 'lucide-react';
import type { DJIWorkspaceUser } from '@/lib/types';

interface WebUsersTabProps {
  users: DJIWorkspaceUser[];
  isLoading: boolean;
}

const WebUsersTab = ({ users, isLoading }: WebUsersTabProps) => {
  if (isLoading) {
    return (
      <div className='bg-card border border-zinc-800/50 rounded-xl overflow-hidden'>
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-zinc-800/50'>
              {['Account', 'Workspace', 'Joined'].map(
                (col) => (
                  <th key={col} className='px-4 py-3 text-[11px] font-ui font-medium text-zinc-500 uppercase'>
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className='border-b border-zinc-800/20'>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-32' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-28' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-20' /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Users size={16} className='text-zinc-600' />
        <p className='text-sm font-ui text-zinc-600 mt-2'>
          No web users found.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-card border border-zinc-800/50 rounded-xl overflow-hidden'>
      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-zinc-800/50'>
            {['Account', 'Workspace', 'Joined'].map(
              (col) => (
                <th key={col} className='px-4 py-3 text-[11px] font-ui font-medium text-zinc-500 uppercase'>
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.user_id}
              className='border-b border-zinc-800/20 hover:bg-zinc-800/30 transition-colors'
            >
              <td className='px-4 py-3'>
                <span className='text-sm font-ui text-foreground truncate max-w-[240px] block'>
                  {user.username}
                </span>
                <span className='text-xs font-ui text-zinc-500 block'>
                  {user.email}
                </span>
              </td>

              <td className='px-4 py-3'>
                <span className='text-xs font-ui text-zinc-400'>
                  {user.workspace_name}
                </span>
              </td>

              <td className='px-4 py-3'>
                <span className='text-xs font-mono font-ui text-zinc-400'>
                  {new Date(user.created_at || user.create_time).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='flex items-center justify-center py-3 border-t border-zinc-800/50'>
        <span className='text-xs font-ui text-zinc-600'>
          {users.length} web user{users.length !== 1 ? 's' : ''} total
        </span>
      </div>
    </div>
  );
};

export default WebUsersTab;
