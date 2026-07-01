import {
  ShieldAlert,
  Brain,
  Video,
  TrendingUp,
  Globe,
  FileText,
} from 'lucide-react';

interface FeaturesProps {
  visibleSections: Set<string>;
}

export default function Features({ visibleSections: _visibleSections }: FeaturesProps) {
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

  return (
    <section id='features' data-scroll-section className='relative py-20 md:py-32 px-4 md:px-6'>
      <div className='container mx-auto relative z-10'>
        <div className='text-center mb-12 md:mb-20'>
          <div className='inline-block px-4 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4 md:mb-6'>
            <span className='text-xs md:text-sm font-mono text-cyan-400 uppercase tracking-wider'>
              Core Systems
            </span>
          </div>
          <h2 className='text-3xl sm:text-5xl md:text-6xl font-black mb-4 md:mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
            Mission-Critical Capabilities
          </h2>
          <p className='text-base md:text-xl text-gray-400 max-w-3xl mx-auto'>
            Military-grade surveillance infrastructure designed for high-stakes operations
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {features.map((feature) => (
            <div
              key={feature.title}
              className='group relative bg-card/40 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10'
            >
              {/* Gradient Overlay */}
              <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 rounded-2xl'></div>

              <div className='relative'>
                {/* Icon Container */}
                <div className='relative mb-6'>
                  <div className='w-16 h-16 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl flex items-center justify-center group-hover:from-cyan-500/20 group-hover:to-blue-500/20'>
                    <feature.icon className={`${feature.color} text-3xl`} />
                  </div>
                  <div className='absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500/50 opacity-0 group-hover:opacity-100'></div>
                  <div className='absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500/50 opacity-0 group-hover:opacity-100'></div>
                </div>

                {/* Content */}
                <h3 className='text-2xl font-bold mb-4 text-gray-100 group-hover:text-cyan-400'>
                  {feature.title}
                </h3>
                <p className='text-gray-400 leading-relaxed'>{feature.description}</p>

                {/* Status Indicator */}
                <div className='mt-6 flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <span className='text-xs font-mono text-green-500 uppercase'>Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Accent */}
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none'></div>
    </section>
  );
}
