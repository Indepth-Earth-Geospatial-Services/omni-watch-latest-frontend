'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';

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

  return (
    <nav className='flex items-center justify-between w-full h-16 px-6 bg-black border-b border-zinc-800'>
      {/* 1. Brand Logo */}
      <div className='flex items-center flex-shrink-0'>
        <Link href='/' className='transition-opacity hover:opacity-80 focus:outline-none'>
          <Image
            src='/iegs-logo.png' // Replace with your actual logo path
            alt='IEGS Logo'
            width={80}
            height={32}
            className='invert brightness-0' // Ensures white logo on black
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
        <div className='relative w-8 h-8 overflow-hidden rounded-lg border border-zinc-700'>
          <Image
            src='/user-avatar.jpg' // Replace with profile image
            alt='User Profile'
            fill
            className='object-cover'
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
