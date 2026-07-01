import { Button } from "@/components/features/landing-page/components/ui/Button";
import { Eyebrow } from "@/components/features/landing-page/components/ui/Eyebrow";
import { Reveal } from "@/components/features/landing-page/components/ui/Reveal";
import { deliversContent } from "./delivers.data";

/**
 * "One Platform. Complete Operational Awareness." section — eyebrow, heading,
 * body copy, and the two CTAs. Port of `.delivers` (id="delivers", also the
 * "Solutions" nav anchor). Server component.
 */
export function Delivers() {
  return (
    <section
      id="delivers"
      className="pt-[230px] max-[1100px]:pt-[120px] max-[860px]:pt-[120px]"
    >
      <div className="wrap">
        <Reveal>
          <Eyebrow className="mb-[26px]">{deliversContent.eyebrow}</Eyebrow>

          <h2 className="mb-7 max-w-[963px] font-satoshi text-[44px] font-medium leading-[1.34] tracking-[-.5px] text-t-primary max-[860px]:text-[30px] max-[430px]:text-[26px]">
            {deliversContent.title}
          </h2>

          <p className="mb-8 max-w-[551px] font-geist text-lg leading-[1.55] text-white max-[860px]:text-base">
            {deliversContent.body}
          </p>

          <div className="flex flex-wrap gap-4 max-[860px]:flex-col max-[860px]:items-start max-[860px]:gap-3.5">
            <Button>{deliversContent.primaryCta}</Button>
            <Button variant="ghost">{deliversContent.secondaryCta}</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
