import {
  Check,
  Video,
  ShieldAlert,
  TrendingUp,
  UserCog,
} from 'lucide-react';

interface SystemOverviewProps {
  visibleSections: Set<string>;
}

export default function SystemOverview({ visibleSections }: SystemOverviewProps) {
  return (
    <section
      id='system-overview'
      data-scroll-section
      className='relative py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-background to-card/30'
    >
      <div className='container mx-auto relative z-10'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
            <div
              className={`transition-all duration-1000 ${
                visibleSections.has('system-overview')
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-20'
              }`}
            >
              <div className='inline-block px-4 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6 md:mb-8'>
                <span className='text-xs md:text-sm font-mono text-cyan-400 uppercase tracking-wider'>
                  Command Hub
                </span>
              </div>
              <h2 className='text-3xl sm:text-5xl font-black mb-4 md:mb-6 leading-tight'>
                <span className='bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
                  Unified Control
                </span>
                <br />
                <span className='text-gray-200'>Center</span>
              </h2>
              <p className='text-base md:text-xl text-gray-400 mb-8 md:mb-10 leading-relaxed'>
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
                  ].map((module, index) => {
                    const Icon = module.icon;
                    // Predefined mappings to avoid dynamic string interpolation issues in Tailwind
                    const bgColors: Record<string, string> = {
                      cyan: 'from-cyan-500/10 to-cyan-500/5',
                      red: 'from-red-500/10 to-red-500/5',
                      green: 'from-green-500/10 to-green-500/5',
                      purple: 'from-purple-500/10 to-purple-500/5',
                    };
                    const textColors: Record<string, string> = {
                      cyan: 'text-cyan-500',
                      red: 'text-red-500',
                      green: 'text-green-500',
                      purple: 'text-purple-500',
                    };
                    return (
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
                          className={`flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br ${bgColors[module.color]} flex items-center justify-center`}
                        >
                          <Icon className={`${textColors[module.color]} text-2xl`} />
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
                    );
                  })}
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
  );
}
