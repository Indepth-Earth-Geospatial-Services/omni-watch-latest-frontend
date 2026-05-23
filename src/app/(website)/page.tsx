'use client';

import Link from 'next/link';
import {
  ShieldAlert,
  Brain,
  Video,
  TrendingUp,
  Globe,
  FileText,
  Check,
  ArrowRight,
  ChevronDown,
  Lock,
  ShieldCheck,
  LogIn,
  UserCog,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);
  const hasAnimatedStats = useRef(false); // Track if stats have been animated
  const heroRef = useRef<HTMLElement>(null);

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

    // Observe all sections
    const sections = document.querySelectorAll('[data-scroll-section]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  // Animated counter effect for stats - ONLY ONCE
  useEffect(() => {
    if (visibleSections.has('stats-section') && !hasAnimatedStats.current) {
      hasAnimatedStats.current = true; // Mark as animated

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

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Detection',
      description:
        'Advanced machine learning algorithms for real-time threat identification and pipeline monitoring',
      color: 'text-purple-500',
    },
    {
      icon: Video,
      title: 'Live Stream Integration',
      description: 'Multiple drone and camera feeds with synchronized telemetry data visualization',
      color: 'text-blue-500',
    },
    {
      icon: ShieldAlert,
      title: 'Threat Analysis',
      description:
        'Comprehensive security monitoring with automated incident detection and response',
      color: 'text-red-500',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Analytics',
      description: 'Advanced data processing and visualization for operational intelligence',
      color: 'text-green-500',
    },
    {
      icon: Globe,
      title: 'Geospatial Mapping',
      description: 'Interactive mapping with precise location tracking and zone monitoring',
      color: 'text-cyan-500',
    },
    {
      icon: FileText,
      title: 'Automated Reporting',
      description: 'Generate detailed reports with customizable templates and scheduled exports',
      color: 'text-orange-500',
    },
  ];

  const stats = [
    { value: '99.8%', label: 'Uptime Reliability', suffix: '%' },
    { value: '<50ms', label: 'Response Time', prefix: '<', suffix: 'ms' },
    { value: '24/7', label: 'Monitoring', suffix: '/7' },
    { value: '256-bit', label: 'Encryption', suffix: '-bit' },
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
            <div className='flex items-center space-x-3'>
              <Link
                href='/sign-in'
                className='px-5 py-2 text-gray-300 hover:text-cyan-400 transition-colors font-medium'
              >
                Sign In
              </Link>
              <Link
                href='/sign-in'
                className='px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 font-semibold'
              >
                Get Access
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='relative pt-40 pb-28 px-6'>
        <div className='container mx-auto relative z-10'>
          <div
            className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Status Badge */}
            <div className='inline-flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-8'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span className='text-sm font-mono text-green-400'>SYSTEM OPERATIONAL</span>
            </div>

            <h1 className='text-6xl md:text-7xl font-black mb-8 leading-tight'>
              <span className='bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent'>
                Advanced Surveillance
              </span>
              <br />
              <span className='text-gray-200'>Command & Control</span>
            </h1>

            <p className='text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-3xl mx-auto font-light'>
              Real-time intelligence gathering, AI-powered threat detection, and comprehensive
              monitoring for critical infrastructure protection
            </p>

            <div className='flex items-center justify-center gap-4 flex-wrap'>
              <Link
                href='/sign-up'
                className='group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg overflow-hidden transition-all duration-300 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transform-gpu'
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
                <span className='relative flex items-center space-x-2 text-lg font-bold'>
                  <span>Request Access</span>
                  <ArrowRight className='group-hover:translate-x-1 transition-transform' />
                </span>
              </Link>
              <a
                href='#features'
                className='px-10 py-4 border-2 border-cyan-500/30 text-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-400 transition-all duration-300 flex items-center space-x-2'
              >
                <span className='text-lg font-semibold'>Explore Capabilities</span>
                <ChevronDown />
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div
            id='stats-section'
            data-scroll-section
            className='mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto'
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`relative group text-center p-8 bg-card/50 backdrop-blur-sm rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden ${
                  visibleSections.has('stats-section')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Animated border glow */}
                <div className='absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                  <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-sm animate-pulse'></div>
                </div>

                <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity'></div>
                <div className='relative'>
                  <div className='text-4xl font-black bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300'>
                    {visibleSections.has('stats-section') ? getStatDisplay(index) : stat.value}
                  </div>
                  <div className='text-sm font-medium text-gray-400 uppercase tracking-wider'>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Radar Pulse with Parallax */}
        <div
          className='absolute top-1/2 left-1/2 w-[800px] h-[800px] pointer-events-none opacity-20 transition-transform duration-300 ease-out'
          style={{
            transform: `translate(-50%, -50%) translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        >
          <div
            className='absolute inset-0 border border-cyan-500/30 rounded-full animate-ping'
            style={{ animationDuration: '3s' }}
          ></div>
          <div
            className='absolute inset-12 border border-cyan-500/30 rounded-full animate-ping'
            style={{ animationDuration: '2s', animationDelay: '0.5s' }}
          ></div>
          <div
            className='absolute inset-24 border border-cyan-500/20 rounded-full animate-ping'
            style={{ animationDuration: '4s', animationDelay: '1s' }}
          ></div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' data-scroll-section className='relative py-32 px-6'>
        <div className='container mx-auto relative z-10'>
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              visibleSections.has('features')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className='inline-block px-4 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6'>
              <span className='text-sm font-mono text-cyan-400 uppercase tracking-wider'>
                Core Systems
              </span>
            </div>
            <h2 className='text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
              Mission-Critical Capabilities
            </h2>
            <p className='text-xl text-gray-400 max-w-3xl mx-auto'>
              Military-grade surveillance infrastructure designed for high-stakes operations
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative bg-card/40 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-700 hover:shadow-2xl hover:shadow-cyan-500/10 transform-gpu perspective-1000 ${
                  visibleSections.has('features')
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-20 scale-95'
                }`}
                style={{
                  transitionDelay: visibleSections.has('features') ? `${index * 100}ms` : '0ms',
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = (y - centerY) / 20;
                  const rotateY = (centerX - x) / 20;
                  e.currentTarget.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(0) rotateX(0deg) rotateY(0deg) scale(1)';
                }}
              >
                {/* Gradient Overlay */}
                <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-500'></div>

                <div className='relative'>
                  {/* Icon Container */}
                  <div className='relative mb-6'>
                    <div className='w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl flex items-center justify-center group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all duration-300'>
                      <feature.icon className={`${feature.color} text-3xl`} />
                    </div>
                    {/* Corner Accent */}
                    <div className='absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity'></div>
                    <div className='absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity'></div>
                  </div>

                  {/* Content */}
                  <h3 className='text-2xl font-bold mb-4 text-gray-100 group-hover:text-cyan-400 transition-colors'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-400 leading-relaxed'>{feature.description}</p>

                  {/* Status Indicator */}
                  <div className='mt-6 flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                    <span className='text-xs font-mono text-green-500 uppercase'>Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Accent */}
        <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none'></div>
      </section>

      {/* System Overview */}
      <section
        id='system-overview'
        data-scroll-section
        className='relative py-32 px-6 bg-gradient-to-b from-background to-card/30'
      >
        <div className='container mx-auto relative z-10'>
          <div className='max-w-6xl mx-auto'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
              <div
                className={`transition-all duration-1000 ${
                  visibleSections.has('system-overview')
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-20'
                }`}
              >
                <div className='inline-block px-4 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-8'>
                  <span className='text-sm font-mono text-cyan-400 uppercase tracking-wider'>
                    Command Hub
                  </span>
                </div>
                <h2 className='text-5xl font-black mb-6 leading-tight'>
                  <span className='bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
                    Unified Control
                  </span>
                  <br />
                  <span className='text-gray-200'>Center</span>
                </h2>
                <p className='text-xl text-gray-400 mb-10 leading-relaxed'>
                  Centralized intelligence platform for coordinating surveillance operations,
                  managing threat responses, and maintaining situational awareness across all
                  deployed assets.
                </p>

                {/* Features List */}
                <div className='space-y-4'>
                  {[
                    'Multi-source video feed aggregation',
                    'AI-powered anomaly detection',
                    'Real-time incident management',
                    'Customizable alert systems',
                    'End-to-end encryption',
                    'Role-based access control',
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-start space-x-4 group transition-all duration-500 ${
                        visibleSections.has('system-overview')
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 -translate-x-10'
                      }`}
                      style={{ transitionDelay: `${400 + index * 100}ms` }}
                    >
                      <div className='flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform'>
                        <Check className='text-cyan-400 text-xs' />
                      </div>
                      <span className='text-gray-300 text-lg group-hover:text-cyan-400 transition-colors'>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Modules */}
              <div
                className={`relative transition-all duration-1000 delay-300 ${
                  visibleSections.has('system-overview')
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-20'
                }`}
              >
                <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-2xl'></div>
                <div className='relative bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/20'>
                  <div className='space-y-4'>
                    {[
                      {
                        icon: Video,
                        title: 'Live Surveillance',
                        desc: 'Multi-camera monitoring',
                        color: 'cyan',
                      },
                      {
                        icon: ShieldAlert,
                        title: 'Threat Detection',
                        desc: 'AI-powered analysis',
                        color: 'red',
                      },
                      {
                        icon: TrendingUp,
                        title: 'Analytics Engine',
                        desc: 'Real-time insights',
                        color: 'green',
                      },
                      {
                        icon: UserCog,
                        title: 'Team Coordination',
                        desc: 'Secure access control',
                        color: 'purple',
                      },
                    ].map((module, index) => (
                      <div
                        key={module.title}
                        className={`group relative flex items-center space-x-4 p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-500 hover:translate-x-2 ${
                          visibleSections.has('system-overview')
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95'
                        }`}
                        style={{ transitionDelay: `${600 + index * 100}ms` }}
                      >
                        <div
                          className={`flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-${module.color}-500/10 to-${module.color}-500/5 flex items-center justify-center`}
                        >
                          <module.icon className={`text-${module.color}-500 text-2xl`} />
                        </div>
                        <div className='flex-1'>
                          <div className='font-bold text-gray-100 mb-1 group-hover:text-cyan-400 transition-colors'>
                            {module.title}
                          </div>
                          <div className='text-sm text-gray-400 font-mono'>{module.desc}</div>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></div>
                          <span className='text-xs text-green-500 font-mono'>ONLINE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corner Accents */}
                <div className='absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-cyan-500/50'></div>
                <div className='absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-cyan-500/50'></div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Grid */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none'></div>
      </section>

      {/* CTA Section */}
      <section id='cta-section' data-scroll-section className='relative py-32 px-6'>
        <div className='container mx-auto relative z-10'>
          <div className='max-w-5xl mx-auto relative'>
            {/* Background Effects */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl transition-opacity duration-1000 ${
                visibleSections.has('cta-section') ? 'opacity-100' : 'opacity-0'
              }`}
            ></div>

            <div
              className={`relative bg-card/50 backdrop-blur-xl p-16 rounded-3xl border-2 border-cyan-500/30 overflow-hidden transition-all duration-1000 ${
                visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              {/* Corner Accents with animation */}
              <div
                className={`absolute top-0 left-0 w-24 h-24 border-l-4 border-t-4 border-cyan-500/50 transition-all duration-700 ${
                  visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ transformOrigin: 'top left' }}
              ></div>
              <div
                className={`absolute top-0 right-0 w-24 h-24 border-r-4 border-t-4 border-cyan-500/50 transition-all duration-700 delay-100 ${
                  visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ transformOrigin: 'top right' }}
              ></div>
              <div
                className={`absolute bottom-0 left-0 w-24 h-24 border-l-4 border-b-4 border-cyan-500/50 transition-all duration-700 delay-200 ${
                  visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ transformOrigin: 'bottom left' }}
              ></div>
              <div
                className={`absolute bottom-0 right-0 w-24 h-24 border-r-4 border-b-4 border-cyan-500/50 transition-all duration-700 delay-300 ${
                  visibleSections.has('cta-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ transformOrigin: 'bottom right' }}
              ></div>

              <div className='relative text-center'>
                <div
                  className={`inline-flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-8 transition-all duration-700 ${
                    visibleSections.has('cta-section')
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-10'
                  }`}
                >
                  <Lock className='text-cyan-400 text-sm' />
                  <span className='text-sm font-mono text-cyan-400 uppercase tracking-wider'>
                    Secure Access
                  </span>
                </div>

                <h2
                  className={`text-5xl md:text-6xl font-black mb-6 leading-tight transition-all duration-700 delay-200 ${
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
                  className={`text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
                    visibleSections.has('cta-section')
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10'
                  }`}
                >
                  Join defense organizations and security professionals using SENTINEL for
                  mission-critical surveillance operations
                </p>

                <div
                  className={`flex items-center justify-center gap-5 flex-wrap transition-all duration-700 delay-500 ${
                    visibleSections.has('cta-section')
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-90'
                  }`}
                >
                  <Link
                    href='/sign-up'
                    className='group relative px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl overflow-hidden transition-all duration-300 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transform-gpu'
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
                    <span className='relative flex items-center space-x-3 text-lg font-bold'>
                      <ShieldCheck />
                      <span>Request Access</span>
                      <ArrowRight className='group-hover:translate-x-1 transition-transform' />
                    </span>
                  </Link>

                  <Link
                    href='/sign-in'
                    className='group px-12 py-5 border-2 border-cyan-500/50 text-gray-300 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-400 transition-all duration-300 flex items-center space-x-3 text-lg font-bold'
                  >
                    <LogIn />
                    <span>Access Portal</span>
                  </Link>
                </div>

                {/* Status Indicators */}
                <div className='mt-12 flex items-center justify-center gap-8 text-sm'>
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

      {/* Footer */}
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
                  SENTINEL
                </span>
                <div className='text-[10px] text-gray-500 font-mono tracking-wider'>
                  ISR COMMAND & CONTROL
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-6'>
              <div className='text-gray-500 text-sm font-mono'>
                © 2025 SENTINEL. All rights reserved.
              </div>
              <div className='flex items-center space-x-2 text-xs'>
                <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-green-500 font-mono'>SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
