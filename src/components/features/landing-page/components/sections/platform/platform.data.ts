/** Content for the 4-column "The platform" section. */

export interface PlatformColumn {
  /** One or two decorative icons shown inline beside the title. */
  icons: string[];
  title: string;
  /** Optional "Beta" pill after the title. */
  beta?: boolean;
  body: string;
  linkLabel: string;
  linkHref: string;
}

export const platformEyebrow = "The platform";

export const platformColumns: PlatformColumn[] = [
  {
    icons: ["/landing/icons/ic-incidents.png"],
    title: "Incidents & Threats Detection",
    body: "Proactively identify, track, and resolve asset behavior, environmental conditions & operational risks through automated incident creation, rule-based alerts, and intelligent escalation workflows.",
    linkLabel: "Discover AI Chat and search",
    linkHref: "#",
  },
  {
    icons: ["/landing/icons/ic-analysis-1.png", "/landing/icons/ic-analysis-2.png"],
    title: "AI Analysis",
    body: "Leverage advanced analytics and machine learning to transform raw geospatial, movement patterns, historical trends and telemetry data into actionable intelligence.",
    linkLabel: "Discover AI Analysis",
    linkHref: "#",
  },
  {
    icons: ["/landing/icons/ic-map.png"],
    title: "Geospatial Map",
    beta: true,
    body: "Visualize assets, routes and live location tracking with satellite imagery, geofences, and playback to gain situational awareness across operational environments.",
    linkLabel: "Discover AI Dashboards",
    linkHref: "#",
  },
  {
    icons: ["/landing/icons/ic-feed.png"],
    title: "Live Feed",
    beta: true,
    body: "This provides time-stamped visibility into asset activity, events, and alerts, enabling users to monitor operations, respond to incidents, and maintain continuous situational awareness.",
    linkLabel: "Discover AI Docs",
    linkHref: "#",
  },
];
