import Image from "next/image";
import { Eyebrow } from "@/components/features/landing-page/components/ui/Eyebrow";
import { Reveal } from "@/components/features/landing-page/components/ui/Reveal";
import { cn } from "@/lib/cn";
import type { SplitItem } from "./splits.data";

interface SplitProps extends SplitItem {
  /** Media on the left, text on the right (port of `.split.rev`). */
  reversed?: boolean;
}

/**
 * Reusable text + image section — port of `.split`. Two columns on desktop
 * (391px text / fluid media), single column on tablet and below. The `lead`
 * flag adds the extra top padding of the first split; `reversed` swaps sides.
 */
export function Split({ eyebrow, title, body, image, lead, reversed }: SplitProps) {
  return (
    <section
      className={cn(
        "pt-[85px] max-[1100px]:pt-[90px] max-[860px]:pt-[72px]",
        lead && "pt-[145px] max-[1100px]:pt-[110px] max-[860px]:pt-20",
      )}
    >
      <div className="wrap">
        <div
          className={cn(
            "grid grid-cols-[391px_1fr] items-center gap-20",
            "max-[1100px]:grid-cols-1 max-[1100px]:gap-10",
            "max-[860px]:gap-7",
            reversed && "grid-cols-[1fr_391px] max-[1100px]:grid-cols-1",
          )}
        >
          <Reveal className={cn(reversed && "order-2 max-[1100px]:order-none")}>
            <Eyebrow variant="blue" className="mb-[26px]">
              {eyebrow}
            </Eyebrow>
            <h2 className="mb-6 font-geist text-[32px] font-semibold leading-[1.25] text-t-primary max-[860px]:text-[28px] max-[430px]:text-2xl">
              {title.map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <p className="font-geist text-base leading-[1.5] text-t-dim max-[860px]:text-[15px]">
              {body}
            </p>
          </Reveal>

          <Reveal className={cn(reversed && "order-1 max-[1100px]:order-none")}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 1100px) 100vw, 60vw"
              className="h-auto w-full [filter:drop-shadow(0_30px_60px_rgba(0,0,0,.6))]"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
