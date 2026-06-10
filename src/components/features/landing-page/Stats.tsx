interface StatsProps {
  visibleSections: Set<string>;
  getStatDisplay: (index: number) => string;
}

export default function Stats({ visibleSections, getStatDisplay }: StatsProps) {
  const stats = [
    { value: '99.8%', label: 'Uptime Reliability', suffix: '%' },
    { value: '<50ms', label: 'Response Time', prefix: '<', suffix: 'ms' },
    { value: '24/7', label: 'Monitoring', suffix: '/7' },
    { value: '256-bit', label: 'Encryption', suffix: '-bit' },
  ];

  return (
    <div
      id='stats-section'
      data-scroll-section
      className='mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto px-4 md:px-0 pb-12 md:pb-20'
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`relative group text-center p-6 sm:p-8 bg-card/50 backdrop-blur-sm rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden ${
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
            <div className='text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300'>
              {visibleSections.has('stats-section') ? getStatDisplay(index) : stat.value}
            </div>
            <div className='text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider'>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
