import Image from "next/image";
import { cn } from "@/lib/cn";
import { clientLogos, partnerContent, ratings } from "./hero.data";

/**
 * Partner / social-proof strip anchored to the bottom of the hero on desktop
 * (absolute), flowing normally on mobile. Logos are normalized to one height
 * and desaturated via CSS filters, matching the original design.
 */
export function PartnerStrip() {
  return (
    <div className="absolute inset-x-0 bottom-[90px] max-[860px]:static max-[860px]:mt-14">
      <div className="wrap">
        <p className="mb-6 font-inter text-sm font-medium text-white">{partnerContent.lead}</p>

        <div className="flex flex-wrap items-center justify-between gap-12">
          {/* Client logos */}
          <div className="flex flex-wrap items-center gap-9 max-[860px]:gap-x-[26px] max-[860px]:gap-y-5">
            {clientLogos.map((logo) => (
              <span key={logo.alt} className="inline-flex flex-none items-center">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={40}
                  className={cn(
                    "w-auto object-contain opacity-[.62] transition-opacity duration-200 hover:opacity-100",
                    "[filter:grayscale(1)_brightness(0)_invert(1)]",
                    logo.small
                      ? "h-[27px] max-[860px]:h-[21px]"
                      : "h-10 max-[860px]:h-[30px]",
                  )}
                />
              </span>
            ))}
          </div>

          {/* Ratings */}
          <div className="flex flex-wrap items-center gap-[30px]">
            {ratings.map((r) => (
              <div
                key={r.platform}
                className="flex items-center gap-2 whitespace-nowrap font-mono text-xs tracking-[.06em] text-t-muted"
              >
                <span className="text-[11px] tracking-[1.5px] text-[#eaeaea]">
                  &#9733;&#9733;&#9733;&#9733;&#9733;
                </span>{" "}
                {r.score} {r.platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
