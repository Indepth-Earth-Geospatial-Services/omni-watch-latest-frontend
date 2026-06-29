'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, Loader2, Users } from 'lucide-react';
import type { DJIWorkspaceUser, UpdateDJIWorkspaceUserRequest } from '@/lib/types';

interface PilotUsersTabProps {
  users: DJIWorkspaceUser[];
  isLoading: boolean;
  onUpdate: (userId: string, body: UpdateDJIWorkspaceUserRequest) => void;
  isUpdating: boolean;
}

const PilotUsersTab = ({ users, isLoading, onUpdate, isUpdating }: PilotUsersTabProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mqttUsername, setMqttUsername] = useState('');
  const [mqttPassword, setMqttPassword] = useState('');

  useEffect(() => {
    setEditingId(null);
  }, [users]);

  const startEdit = (user: DJIWorkspaceUser) => {
    setEditingId(user.user_id);
    setMqttUsername(user.mqtt_username);
    setMqttPassword(user.mqtt_password);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMqttUsername('');
    setMqttPassword('');
  };

  const saveEdit = (userId: string) => {
    onUpdate(userId, {
      mqtt_username: mqttUsername,
      mqtt_password: mqttPassword,
    });
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className='bg-card border border-zinc-800/50 rounded-xl overflow-hidden'>
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-zinc-800/50'>
              {['Account', 'MQTT Username', 'MQTT Password', 'Joined', 'Actions'].map(
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
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-24' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-24' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-20' /></td>
                <td className='px-4 py-3'><div className='h-3.5 bg-zinc-800 rounded animate-pulse w-8' /></td>
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
          No pilot users found.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-card border border-zinc-800/50 rounded-xl overflow-hidden'>
      <table className='w-full text-left'>
        <thead>
          <tr className='border-b border-zinc-800/50'>
            {['Account', 'MQTT Username', 'MQTT Password', 'Joined', 'Actions'].map(
              (col) => (
                <th key={col} className='px-4 py-3 text-[11px] font-ui font-medium text-zinc-500 uppercase'>
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isEditing = editingId === user.user_id;
            return (
              <tr
                key={user.user_id}
                className={`border-b border-zinc-800/20 hover:bg-zinc-800/30 transition-colors ${
                  isEditing ? 'bg-zinc-800/20' : ''
                }`}
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
                  {isEditing ? (
                    <input
                      type='text'
                      value={mqttUsername}
                      onChange={(e) => setMqttUsername(e.target.value)}
                      className='w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-ui text-foreground focus:outline-none focus:border-zinc-500'
                    />
                  ) : (
                    <span className='text-xs font-mono font-ui text-zinc-400'>
                      {user.mqtt_username}
                    </span>
                  )}
                </td>

                <td className='px-4 py-3'>
                  {isEditing ? (
                    <input
                      type='password'
                      value={mqttPassword}
                      onChange={(e) => setMqttPassword(e.target.value)}
                      className='w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-ui text-foreground focus:outline-none focus:border-zinc-500'
                    />
                  ) : (
                    <span className='text-xs font-mono font-ui text-zinc-400'>
                      {'••••••••'}
                    </span>
                  )}
                </td>

                <td className='px-4 py-3'>
                  <span className='text-xs font-mono font-ui text-zinc-400'>
                    {new Date(user.created_at || user.create_time).toLocaleDateString()}
                  </span>
                </td>

                <td className='px-4 py-3'>
                  {isEditing ? (
                    <div className='flex items-center gap-1'>
                      <button
                        onClick={() => saveEdit(user.user_id)}
                        disabled={isUpdating}
                        className='p-1.5 rounded hover:bg-zinc-700/50 transition-colors disabled:opacity-50'
                        title='Save changes'
                      >
                        {isUpdating ? (
                          <Loader2 size={14} className='text-emerald-400 animate-spin' />
                        ) : (
                          <Check size={14} className='text-emerald-400' />
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className='p-1.5 rounded hover:bg-zinc-700/50 transition-colors'
                        title='Cancel'
                      >
                        <X size={14} className='text-zinc-500' />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      className='p-1.5 rounded hover:bg-zinc-700/50 transition-colors'
                      title='Edit MQTT credentials'
                    >
                      <Pencil size={14} className='text-zinc-500' />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className='flex items-center justify-center py-3 border-t border-zinc-800/50'>
        <span className='text-xs font-ui text-zinc-600'>
          {users.length} pilot user{users.length !== 1 ? 's' : ''} total
        </span>
      </div>
    </div>
  );
};

export default PilotUsersTab;
