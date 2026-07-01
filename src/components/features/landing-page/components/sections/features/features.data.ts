/** Content for the "Live Geospatial" heading + the 2×2 feature card grid. */

export const featuresHeading = {
  title: "Live Geospatial Command for Every Asset You Manage",
  subtitle:
    "Monitor, analyze, and secure high-value assets with an AI-driven system built for reliability, speed, and enterprise-grade performance.",
} as const;

export interface FeatureCardItem {
  /** Decorative card artwork (alt intentionally empty in the source design). */
  art: string;
  title: string;
  body: string;
  cta: string;
}

export const featureCards: FeatureCardItem[] = [
  {
    art: "/assets/card-keyhole.png",
    title: "Enterprise-Grade Security",
    body: "Encrypted communications, audit trails, permission-based access, and compliance-level data handling.",
    cta: "Get Started",
  },
  {
    art: "/assets/card-bars.png",
    title: "Real-Time Monitoring",
    body: "Continuous visibility into asset movement, status, and operational integrity.",
    cta: "Analyze trends",
  },
  {
    art: "/assets/card-blockchain.png",
    title: "Incident Response Acceleration",
    body: "Centralized workflows to detect, confirm, resolve, and document incidents.",
    cta: "Get Started",
  },
  {
    art: "/assets/card-governance.png",
    title: "Predictive Threat Detection",
    body: "AI models that analyze anomalies, risk patterns, and environmental signals.",
    cta: "Get Started",
  },
];
