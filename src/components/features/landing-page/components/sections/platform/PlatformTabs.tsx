"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { platformColumns } from "./platform.data";

/**
 * The 4-column tablist with a scroll-driven focus line — port of the
 * ".platform focus line" block in the original script.js.
 *
 * As the section travels through the viewport, an active column index advances
 * 0→3. A single white indicator segment slides beneath the active column and
 * the inactive columns dim. Below 1101px the layout collapses to bordered
 * cards and the indicator/dimming are disabled (matches the CSS media query).
 */
export function PlatformTabs() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const colRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  // Only run the desktop scroll effect at ≥1101px (indicator is hidden below).
  const [isDesktop, setIsDesktop] = useState(false);

  // Position the indicator under the active column.
  const positionIndicator = useCallback((idx: number) => {
    const col = colRefs.current[idx];
    if (col) setIndicator({ left: col.offsetLeft, width: col.offsetWidth });
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1101px)");
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const section = sectionRef.current;
    if (!section) return;

    const cols = platformColumns.length;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress as the section travels through the viewport (starts a bit
      // after it enters) — identical to the original computation.
      const total = rect.height + vh * 0.5;
      const p = Math.max(0, Math.min(1, (vh - rect.top - vh * 0.25) / total));
      const idx = Math.max(0, Math.min(cols - 1, Math.floor(p * cols)));
      setActive((prev) => (prev !== idx ? idx : prev));
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isDesktop]);

  // Keep the indicator aligned whenever the active column or layout changes.
  useEffect(() => {
    if (isDesktop) positionIndicator(active);
  }, [active, isDesktop, positionIndicator]);

  useEffect(() => {
    if (!isDesktop) return;
    const onResize = () => positionIndicator(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, isDesktop, positionIndicator]);

  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative grid grid-cols-4 gap-8 pb-6",
        // continuous base divider behind the focus segment (desktop only)
        "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[#212121] after:content-['']",
        "max-[1100px]:grid-cols-2 max-[1100px]:gap-12 max-[1100px]:pb-0 max-[1100px]:after:hidden",
        "max-[860px]:grid-cols-1 max-[860px]:gap-[18px]",
      )}
    >
      {platformColumns.map((col, i) => {
        const isActive = isDesktop && i === active;
        return (
          <div
            key={col.title}
            ref={(el) => {
              colRefs.current[i] = el;
            }}
            className={cn(
              "relative flex flex-col transition-opacity duration-[450ms] ease-out",
              // dim inactive columns on desktop only
              isDesktop && !isActive && "opacity-40",
              // mobile: each column becomes a softly bordered card
              "max-[860px]:rounded-[14px] max-[860px]:border max-[860px]:border-white/10 max-[860px]:bg-white/[.015] max-[860px]:px-[22px] max-[860px]:py-[26px]",
            )}
          >
            <h3 className="mb-4 min-h-[52px] font-inter text-xl font-medium tracking-[-.25px] text-white max-[1100px]:min-h-0 max-[860px]:min-h-0">
              <span className="mr-2.5 inline-flex items-center gap-1.5 align-[-6px]">
                {col.icons.map((icon, k) => (
                  <Image
                    key={k}
                    src={icon}
                    alt=""
                    width={24}
                    height={24}
                    className="block h-6 w-6"
                  />
                ))}
              </span>
              {col.title}
              {col.beta ? (
                <span className="ml-2 rounded border border-[#333] px-2 py-0.5 align-[2px] font-mono text-xs tracking-[.08em] text-t-muted">
                  Beta
                </span>
              ) : null}
            </h3>

            <p
              className={cn(
                "mb-[22px] font-inter text-[15px] leading-[1.5] transition-colors duration-[450ms] ease-out max-[860px]:mb-[18px]",
                isActive ? "text-white" : "text-t-dim",
              )}
            >
              {col.body}
            </p>

            <a
              href={col.linkHref}
              className="mt-auto inline-flex items-center gap-2 self-start font-inter text-[15px] font-medium text-white after:text-blue-light after:content-['→'] max-[860px]:mt-0"
            >
              {col.linkLabel}
            </a>
          </div>
        );
      })}

      {/* Focus-line indicator: a single white segment with square caps at both
          ends that slides between columns. Desktop only. */}
      <div
        aria-hidden
        className={cn(
          "absolute bottom-0 left-0 z-[2] h-px bg-white",
          "transition-[transform,width] duration-[550ms] [transition-timing-function:cubic-bezier(.65,0,.35,1)]",
          "before:absolute before:left-0 before:top-1/2 before:h-[7px] before:w-[7px] before:-translate-y-1/2 before:bg-white before:content-['']",
          "after:absolute after:right-0 after:top-1/2 after:h-[7px] after:w-[7px] after:-translate-y-1/2 after:bg-white after:content-['']",
          "max-[1100px]:hidden",
        )}
        style={{
          width: `${indicator.width}px`,
          transform: `translateX(${indicator.left}px)`,
        }}
      />
    </div>
  );
}
