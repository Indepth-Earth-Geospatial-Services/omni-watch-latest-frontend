import Image from "next/image";
import { Button } from "@/components/features/landing-page/components/ui/Button";
import { Eyebrow } from "@/components/features/landing-page/components/ui/Eyebrow";
import { Reveal } from "@/components/features/landing-page/components/ui/Reveal";
import { impactContent } from "./impact.data";

/**
 * "Impact Across Every Layer" section (id="impact" — the "Pricing" nav target).
 * Text block on the left with an absolutely-positioned planet image bleeding
 * off the right on desktop; stacks vertically and centers the planet on mobile.
 * Port of `.impact`.
 */
export function Impact() {
  return (
    <section
      id="impact"
      className="overflow-hidden pt-[30px] max-[860px]:pt-12"
    >
      <div className="wrap">
        <div className="relative flex min-h-[620px] items-center max-[860px]:min-h-0 max-[860px]:flex-col max-[860px]:items-start">
          <Reveal className="relative z-[2] max-w-[563px]">
            <Eyebrow className="mb-[26px]">{impactContent.eyebrow}</Eyebrow>

            <h2 className="mb-6 font-geist text-[44px] font-semibold leading-[1.09] tracking-[-.44px] text-white max-[860px]:text-[30px] max-[430px]:text-[26px]">
              {impactContent.title.map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>

            <p className="mb-8 font-inter text-xl leading-[1.4] text-white max-[860px]:text-[17px]">
              {impactContent.body}
            </p>

            <div className="flex flex-wrap gap-4 max-[860px]:flex-col max-[860px]:items-start max-[860px]:gap-3.5">
              <Button>{impactContent.primaryCta}</Button>
              <Button variant="ghost">{impactContent.secondaryCta}</Button>
            </div>
          </Reveal>

          <div className="absolute right-20 top-1/2 z-[1] w-[760px] -translate-y-[58%] max-[860px]:static max-[860px]:mx-auto max-[860px]:mt-7 max-[860px]:w-full max-[860px]:max-w-[380px] max-[860px]:translate-y-0">
            <Reveal>
              <Image
                src="/landing/planet.png"
                alt=""
                width={1351}
                height={1120}
                sizes="(max-width: 860px) 380px, 760px"
                className="h-auto w-full"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
