import Image from "next/image";
import { Reveal } from "@/components/features/landing-page/components/ui/Reveal";
import type { TrustCardItem } from "./trust.data";

/**
 * A single trust card — artwork on top, title + body below. Port of `.tcard`.
 */
export function TrustCard({ art, title, body }: TrustCardItem) {
  return (
    <Reveal
      as="article"
      className="flex flex-col overflow-hidden rounded-[18px] border border-border bg-[#0c0c0c]"
    >
      <div className="flex min-h-[300px] items-center justify-center px-[34px] pt-[34px] max-[860px]:min-h-0 max-[860px]:px-6 max-[860px]:pt-[26px]">
        <Image
          src={art}
          alt=""
          width={1228}
          height={917}
          sizes="(max-width: 860px) 100vw, 40vw"
          className="h-auto max-w-full"
        />
      </div>
      <div className="px-[34px] pb-10 pt-6 max-[860px]:px-6 max-[860px]:pb-[30px] max-[860px]:pt-[18px]">
        <h3 className="mb-3.5 font-inter text-xl font-medium tracking-[-.25px] text-white">
          {title}
        </h3>
        <p className="font-inter text-base leading-[1.5] text-t-muted">{body}</p>
      </div>
    </Reveal>
  );
}
