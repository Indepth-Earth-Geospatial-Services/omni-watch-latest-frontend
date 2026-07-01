import { Reveal } from '@/components/features/landing-page/components/ui/Reveal';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

/**
 * Centered section heading — port of the `.center-head` block. Reusable across
 * sections that lead with a centered title + supporting line. Wrapped in Reveal
 * so it fades up on scroll like the original `.center-head.reveal`.
 */
export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className='wrap'>
      <Reveal className='mx-auto max-w-[760px] pt-40 text-center max-[1100px]:pt-[120px] max-[860px]:pt-[108px]'>
        <h2 className='mb-6 font-satoshi text-[44px] font-normal leading-[1.34] tracking-[-.5px] text-t-primary max-[860px]:text-[30px] max-[430px]:text-[26px]'>
          {title}
        </h2>
        {subtitle ? (
          <p className='mx-auto max-w-[622px] font-geist text-lg leading-[1.22] text-t-primary max-[860px]:text-base'>
            {subtitle}
          </p>
        ) : null}
      </Reveal>
    </div>
  );
}
