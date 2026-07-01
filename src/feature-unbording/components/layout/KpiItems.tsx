interface KPIItemProps {
  label: string;
  value: string | number;
  unit?: string;
  valueClass?: string;
}

export default function KPIItem({
  label,
  value,
  unit,
  valueClass = 'text-foreground',
}: KPIItemProps) {
  return (
    <div className='flex flex-col px-2 sm:px-6 md:px-8 first:pl-0 last:pr-0 border-r border-border/50 last:border-r-0'>
      <span className='text-[8px] sm:text-[10px] font-bold tracking-[0.1em] sm:tracking-[0.2em] text-muted-foreground uppercase mb-1 truncate'>
        {label}
      </span>
      <div className='flex items-baseline gap-1'>
        <span className={`text-base sm:text-xl md:text-2xl font-black font-ui leading-none ${valueClass}`}>
          {value.toString().padStart(2, '0')}
        </span>
        {unit && (
          <span className='text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tight'>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
