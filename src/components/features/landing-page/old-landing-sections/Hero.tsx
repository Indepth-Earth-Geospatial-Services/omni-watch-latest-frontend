import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroProps {
  isVisible: boolean;
  mousePosition: { x: number; y: number };
}

export default function Hero({ isVisible: _isVisible, mousePosition: _mousePosition }: HeroProps) {
  return (
    <section className='relative pt-28 md:pt-40 pb-16 md:pb-28 px-4 md:px-6'>
      <div className='container mx-auto relative z-10'>
        <div className='text-center max-w-5xl mx-auto'>
          {/* Status Badge */}
          <div className='inline-flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6 md:mb-8'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-xs md:text-sm font-mono text-green-400'>SYSTEM OPERATIONAL</span>
          </div>

          <h1 className='text-4xl sm:text-6xl md:text-7xl font-black mb-6 md:mb-8 leading-tight'>
            <span className='bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent'>
              Advanced Surveillance
            </span>
            <br />
            <span className='text-gray-200'>Command & Control</span>
          </h1>

          <p className='text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-8 md:mb-12 leading-relaxed max-w-3xl mx-auto font-light'>
            Real-time intelligence gathering, AI-powered threat detection, and comprehensive
            monitoring for critical infrastructure protection
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <Link
              href='/sign-up'
              className='w-full sm:w-auto group relative px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg overflow-hidden shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50'
            >
              <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100'></div>
              <span className='relative flex items-center justify-center space-x-2 text-base sm:text-lg font-bold'>
                <span>Request Access</span>
                <ArrowRight />
              </span>
            </Link>
            <a
              href='#features'
              className='w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 border-2 border-cyan-500/30 text-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-400 flex items-center justify-center space-x-2'
            >
              <span className='text-base sm:text-lg font-semibold'>Explore Capabilities</span>
              <ChevronDown />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
