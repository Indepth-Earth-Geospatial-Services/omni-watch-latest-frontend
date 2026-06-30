'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// ─── Static Imports (Navbar and Hero are loaded statically for LCP optimization) ───
import Navbar from '@/components/features/landing-page/Navbar';
import Hero from '@/components/features/landing-page/Hero';

// ─── Loading Skeletons to prevent Cumulative Layout Shift (CLS) ───
function StatsSkeleton() {
  return (
    <div className='max-w-5xl mx-auto px-6 mt-24 pb-20'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6 h-36 bg-card/20 border border-cyan-500/10 rounded-xl' />
    </div>
  );
}

function FeaturesSkeleton() {
  return (
    <div className='container mx-auto px-6 py-32'>
      <div className='h-96 bg-card/20 border border-cyan-500/10 rounded-2xl' />
    </div>
  );
}

function SystemOverviewSkeleton() {
  return (
    <div className='container mx-auto px-6 py-32'>
      <div className='h-96 bg-card/20 border border-cyan-500/10 rounded-2xl' />
    </div>
  );
}

function CTASkeleton() {
  return (
    <div className='container mx-auto px-6 py-32'>
      <div className='max-w-5xl mx-auto h-80 bg-card/20 border-2 border-cyan-500/15 rounded-3xl' />
    </div>
  );
}

function FooterSkeleton() {
  return <div className='h-24 border-t border-cyan-500/20 bg-card/30' />;
}

// ─── Below-the-Fold Dynamic Imports (Code Splitting) ───
const Stats = dynamic(() => import('@/components/features/landing-page/Stats'), {
  loading: () => <StatsSkeleton />,
  ssr: true,
});

const Features = dynamic(() => import('@/components/features/landing-page/Features'), {
  loading: () => <FeaturesSkeleton />,
  ssr: true,
});

const SystemOverview = dynamic(() => import('@/components/features/landing-page/SystemOverview'), {
  loading: () => <SystemOverviewSkeleton />,
  ssr: true,
});

const CTA = dynamic(() => import('@/components/features/landing-page/CTA'), {
  loading: () => <CTASkeleton />,
  ssr: true,
});

const Footer = dynamic(() => import('@/components/features/landing-page/Footer'), {
  loading: () => <FooterSkeleton />,
  ssr: true,
});

export default function LandingPage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);
  const hasAnimatedStats = useRef(false);

  useEffect(() => {
    // Intersection Observer for scroll-triggered section detection
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

    const observeElements = () => {
      const sections = document.querySelectorAll('[data-scroll-section]');
      sections.forEach((section) => observer.observe(section));
    };

    observeElements();
    const timer = setTimeout(observeElements, 500);

    return () => {
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
    <div className='bg-background text-foreground min-h-screen relative'>
      {/* Static Background */}
      <div className='fixed inset-0 pointer-events-none overflow-hidden'>
        {/* Static gradient blobs */}
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]'></div>
        <div className='absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]'></div>

        {/* Surveillance Grid */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]'></div>

        {/* Hexagonal pattern overlay */}
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2306b6d4' stroke-width='1'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Vignette */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background'></div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero isVisible={true} mousePosition={{ x: 0, y: 0 }} />

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
