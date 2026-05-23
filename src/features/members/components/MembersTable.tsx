'use client';

import { DataTable } from '@/components/molecules/data-table/data-table';
import { createColumns } from './columns';
import type { OrgUser } from '@/lib/types';

interface MembersTableProps {
  members: OrgUser[];
  isLoading: boolean;
  error: Error | null;
  searchTerm?: string;
  onEdit: (member: OrgUser) => void;
}

export default function MembersTable({ members, isLoading, error, searchTerm, onEdit }: MembersTableProps) {
  if (error) {
    return (
      <div className='w-full bg-[#1D2026] rounded-lg border border-zinc-800/50 p-8 text-center'>
        <p className='text-red-400 text-sm'>Failed to load members: {error.message}</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={createColumns(onEdit)}
      data={members}
      isLoading={isLoading}
      searchTerm={searchTerm}
      searchableKeys={['full_name' as keyof OrgUser, 'email' as keyof OrgUser]}
      emptyTableText='No members found. Add one to get started.'
      itemLable='member'
      pageSize={10}
      className='bg-[#1D2026] border border-zinc-800/50 rounded-lg shadow-none'
      classNameHeader='bg-[#191C22] text-muted-foreground'
      classNameTableHead='text-[10px] font-bold tracking-widest text-zinc-500 uppercase'
      classNameRow='hover:bg-white/[0.02]'
      classNameCell='text-zinc-200'
    />
  );
}
