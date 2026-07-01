import { Button } from '@/components/features/landing-page/components/ui/Button';
import { Reveal } from '@/components/features/landing-page/components/ui/Reveal';
import { HeroDevice } from './HeroDevice';
import { PartnerStrip } from './PartnerStrip';
import { heroContent } from './hero.data';

/**
 * Hero section: dotted backdrop, device image with parallax, headline + CTAs,
 * and the partner strip. Server component that composes the interactive parts
 * (HeroDevice, PartnerStrip) so only the parallax logic ships as client JS.
 */
export function Hero() {
  return (
    <section className='relative min-h-[1024px] overflow-hidden max-[860px]:min-h-0 max-[860px]:overflow-visible'>
      {/* Dotted grid backdrop, faded toward the bottom */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle,#4a4a4a_1.4px,transparent_1.6px)] [background-position:0_0] [background-size:51px_51px] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_55%,transparent_100%)]'
      />

      <div className='relative mx-auto max-w-wrap px-6 max-[860px]:px-5'>
        <div className='relative flex items-center gap-[4%] pb-10 pt-[118px] max-[860px]:gap-0 max-[860px]:pb-0 max-[860px]:pt-32'>
          <HeroDevice />

          <Reveal className='order-1 max-w-[760px] flex-1 basis-[52%] max-[860px]:max-w-none max-[860px]:basis-full'>
            <h1 className='mb-[18px] font-satoshi text-[clamp(44px,3.4vw,58px)] font-normal leading-[1.34] tracking-[-.5px] text-t-primary max-[860px]:text-[34px] max-[860px]:leading-[1.18] max-[430px]:text-[45px]'>
              {heroContent.headline[0]}
              <br />
              {heroContent.headline[1]}
            </h1>

            <p className='mb-9 max-w-[600px] font-mono text-[clamp(18px,1.25vw,21px)] leading-[1.3] text-t-primary max-[860px]:max-w-none max-[860px]:text-base'>
              {heroContent.subhead}
            </p>

            <div className='flex flex-wrap gap-4 max-[860px]:flex-col max-[860px]:items-start max-[860px]:gap-3.5'>
              <Button>{heroContent.primaryCta}</Button>
              <Button variant='ghost'>{heroContent.secondaryCta}</Button>
            </div>
          </Reveal>
        </div>
      </div>

      <PartnerStrip />
    </section>
  );
}
