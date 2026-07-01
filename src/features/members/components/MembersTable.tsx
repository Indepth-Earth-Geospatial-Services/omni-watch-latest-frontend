'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Pencil, Loader2, AlertCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataTable } from '@/components/molecules/data-table/data-table';
import { createColumns, getInitials, getAvatarColor, formatDate } from './columns';
import type { OrgUser } from '@/lib/types';

interface MembersTableProps {
  members: OrgUser[];
  isLoading: boolean;
  error: Error | null;
  searchTerm?: string;
  onEdit: (member: OrgUser) => void;
}

export default function MembersTable({ members, isLoading, error, searchTerm = '', onEdit }: MembersTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Filter members for mobile view
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q)
    );
  }, [members, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  if (error) {
    return (
      <div className='w-full bg-secondary rounded-lg border border-border/50 p-8 text-center font-ui'>
        <div className='flex flex-col items-center gap-2'>
          <AlertCircle className='w-7 h-7 text-red-400' />
          <span className='text-sm text-muted-foreground'>Failed to load members</span>
          <span className='text-xs text-red-400/80 font-mono max-w-[380px]'>{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-[calc(100%-2rem)] mx-4 font-ui'>
      {/* Desktop view */}
      <div className='hidden md:block'>
        <DataTable
          columns={createColumns(onEdit)}
          data={members}
          isLoading={isLoading}
          searchTerm={searchTerm}
          searchableKeys={['full_name' as keyof OrgUser, 'email' as keyof OrgUser]}
          emptyTableText='No members found. Add one to get started.'
          itemLable='member'
          pageSize={10}
          className='bg-secondary border border-border/50 rounded-lg shadow-none'
          classNameHeader='bg-card text-muted-foreground'
          classNameTableHead='text-[10px] font-bold tracking-widest text-muted-foreground uppercase'
          classNameRow='hover:bg-white/[0.02]'
          classNameCell='text-foreground'
        />
      </div>

      {/* Mobile Card List (Visible only on mobile/tablet) */}
      <div className='md:hidden flex flex-col gap-3'>
        {isLoading ? (
          Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className='bg-secondary rounded-lg border border-border/50 p-4 space-y-3 animate-pulse'>
              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-full bg-secondary' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 w-28 bg-secondary rounded' />
                  <div className='h-3 w-40 bg-secondary/70 rounded' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-3 pt-3 border-t border-border/30'>
                <div className='h-4 bg-secondary rounded' />
                <div className='h-4 bg-secondary rounded' />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className='bg-secondary rounded-lg border border-border p-8 text-center'>
            <Users className='w-8 h-8 text-zinc-700 mx-auto mb-2' />
            <p className='text-sm text-muted-foreground'>
              {searchTerm ? 'No members match your search.' : 'No members found. Add one to get started.'}
            </p>
          </div>
        ) : (
          <>
            {paginated.map((member) => {
              const active = member.is_active;
              const initials = getInitials(member.full_name);
              const avatarColor = getAvatarColor(member.id);

              return (
                <div
                  key={member.id}
                  className='bg-secondary rounded-lg border border-border p-4 space-y-3 font-ui relative'
                >
                  {/* Header */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                        <span className='text-xs font-bold text-white'>{initials}</span>
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-bold text-foreground truncate'>
                          {member.full_name}
                        </p>
                        <p className='text-xs text-muted-foreground truncate'>
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onEdit(member)}
                      className='p-1.5 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors'
                      title='Edit member'
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className='grid grid-cols-2 gap-3 pt-3 border-t border-border/30 text-xs'>
                    <div>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Role</span>
                      <span className='text-muted-foreground block mt-0.5'>Member</span>
                    </div>

                    <div>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mt-0.5 ${
                          active
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className='col-span-2'>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Last Login</span>
                      <span className='font-mono text-muted-foreground block mt-0.5'>
                        {member.last_login ? formatDate(member.last_login) : '\u2014'}
                      </span>
                    </div>

                    <div className='col-span-2'>
                      <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-wider block'>Joined</span>
                      <span className='font-mono text-muted-foreground block mt-0.5'>
                        {formatDate(member.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination for mobile */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between px-4 py-3 border border-border/50 bg-secondary rounded-lg mt-1'>
                <span className='text-[10px] text-muted-foreground'>
                  Showing <span className='text-muted-foreground font-semibold'>{paginated.length}</span> of{' '}
                  <span className='text-muted-foreground font-semibold'>{filtered.length}</span>
                </span>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-zinc-900/50'
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-7 h-7 rounded text-[11px] font-bold border transition-colors
                        ${
                          page === n
                            ? 'bg-theme-accent border-theme-accent text-white'
                            : 'border-border text-muted-foreground bg-zinc-900/50'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className='p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-zinc-900/50'
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
