/** Content for the hero + partner strip. Kept beside the section for locality. */

export const heroContent = {
  headline: ["Autonomous Insight for the", "World’s Most Critical Assets"],
  subhead:
    "A unified geospatial platform delivering real-time monitoring, threat detection, and operational intelligence across every asset you manage.",
  primaryCta: "Get Started",
  secondaryCta: "Request a Demo",
} as const;

export const partnerContent = {
  lead: "Protecting assets of the world’s leading companies",
} as const;

/** `small` renders the wide wordmarks at a reduced height (original `.logo-cell.sm`). */
export const clientLogos = [
  { src: "/landing/clients/metashape.webp", alt: "Metashape", small: true },
  { src: "/landing/clients/aerosmart.webp", alt: "AeroSmart", small: false },
  { src: "/landing/clients/falcon.webp", alt: "Falcon", small: false },
  { src: "/landing/clients/iris.webp", alt: "Iris", small: false },
  { src: "/landing/clients/transcorp.webp", alt: "Transcorp", small: true },
] as const;

export const ratings = [
  { score: "4.5/5", platform: "G2" },
  { score: "4.6/5", platform: "Capterra" },
] as const;
