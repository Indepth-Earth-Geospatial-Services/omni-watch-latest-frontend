import Link from 'next/link';
import { Lock, ShieldCheck, ArrowRight, LogIn, ShieldAlert } from 'lucide-react';

interface CTAProps {
  visibleSections: Set<string>;
}

export default function CTA({ visibleSections }: CTAProps) {
  return (
    <section id='cta-section' data-scroll-section className='relative py-20 md:py-32 px-4 md:px-6'>
      <div className='container mx-auto relative z-10'>
        <div className='max-w-5xl mx-auto relative'>
          {/* Background Effects */}
          <div
            className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl transition-opacity duration-1000 ${
              visibleSections.has('cta-section') ? 'opacity-100' : 'opacity-0'
            }`}
          ></div>

          <div
            className={`relative bg-card/50 backdrop-blur-xl p-6 sm:p-10 md:p-16 rounded-3xl border-2 border-cyan-500/30 overflow-hidden transition-all duration-1000 ${
              visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Corner Accents with animation */}
            <div
              className={`absolute top-0 left-0 w-12 h-12 sm:w-24 sm:h-24 border-l-4 border-t-4 border-cyan-500/50 transition-all duration-700 ${
                visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`}
              style={{ transformOrigin: 'top left' }}
            ></div>
            <div
              className={`absolute top-0 right-0 w-12 h-12 sm:w-24 sm:h-24 border-r-4 border-t-4 border-cyan-500/50 transition-all duration-700 delay-100 ${
                visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`}
              style={{ transformOrigin: 'top right' }}
            ></div>
            <div
              className={`absolute bottom-0 left-0 w-12 h-12 sm:w-24 sm:h-24 border-l-4 border-b-4 border-cyan-500/50 transition-all duration-700 delay-200 ${
                visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`}
              style={{ transformOrigin: 'bottom left' }}
            ></div>
            <div
              className={`absolute bottom-0 right-0 w-12 h-12 sm:w-24 sm:h-24 border-r-4 border-b-4 border-cyan-500/50 transition-all duration-700 delay-300 ${
                visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`}
              style={{ transformOrigin: 'bottom right' }}
            ></div>

            <div className='relative flex flex-col items-center text-center'>
              <div
                className={`inline-flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6 md:mb-8 transition-all duration-700 ${
                  visibleSections.has('cta-section')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-10'
                }`}
              >
                <Lock className='text-cyan-400 text-sm' />
                <span className='text-xs md:text-sm font-mono text-cyan-400 uppercase tracking-wider'>
                  Secure Access
                </span>
              </div>

              <h2
                className={`text-2xl sm:text-4xl md:text-6xl font-black mb-4 md:mb-6 leading-tight transition-all duration-700 delay-200 ${
                  visibleSections.has('cta-section')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
              >
                <span className='bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
                  Deploy Your Command Center
                </span>
              </h2>

              <p
                className={`text-base md:text-xl text-gray-400 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
                  visibleSections.has('cta-section')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
              >
                Join defense organizations and security professionals using SENTINEL for
                mission-critical surveillance operations
              </p>

              <div
                className={`w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-500 ${
                  visibleSections.has('cta-section')
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-90'
                }`}
              >
                <Link
                  href='/sign-up'
                  className='w-full sm:w-auto group relative px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl overflow-hidden transition-all duration-300 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transform-gpu'
                  style={{ transformStyle: 'preserve-3d' }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    e.currentTarget.style.transform = `perspective(1000px) rotateY(${x / 20}deg) rotateX(${-y / 20}deg) scale(1.05)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
                  }}
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity'></div>
                  <div className='absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-blue-500/50 blur-xl opacity-0 group-hover:opacity-70 transition-opacity'></div>
                  <span className='relative flex items-center justify-center space-x-3 text-base sm:text-lg font-bold'>
                    <ShieldCheck />
                    <span>Request Access</span>
                    <ArrowRight className='group-hover:translate-x-1 transition-transform' />
                  </span>
                </Link>

                <Link
                  href='/sign-in'
                  className='w-full sm:w-auto group px-8 sm:px-12 py-4 sm:py-5 border-2 border-cyan-500/50 text-gray-300 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-400 transition-all duration-300 flex items-center justify-center space-x-3 text-base sm:text-lg font-bold'
                >
                  <LogIn />
                  <span>Access Portal</span>
                </Link>
              </div>

              {/* Status Indicators */}
              <div className='mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm'>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-gray-400 font-mono'>All Systems Online</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <ShieldAlert className='text-cyan-400' />
                  <span className='text-gray-400 font-mono'>256-bit Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Grid */}
      <div className='absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none'></div>
    </section>
  );
}
