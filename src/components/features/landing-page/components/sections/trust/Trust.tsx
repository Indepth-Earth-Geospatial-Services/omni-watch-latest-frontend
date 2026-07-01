import Image from "next/image";
import { Reveal } from "@/components/features/landing-page/components/ui/Reveal";
import { TrustCard } from "./TrustCard";
import { trustBanner, trustCards } from "./trust.data";

/**
 * "Built for trust at scale" section (id="trust" — the "Documentation" nav
 * target). A banner (heading + body / compliance badges) above two trust
 * cards. Port of `.trust`.
 */
export function Trust() {
  return (
    <section id="trust" className="pt-[190px] max-[1100px]:pt-[120px] max-[860px]:pt-20">
      <div className="wrap">
        {/* Top banner */}
        <Reveal className="mb-6 grid grid-cols-[480px_1fr] items-center gap-10 rounded-[18px] border border-border bg-[#0c0c0c] p-12 max-[1100px]:grid-cols-1 max-[1100px]:gap-7 max-[860px]:gap-6 max-[860px]:p-7">
          <div>
            <h3 className="mb-4 font-inter text-xl font-medium tracking-[-.25px] text-white max-[860px]:text-[19px]">
              {trustBanner.title}
            </h3>
            <p className="font-inter text-base leading-[1.5] text-t-muted">{trustBanner.body}</p>
          </div>
          <div>
            <Image
              src={trustBanner.badges.src}
              alt={trustBanner.badges.alt}
              width={trustBanner.badges.width}
              height={trustBanner.badges.height}
              sizes="(max-width: 1100px) 100vw, 50vw"
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        {/* Two trust cards */}
        <div className="grid grid-cols-2 gap-6 max-[860px]:grid-cols-1 max-[860px]:gap-5">
          {trustCards.map((card) => (
            <TrustCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
