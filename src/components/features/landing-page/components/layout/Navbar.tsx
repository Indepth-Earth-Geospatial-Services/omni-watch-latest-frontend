"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/Button";
import { navLinks, siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/cn";

/**
 * Site header — absolutely positioned over the hero. Holds the brand, the
 * centered nav links, a desktop CTA, and a mobile hamburger that toggles the
 * dropdown menu (port of the toggle logic in the original script.js).
 */
export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-wrap items-center gap-6 px-6 py-[30px] max-[860px]:px-5 max-[860px]:pb-[18px] max-[860px]:pt-9">
        {/* Brand */}
        <Link href="#" className="flex flex-none items-center gap-2.5">
          <Image
            src="/landing/nav-logo.png"
            alt="Omniwatch logo"
            width={36}
            height={36}
            priority
            className="h-9 w-9"
          />
          <b className="font-geist text-lg font-semibold tracking-[-.2px] text-white">
            {siteConfig.name}
          </b>
        </Link>

        {/* Nav links — centered on desktop, dropdown on mobile */}
        <div
          className={cn(
            "flex-1 justify-center gap-11 font-geist text-base text-white",
            "flex", // desktop
            "max-[860px]:absolute max-[860px]:inset-x-0 max-[860px]:top-24 max-[860px]:flex-col max-[860px]:items-center max-[860px]:gap-5 max-[860px]:border-t max-[860px]:border-[#1c1c1c] max-[860px]:bg-panel max-[860px]:p-6",
            open ? "max-[860px]:flex" : "max-[860px]:hidden",
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="opacity-90 transition-[opacity,color] duration-150 hover:text-blue-light hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA — hidden on mobile per the original layout */}
        <Button className="flex-none max-[860px]:hidden">Get Started</Button>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto hidden cursor-pointer border-0 bg-transparent text-2xl text-white max-[860px]:block"
        >
          &#9776;
        </button>
      </nav>
    </header>
  );
}
