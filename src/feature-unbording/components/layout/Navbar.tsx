'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, ChevronDown, Loader2, Menu, X, Satellite } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const displayName =
    user?.username || (user?.user_id ? `User ${user.user_id.slice(0, 8)}` : 'User');
  const initials = displayName.slice(0, 2).toUpperCase();
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—';

  return (
    <>
      <nav className='relative flex items-center justify-between w-full h-16 px-6 bg-background border-b border-border'>
        <div className='flex items-center flex-shrink-0'>
          <Link href='/' className='flex items-center transition-opacity hover:opacity-80 focus:outline-none'>
            <Satellite className='h-5 w-5 text-sky-400 mr-2' />
            <span className='text-lg font-bold text-sky-400'>OmniWach OS</span>
          </Link>
        </div>

        <div className='hidden md:flex items-center space-x-8 h-full'>
          {navConfig.map((item) => {
            const isActive = activePath === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex items-center h-full text-sm font-semibold font-ui tracking-widest transition-colors focus:outline-none
                  ${isActive ? 'text-sky-400' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {item.label}
                {isActive && (
                  <span className='absolute bottom-0 left-0 w-full h-[2px] bg-sky-500' />
                )}
              </Link>
            );
          })}
        </div>

        <div className='flex items-center space-x-4 md:space-x-5 text-muted-foreground'>
          <button className='hidden md:block hover:text-foreground transition-colors focus:outline-none'>
            <Bell size={20} strokeWidth={1.5} />
          </button>

          <div ref={dropdownRef} className='relative'>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className='flex items-center gap-2 focus:outline-none group'
            >
              <div className='w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-white select-none'>
                  {initials}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className='absolute right-0 top-full mt-3 w-64 bg-card border border-border rounded-xl shadow-2xl shadow-black/60 z-50 font-ui overflow-hidden'>
                <div className='px-4 py-4 border-b border-border'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0'>
                      <span className='text-xs font-bold text-white'>
                        {initials}
                      </span>
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-bold text-foreground truncate'>{displayName}</p>
                      <span className='inline-block text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold mt-0.5'>
                        {displayRole}
                      </span>
                    </div>
                  </div>
                </div>

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

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className='md:hidden p-1.5 rounded-lg border border-border bg-background/80 hover:bg-secondary hover:text-foreground transition-all duration-200 focus:outline-none'
            aria-label='Toggle navigation menu'
          >
            {mobileMenuOpen ? (
              <X size={20} strokeWidth={1.5} className="text-sky-400" />
            ) : (
              <Menu size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className='absolute top-16 left-0 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-2xl z-40 md:hidden flex flex-col transition-all duration-300 ease-in-out divide-y divide-secondary animate-in slide-in-from-top-4 duration-300'>
            <div className='flex flex-col py-4 px-6 space-y-1'>
              {navConfig.map((item, idx) => {
                const isActive = activePath === item.href;
                const numStr = String(idx + 1).padStart(2, '0');
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-3 px-4 rounded-lg font-ui tracking-widest text-sm font-semibold transition-all duration-200
                      ${isActive 
                        ? 'text-white bg-sky-950/20 border-l-2 border-sky-500' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-l-2 border-transparent'
                      }`}
                  >
                    <span className='flex items-center gap-3'>
                      <span className={`text-[10px] font-mono tracking-normal ${isActive ? 'text-sky-400' : 'text-muted-foreground'}`}>
                        {numStr}
                      </span>
                      {item.label}
                    </span>
                    
                    {isActive && (
                      <span className='w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_hsl(var(--theme-accent))]' />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className='grid grid-cols-2 gap-4 p-6 bg-background/40'>
              <button 
                className='flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/60 hover:text-foreground text-muted-foreground transition-all text-xs font-semibold tracking-wider font-ui'
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                <Bell size={16} strokeWidth={1.5} className="text-muted-foreground" />
                NOTIFICATIONS
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
