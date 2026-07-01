/** Content for the "Built for trust at scale" section. */

export const trustBanner = {
  title: "Built for trust at scale",
  body: "Dovetail’s Compliance & Security framework covers SOC 2 Type II, ISO 27001, HIPAA, GDPR, and more—plus enterprise access via MCP Server.",
  badges: {
    src: "/assets/trust-badges.png",
    alt: "Compliance badges: SOC 2, HIPAA, ISO 27001, ISO 42001, GDPR & CCPA, MCP Server",
    width: 1448,
    height: 944,
  },
} as const;

export interface TrustCardItem {
  art: string;
  title: string;
  body: string;
}

export const trustCards: TrustCardItem[] = [
  {
    art: "/assets/card-bestpractices.png",
    title: "Best practices, built in",
    body: "Utilize our templates and standardization features to ensure consistency across your teams and bring order to your workflows.",
  },
  {
    art: "/assets/card-privacy.png",
    title: "Privacy without friction",
    body: "Granular permission controls and redaction let you hide sensitive data and tailor access by role, team, or external vendor.",
  },
];
