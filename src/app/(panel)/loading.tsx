export default function PanelLoading() {
  return (
    <div className='min-h-screen bg-black'>
      {/* Navbar skeleton */}
      <nav className='flex items-center justify-between w-full h-16 px-6 bg-black border-b border-zinc-800'>
        <div className='w-12 h-8 bg-zinc-800 rounded animate-pulse' />
        <div className='hidden md:flex items-center space-x-8'>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className='w-20 h-3 bg-zinc-800 rounded animate-pulse' />
          ))}
        </div>
        <div className='flex items-center space-x-4'>
          <div className='w-5 h-5 bg-zinc-800 rounded animate-pulse' />
          <div className='w-5 h-5 bg-zinc-800 rounded animate-pulse' />
          <div className='w-8 h-8 bg-zinc-800 rounded-lg animate-pulse' />
        </div>
      </nav>

      {/* KPI cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mx-4 mt-6'>
        {[0, 1, 2].map((i) => (
          <div key={i} className='h-24 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse' />
        ))}
      </div>

      {/* Table */}
      <div className='mx-4 mt-6 bg-[#1D2026] border border-zinc-800/50 rounded-lg overflow-hidden'>
        {/* Table header */}
        <div className='h-12 bg-zinc-800/40 border-b border-zinc-800 animate-pulse' />
        {/* Table rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className='h-[72px] border-b border-zinc-800/40 flex items-center px-5 gap-4'
          >
            <div className='w-4 h-4 bg-zinc-800 rounded animate-pulse flex-shrink-0' />
            <div className='w-9 h-9 bg-zinc-800 rounded-lg animate-pulse flex-shrink-0' />
            <div className='flex-1 flex flex-col gap-1.5'>
              <div className='h-3 w-36 bg-zinc-800 rounded animate-pulse' />
              <div className='h-2 w-24 bg-zinc-800/60 rounded animate-pulse' />
            </div>
            <div className='h-3 w-16 bg-zinc-800 rounded animate-pulse' />
            <div className='h-5 w-14 bg-zinc-800 rounded-full animate-pulse' />
            <div className='h-3 w-20 bg-zinc-800 rounded animate-pulse' />
            <div className='h-3 w-24 bg-zinc-800 rounded animate-pulse' />
            <div className='w-7 h-7 bg-zinc-800 rounded-md animate-pulse' />
          </div>
        ))}
      </div>
    </div>
  );
}
