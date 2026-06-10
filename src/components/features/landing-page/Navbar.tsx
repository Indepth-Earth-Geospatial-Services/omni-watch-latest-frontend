import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5'>
      <div className='container mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='relative'>
              <ShieldAlert className='text-cyan-400 text-2xl' />
              <div className='absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            </div>
            <div>
              <span className='text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
                SENTINEL
              </span>
              <div className='text-[10px] text-gray-500 font-mono tracking-wider'>
                ISR COMMAND & CONTROL
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2 sm:space-x-3'>
            <Link
              href='/sign-in'
              className='px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-300 hover:text-cyan-400 transition-colors font-medium'
            >
              Sign In
            </Link>
            <Link
              href='/sign-in'
              className='px-4 sm:px-6 py-1.5 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 font-semibold'
            >
              Get Access
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
