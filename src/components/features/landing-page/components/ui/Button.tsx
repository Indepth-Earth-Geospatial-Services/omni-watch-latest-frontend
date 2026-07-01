import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "solid" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const base =
  "inline-flex items-center justify-center gap-2.5 font-mono font-medium " +
  "text-base leading-6 text-t-bright rounded-[2px] cursor-pointer " +
  "whitespace-nowrap transition-[background,color,transform] duration-200 ease-in-out " +
  "border border-transparent px-8 py-3 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/60";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-btn hover:bg-btn-hover",
  // The `.btn-ghost` component class (globals.css) draws the blue corner brackets.
  ghost: "btn-ghost bg-transparent border-white/[.08] hover:bg-blue/[.06]",
};

/**
 * Shared CTA button used across the site (Get Started / Request a Demo).
 * The ghost variant wraps children in a <span> so the corner-bracket
 * pseudo-elements have an inner anchor, matching the original markup.
 */
export function Button({
  variant = "solid",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(base, variants[variant], className)} {...props}>
      {variant === "ghost" ? <span>{children}</span> : children}
    </button>
  );
}


