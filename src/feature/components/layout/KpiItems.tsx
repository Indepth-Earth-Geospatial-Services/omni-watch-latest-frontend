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
  valueClass = 'text-zinc-100',
}: KPIItemProps) {
  return (
    <div className='flex flex-col px-8 first:pl-2 last:pr-2 border-r border-zinc-800/50 last:border-0'>
      <span className='text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1'>
        {label}
      </span>
      <div className='flex items-baseline gap-1'>
        <span className={`text-2xl font-black font-poppins leading-none ${valueClass}`}>
          {value.toString().padStart(2, '0')}
        </span>
        {unit && (
          <span className='text-[10px] font-bold text-zinc-500 uppercase tracking-tight'>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
