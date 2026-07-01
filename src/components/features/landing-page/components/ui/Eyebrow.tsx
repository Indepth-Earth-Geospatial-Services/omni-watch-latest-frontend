import { cn } from "@/lib/cn";

interface EyebrowProps {
  children: React.ReactNode;
  /** `blue` matches the `.eyebrow.blue` variant used in the split sections. */
  variant?: "muted" | "blue";
  className?: string;
}

/**
 * Small uppercase mono label above section headings — port of `.eyebrow`.
 * Rendered as a block so callers can add margin via className.
 */
export function Eyebrow({ children, variant = "muted", className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "block font-mono text-sm uppercase tracking-[.07em]",
        variant === "blue" ? "text-blue" : "text-t-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
