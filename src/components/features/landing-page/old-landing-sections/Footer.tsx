import { ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className='relative py-12 px-6 border-t border-cyan-500/20 bg-card/30'>
      <div className='container mx-auto'>
        <div className='flex flex-col md:flex-row items-center justify-between'>
          <div className='flex items-center space-x-3 mb-6 md:mb-0'>
            <div className='relative'>
              <ShieldAlert className='text-cyan-400 text-2xl' />
              <div className='absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full'></div>
            </div>
            <div>
              <span className='font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent text-lg'>
                Loctiva
              </span>
              <div className='text-[10px] text-gray-500 font-mono tracking-wider'>
                OS COMMAND & CONTROL
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-6'>
            <div className='text-gray-500 text-sm font-mono'>
              © 2025 SENTINEL. All rights reserved.
            </div>
            <div className='flex items-center space-x-2 text-xs'>
              <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
              <span className='text-green-500 font-mono'>SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
