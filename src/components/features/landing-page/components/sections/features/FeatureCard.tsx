import Image from "next/image";
import { Button } from "@/components/features/landing-page/components/ui//Button";
import { Reveal } from "@/components/features/landing-page/components/ui/Reveal";
import type { FeatureCardItem } from "./features.data";

/**
 * Single feature card — artwork beside a centered body with a CTA. Row layout
 * on desktop, stacked/centered on mobile (port of `.fcard`). Wrapped in Reveal
 * to fade up on scroll.
 */
export function FeatureCard({ art, title, body, cta }: FeatureCardItem) {
  return (
    <Reveal className="flex items-stretch gap-5 overflow-hidden rounded-[14px] border border-border bg-[radial-gradient(120%_120%_at_20%_30%,#161616_0%,#0a0a0a_60%)] px-7 py-9 min-h-[380px] max-[860px]:min-h-0 max-[860px]:flex-col max-[860px]:gap-1.5 max-[860px]:px-[22px] max-[860px]:py-7 max-[860px]:text-center">
      <div className="flex flex-none basis-[46%] items-center justify-center py-2 max-[860px]:basis-auto max-[860px]:p-0">
        <Image
          src={art}
          alt=""
          width={300}
          height={300}
          className="h-auto max-h-[300px] w-auto max-w-full object-contain max-[860px]:max-h-[210px]"
        />
      </div>

      <div className="mx-auto flex-1 max-w-[280px] self-center text-center max-[860px]:max-w-[340px]">
        <h3 className="mb-2.5 font-geist text-[17px] font-medium text-t-bright">{title}</h3>
        <p className="mb-4 font-inter text-[13.5px] leading-[1.5] text-[#cfcfcf]">{body}</p>
        <Button className="px-[26px] py-2.5 text-sm">{cta}</Button>
      </div>
    </Reveal>
  );
}
