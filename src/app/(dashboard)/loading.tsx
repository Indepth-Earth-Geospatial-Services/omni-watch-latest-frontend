export default function DashboardLoading() {
  return (
    <div className='bg-background text-foreground min-h-screen lg:ml-64'>
      {/* Header skeleton */}
      <div className='h-16 border-b border-border flex items-center justify-between px-6'>
        <div className='flex flex-col gap-1.5'>
          <div className='h-4 w-40 bg-zinc-800 rounded animate-pulse' />
          <div className='h-2.5 w-56 bg-zinc-800/60 rounded animate-pulse' />
        </div>
        <div className='w-8 h-8 bg-zinc-800 rounded-full animate-pulse' />
      </div>

      {/* Project context bar skeleton */}
      <div className='h-10 border-b border-border px-6 flex items-center gap-3'>
        <div className='h-3 w-24 bg-zinc-800 rounded animate-pulse' />
        <div className='h-3 w-32 bg-zinc-800 rounded animate-pulse' />
      </div>

      {/* Page content skeleton */}
      <main className='p-6 space-y-6'>
        {/* Stat cards row */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-28 bg-zinc-900/60 border border-zinc-800 rounded-lg animate-pulse'
            />
          ))}
        </div>

        {/* Secondary stat cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className='h-24 bg-zinc-900/60 border border-zinc-800 rounded-lg animate-pulse'
            />
          ))}
        </div>

        {/* Main content block */}
        <div className='h-64 bg-zinc-900/60 border border-zinc-800 rounded-lg animate-pulse' />
      </main>
    </div>
  );
}
