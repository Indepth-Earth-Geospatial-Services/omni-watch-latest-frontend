'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * Hero device image with a subtle scroll-parallax drift — port of the parallax
 * block in the original script.js. Uses a passive scroll listener and only
 * transforms while near the top of the page, and honours reduced-motion.
 */
export function HeroDevice() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < 1100) node.style.transform = `translateY(${y * 0.08}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className='z-[1] order-2 flex-none basis-[44%] opacity-70 max-[860px]:hidden min-[1101px]:opacity-100'
    >
      <Image
        src='/landing/hero-device.png'
        alt='Security device'
        width={720}
        height={720}
        priority
        className='h-auto w-full opacity-95'
      />
    </div>
  );
}
