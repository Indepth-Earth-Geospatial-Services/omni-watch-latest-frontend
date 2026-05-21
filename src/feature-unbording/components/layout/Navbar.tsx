'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Settings, LogOut, User, ChevronDown, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface NavItem {
  label: string;
  href: string;
}

const navConfig: NavItem[] = [
  { label: 'PROJECT', href: '/projects' },
  { label: 'ASSETS', href: '/assets' },
  { label: 'MEMBERS', href: '/member' },
  { label: 'FLIGHT ROUTES', href: '/flightroutes' },
];

const Navbar = () => {
  const activePath = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setDropdownOpen(false);
    logout();
    router.push('/sign-in');
  };

  // Derive display name — fall back to truncated user_id
  const displayName =
    user?.username || (user?.user_id ? `User ${user.user_id.slice(0, 8)}` : 'User');
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className='flex items-center justify-between w-full h-16 px-6 bg-black border-b border-zinc-800'>
      {/* 1. Brand Logo */}
      <div className='flex items-center flex-shrink-0'>
        <Link href='/' className='transition-opacity hover:opacity-80 focus:outline-none'>
          <Image
            src='/iegs-logo.png'
            alt='IEGS Logo'
            width={50}
            height={18}
            className='invert brightness-0'
          />
        </Link>
      </div>

      {/* 2. Center Navigation */}
      <div className='hidden md:flex items-center space-x-8 h-full'>
        {navConfig.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex items-center h-full text-sm font-semibold font-poppins tracking-widest transition-colors focus:outline-none
                ${isActive ? 'text-[#A00000]' : 'text-zinc-400 hover:text-white'}`}
            >
              {item.label}
              {isActive && (
                <span className='absolute bottom-0 left-0 w-full h-[2px] bg-[#FF0000]' />
              )}
            </Link>
          );
        })}
      </div>

      {/* 3. Action Icons & Profile */}
      <div className='flex items-center space-x-5 text-zinc-400'>
        <button className='hover:text-white transition-colors focus:outline-none'>
          <Bell size={20} strokeWidth={1.5} />
        </button>
        <button className='hover:text-white transition-colors focus:outline-none'>
          <Settings size={20} strokeWidth={1.5} />
        </button>

        {/* Profile dropdown */}
        <div ref={dropdownRef} className='relative'>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className='flex items-center gap-2 focus:outline-none group'
          >
            {/* Avatar */}
            <div className='relative w-8 h-8 rounded-lg border border-zinc-700 group-hover:border-zinc-500 transition-colors overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0'>
              <Image
                src='/user-avatar.jpg'
                alt='User Profile'
                fill
                className='object-cover'
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className='text-[10px] font-black text-zinc-300 select-none absolute'>
                {initials}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-zinc-600 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className='absolute right-0 top-full mt-3 w-64 bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 z-50 font-poppins overflow-hidden'>
              {/* Profile header */}
              <div className='px-4 py-4 border-b border-zinc-800'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden'>
                    <Image
                      src='/user-avatar.jpg'
                      alt='User Profile'
                      fill
                      className='object-cover'
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className='text-xs font-black text-zinc-300 select-none absolute'>
                      {initials}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold text-zinc-100 truncate'>{displayName}</p>
                    <p className='text-[10px] text-zinc-500 font-mono truncate'>
                      {user?.user_id?.slice(0, 16)}…
                    </p>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className='px-4 py-3 space-y-2.5 border-b border-zinc-800'>
                <div className='flex items-center gap-2.5'>
                  <User size={12} className='text-zinc-600 flex-shrink-0' />
                  <div className='min-w-0'>
                    <p className='text-[9px] font-black tracking-widest uppercase text-zinc-600'>
                      User ID
                    </p>
                    <p className='text-[11px] font-mono text-zinc-400 truncate'>
                      {user?.user_id || '—'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2.5'>
                  <Building2 size={12} className='text-zinc-600 flex-shrink-0' />
                  <div className='min-w-0'>
                    <p className='text-[9px] font-black tracking-widest uppercase text-zinc-600'>
                      Workspace
                    </p>
                    <p className='text-[11px] font-mono text-zinc-400 truncate'>
                      {user?.workspace_id || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='px-2 py-2'>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className='w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-60'
                >
                  {isLoggingOut ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <LogOut size={14} />
                  )}
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
