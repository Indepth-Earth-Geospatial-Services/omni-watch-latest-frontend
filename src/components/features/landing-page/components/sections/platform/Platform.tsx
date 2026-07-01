import { Eyebrow } from "@/components/features/landing-page/components/ui/Eyebrow";
import { PlatformTabs } from "./PlatformTabs";
import { platformEyebrow } from "./platform.data";

/**
 * "The platform" section (id="platform" — the "Product" nav target). A server
 * component holding the eyebrow; the interactive tablist with its scroll-driven
 * indicator lives in the PlatformTabs client component.
 */
export function Platform() {
  return (
    <section id="platform" className="py-[234px] max-[1100px]:py-[130px] max-[860px]:pb-20 max-[860px]:pt-[120px]">
      <div className="wrap">
        <Eyebrow className="mb-10">{platformEyebrow}</Eyebrow>
        <PlatformTabs />
      </div>
    </section>
  );
}
