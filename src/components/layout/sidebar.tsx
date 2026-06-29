'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Satellite,
  Gauge,
  Video,
  Globe,
  FolderOpen,
  FileText,
  Users,
  Terminal,
  Settings,
  Brain,
  Bell,
  Film,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/contexts/SidebarContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Gauge },
  { name: 'Live Feeds', href: '/live-feed', icon: Video },
  { name: 'Geospatial Map', href: '/geospatial', icon: Globe },
  { name: 'Control', href: '/control', icon: Settings },
  { name: 'AI Detection', href: '/ai-detection', icon: Brain },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Media Files', href: '/media', icon: Film },
  { name: 'Task Plan Library', href: '/task', icon: Calendar },
];

const projectsLink = { name: 'Projects', href: '/projects', icon: FolderOpen };

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { collapsed, toggle } = useSidebar();

  const displayName = user?.username ?? '—';
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 bg-card border-r border-border flex flex-col',
        'transition-all duration-300 z-[100]',
        collapsed ? 'w-16' : 'w-50 lg:w-64',
        className
      )}
    >
      <div className={cn(
        'flex items-center h-16 border-b border-border',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <Link href='/' className='flex items-center'>
          <Satellite className={cn('h-5 w-5 text-sky-400', collapsed ? '' : 'mr-2')} />
          {!collapsed && (
            <h1 className='text-lg font-bold text-sky-400'>OMNIWATCH</h1>
          )}
        </Link>
      </div>

      <nav className='mt-4 flex-1 space-y-1'>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center text-sm font-medium rounded-none transition-colors',
                collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
                isActive
                  ? 'bg-graybg border-l-2 border-sky-500 text-foreground'
                  : 'text-muted-foreground hover:bg-graybg hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', !collapsed && 'mr-3')} />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      <div className='border-t border-border'>
        <Link
          href={projectsLink.href}
          title={collapsed ? projectsLink.name : undefined}
          className={cn(
            'flex items-center text-sm font-medium rounded-none transition-colors',
            collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
            pathname === projectsLink.href
              ? 'bg-graybg border-l-2 border-sky-500 text-foreground'
              : 'text-muted-foreground hover:bg-graybg hover:text-foreground'
          )}
        >
          <projectsLink.icon className={cn('h-4 w-4', !collapsed && 'mr-3')} />
          {!collapsed && projectsLink.name}
        </Link>
      </div>

      <div className='hidden lg:block border-t border-border'>
        <button
          onClick={toggle}
          className='flex items-center justify-center w-full py-3 text-muted-foreground hover:bg-graybg hover:text-foreground transition-colors'
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className='h-4 w-4' />
          ) : (
            <>
              <ChevronLeft className='h-4 w-4 mr-2' />
              <span className='text-xs'>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
