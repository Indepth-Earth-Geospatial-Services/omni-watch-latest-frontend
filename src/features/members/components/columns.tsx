import { ColumnDef } from '@tanstack/react-table';
import { Pencil, User } from 'lucide-react';
import type { OrgUser } from '@/lib/types';

export const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-teal-600',
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function createColumns(onEdit: (member: OrgUser) => void): ColumnDef<OrgUser>[] {
  return [
    {
      accessorFn: (row) => `${row.full_name} ${row.email}`,
      id: 'member',
      header: 'Member',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className='flex items-center gap-3'>
            <div
              className={`w-10 h-10 rounded-full ${getAvatarColor(m.id)} flex items-center justify-center flex-shrink-0`}
            >
              <span className='text-xs font-bold text-white'>
                {getInitials(m.full_name)}
              </span>
            </div>
            <div className='flex flex-col min-w-0'>
              <span className='text-sm font-medium text-zinc-200 truncate'>
                {m.full_name}
              </span>
              <span className='text-xs text-zinc-500 truncate'>
                {m.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Role',
      cell: () => (
        <div className='flex items-center gap-2 text-sm text-zinc-300'>
          <User className='w-4 h-4 text-zinc-500' />
          <span>Member</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.is_active;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
              active
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      accessorKey: 'last_login',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className='text-sm text-zinc-500 font-mono tabular-nums'>
          {row.original.last_login ? formatDate(row.original.last_login) : '\u2014'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className='text-sm text-zinc-500 font-mono tabular-nums'>
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <button
            onClick={() => onEdit(row.original)}
            className='p-2 text-zinc-600 hover:text-white transition-colors'
            title='Edit member'
          >
            <Pencil size={16} />
          </button>
        </div>
      ),
    },
  ];
}
