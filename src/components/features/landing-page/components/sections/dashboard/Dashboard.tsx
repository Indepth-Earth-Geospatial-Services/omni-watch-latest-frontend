import Image from 'next/image';
import { Reveal } from '@/components/features/landing-page/components/ui/Reveal';

/**
 * Full-width dashboard screenshot — port of `.dashboard`. Rounded corners on
 * desktop; on mobile the container scrolls horizontally so the wide image stays
 * legible instead of shrinking (matches the original overflow-x behavior).
 */
export function Dashboard() {
  return (
    <section className='pt-[110px] max-[1100px]:pt-20 max-[860px]:pt-14'>
      <div className='wrap max-[860px]:overflow-x-auto max-[860px]:pb-2.5 max-[860px]:[-webkit-overflow-scrolling:touch]'>
        <Reveal>
          <Image
            src='/landing/dashboard.png'
            alt='Incidents and threat detection dashboard'
            width={2480}
            height={1950}
            sizes='80vw'
            className='h-auto w-full rounded-xl max-[860px]:min-w-[720px]'
          />
        </Reveal>
      </div>
    </section>
  );
}
