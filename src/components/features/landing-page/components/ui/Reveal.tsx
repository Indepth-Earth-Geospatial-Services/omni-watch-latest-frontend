"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  /** Render as a different element (defaults to div). */
  as?: ElementType;
  className?: string;
}

/**
 * Scroll-reveal wrapper — port of the IntersectionObserver in the original
 * script.js. Adds the `.in` class once the element enters the viewport, then
 * stops observing. Falls back to visible immediately if IO is unavailable.
 */
export function Reveal({ children, as, className }: RevealProps) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={cn("reveal", shown && "in", className)}>
      {children}
    </Tag>
  );
}
