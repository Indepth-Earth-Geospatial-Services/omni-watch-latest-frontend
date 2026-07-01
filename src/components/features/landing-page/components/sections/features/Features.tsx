import { SectionHeading } from "@/components/features/landing-page/components/ui/SectionHeading";
import { FeatureCard } from "./FeatureCard";
import { featureCards, featuresHeading } from "./features.data";

/**
 * "Live Geospatial" section: a centered heading followed by the 2×2 feature
 * card grid (single column on mobile). Server component — no client JS beyond
 * the Reveal wrappers inside each card.
 */
export function Features() {
  return (
    <section>
      <SectionHeading title={featuresHeading.title} subtitle={featuresHeading.subtitle} />

      <div className="pt-[130px] max-[1100px]:pt-24 max-[860px]:pt-14">
        <div className="wrap">
          <div className="grid grid-cols-2 gap-6 max-[860px]:grid-cols-1 max-[860px]:gap-5">
            {featureCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
