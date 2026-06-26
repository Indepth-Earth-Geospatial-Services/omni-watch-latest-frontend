'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  LogOut,
  Settings,
  Loader2,
  Brain,
  Bell,
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
  // {
  //   name: 'Reports',
  //   href: process.env.NEXT_PUBLIC_REPORTS_URL || '/reports',
  //   icon: FileText,
  // },
  // { name: 'User Management', href: '/users', icon: Users },
  // { name: 'System Logs', href: '/logs', icon: Terminal },
];

const projectsLink = { name: 'Projects', href: '/projects', icon: FolderOpen };

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function handleSignOut() {
    setIsLoggingOut(true);
    logout();
    router.push('/sign-in');
  }

  // Derive display values from live user profile, fall back gracefully while loading
  const displayName = user?.username ?? '—';
  const displayRole = user?.user_type === 1 ? 'Admin' : user ? 'Operator' : '—';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 bg-card border-r border-border flex flex-col',
        'transition-all duration-300 z-[100]',
        collapsed ? 'w-16' : 'w-50 lg:w-64',
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-border',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <Link href='/' className='flex items-center'>
          <Satellite className={cn('h-5 w-5 text-sky-400', collapsed ? '' : 'mr-2')} />
          {!collapsed && (
            <h1 className='text-lg font-bold text-sky-400'>OmniWach OS</h1>
          )}
        </Link>
      </div>

      {/* Navigation */}
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

      {/* Projects shortcut — separated from main nav, above the user footer */}
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

      {/* User footer */}
      <div className={cn(
        'border-t border-border',
        collapsed ? 'p-2' : 'p-4 space-y-3'
      )}>
        {!collapsed && (
          <div className='text-sm text-muted-foreground'>
            {displayName}
            <br />
            <span className='text-xs'>{displayRole}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          title={collapsed ? (isLoggingOut ? 'Signing out…' : 'Sign Out') : undefined}
          className={cn(
            'flex items-center text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-60',
            collapsed ? 'justify-center w-full' : ''
          )}
        >
          {isLoggingOut ? (
            <Loader2 className={cn('h-3 w-3 animate-spin', !collapsed && 'mr-1')} />
          ) : (
            <LogOut className={cn('h-3 w-3', !collapsed && 'mr-1')} />
          )}
          {!collapsed && (isLoggingOut ? 'Signing out…' : 'Sign Out')}
        </button>
      </div>

      {/* Collapse toggle — desktop only */}
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
