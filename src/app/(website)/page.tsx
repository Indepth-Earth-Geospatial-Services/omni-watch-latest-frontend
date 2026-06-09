'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// ─── Static Imports (Navbar and Hero are loaded statically for LCP optimization) ───
import Navbar from '@/components/features/website/Navbar';
import Hero from '@/components/features/website/Hero';

// ─── Loading Skeletons to prevent Cumulative Layout Shift (CLS) ───
function StatsSkeleton() {
  return (
    <div className='max-w-5xl mx-auto px-6 mt-24 pb-20'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6 h-36 bg-card/20 border border-cyan-500/10 rounded-xl animate-pulse' />
    </div>
  );
}

function FeaturesSkeleton() {
  return (
    <div className='container mx-auto px-6 py-32'>
      <div className='h-96 bg-card/20 border border-cyan-500/10 rounded-2xl animate-pulse' />
    </div>
  );
}

function SystemOverviewSkeleton() {
  return (
    <div className='container mx-auto px-6 py-32'>
      <div className='h-96 bg-card/20 border border-cyan-500/10 rounded-2xl animate-pulse' />
    </div>
  );
}

function CTASkeleton() {
  return (
    <div className='container mx-auto px-6 py-32'>
      <div className='max-w-5xl mx-auto h-80 bg-card/20 border-2 border-cyan-500/15 rounded-3xl animate-pulse' />
    </div>
  );
}

function FooterSkeleton() {
  return <div className='h-24 border-t border-cyan-500/20 bg-card/30' />;
}

// ─── Below-the-Fold Dynamic Imports (Code Splitting) ───
const Stats = dynamic(() => import('@/components/features/website/Stats'), {
  loading: () => <StatsSkeleton />,
  ssr: true,
});

const Features = dynamic(() => import('@/components/features/website/Features'), {
  loading: () => <FeaturesSkeleton />,
  ssr: true,
});

const SystemOverview = dynamic(() => import('@/components/features/website/SystemOverview'), {
  loading: () => <SystemOverviewSkeleton />,
  ssr: true,
});

const CTA = dynamic(() => import('@/components/features/website/CTA'), {
  loading: () => <CTASkeleton />,
  ssr: true,
});

const Footer = dynamic(() => import('@/components/features/website/Footer'), {
  loading: () => <FooterSkeleton />,
  ssr: true,
});

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);
  const hasAnimatedStats = useRef(false);

  useEffect(() => {
    setIsVisible(true);

    // Mouse parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    // Observe all sections (wait for dynamic elements to render)
    const observeElements = () => {
      const sections = document.querySelectorAll('[data-scroll-section]');
      sections.forEach((section) => observer.observe(section));
    };

    // Run observation immediately and set a backup in case dynamic components take time
    observeElements();
    const timer = setTimeout(observeElements, 500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Animated counter effect for stats - ONLY ONCE
  useEffect(() => {
    if (visibleSections.has('stats-section') && !hasAnimatedStats.current) {
      hasAnimatedStats.current = true;

      const targets = [99.8, 50, 24, 256];
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        setStatValues(targets.map((target) => Math.floor(target * progress)));

        if (currentStep >= steps) {
          setStatValues(targets);
          clearInterval(interval);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [visibleSections]);

  const stats = [
    { value: '99.8%', label: 'Uptime Reliability', prefix: '', suffix: '%' },
    { value: '<50ms', label: 'Response Time', prefix: '<', suffix: 'ms' },
    { value: '24/7', label: 'Monitoring', prefix: '', suffix: '/7' },
    { value: '256-bit', label: 'Encryption', prefix: '', suffix: '-bit' },
  ];

  const getStatDisplay = (index: number) => {
    const stat = stats[index];
    if (index === 0) return `${statValues[index].toFixed(1)}${stat.suffix}`;
    if (index === 1) return `${stat.prefix}${statValues[index]}${stat.suffix}`;
    if (index === 2) return `${statValues[index]}${stat.suffix}`;
    if (index === 3) return `${statValues[index]}${stat.suffix}`;
    return stat.value;
  };

  return (
    <div className='bg-background text-foreground min-h-screen relative overflow-hidden'>
      {/* Animated Gradient Mesh Background */}
      <div className='fixed inset-0 pointer-events-none overflow-hidden'>
        {/* Moving gradient blobs */}
        <div
          className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse'
          style={{ animationDuration: '8s' }}
        ></div>
        <div
          className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse'
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        ></div>
        <div
          className='absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse'
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        ></div>

        {/* Surveillance Grid */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]'></div>

        {/* Hexagonal pattern overlay */}
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2306b6d4' stroke-width='1'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Scanline effect */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full animate-scan'></div>

        {/* Vignette */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background'></div>

        {/* Floating particles */}
        <div className='absolute inset-0'>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className='absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float'
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Data Stream Effect */}
      <div className='fixed top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent pointer-events-none'>
        <div className='w-full h-20 bg-gradient-to-b from-cyan-400/50 to-transparent animate-data-stream'></div>
      </div>
      <div className='fixed top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent pointer-events-none'>
        <div
          className='w-full h-20 bg-gradient-to-b from-cyan-400/50 to-transparent animate-data-stream'
          style={{ animationDelay: '3s' }}
        ></div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
          }
        }
        @keyframes data-stream {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100%));
            opacity: 0;
          }
        }
        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(6, 182, 212, 0.6);
          }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        .animate-data-stream {
          animation: data-stream 6s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-gpu {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
      `}</style>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero isVisible={isVisible} mousePosition={mousePosition} />

      {/* Stats Section */}
      <Stats visibleSections={visibleSections} getStatDisplay={getStatDisplay} />

      {/* Features Section */}
      <Features visibleSections={visibleSections} />

      {/* System Overview Section */}
      <SystemOverview visibleSections={visibleSections} />

      {/* CTA Section */}
      <CTA visibleSections={visibleSections} />

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
