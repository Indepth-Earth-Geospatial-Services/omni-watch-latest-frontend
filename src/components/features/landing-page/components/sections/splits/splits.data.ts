/** Content for the three text-and-image split sections. */

export interface SplitItem {
  eyebrow: string;
  /** Title lines — rendered with <br> between entries. */
  title: string[];
  body: string;
  image: { src: string; alt: string; width: number; height: number };
  /** Extra top padding for the first split (matches `.split.split-lead`). */
  lead?: boolean;
}

export const splits: SplitItem[] = [
  {
    eyebrow: "[01] Centralize",
    title: ["Multi-layer", "Geospatial Intelligence"],
    body: "Visualize assets, routes, and operational zones on an interactive, multi-layer geospatial map. Combine real-time location tracking with satellite imagery, heatmaps, geofences, and historical playback to gain precise situational awareness across sites, regions, and complex operational environments.",
    image: { src: "/assets/map.png", alt: "Geospatial map interface", width: 2102, height: 1702 },
    lead: true,
  },
  {
    eyebrow: "[02] Detect",
    title: ["AI Incidents & Threat Detection."],
    body: "Turn that data into direction. Spot patterns and quantify the revenue impact of bugs so you can prioritize the problems that actually matter.",
    image: {
      src: "/assets/chart-incidents.png",
      alt: "Threat detection charts",
      width: 2046,
      height: 1989,
    },
  },
  {
    eyebrow: "[03] Analyze",
    title: ["AI Analysis"],
    body: "Leverage advanced analytics and machine learning to transform raw geospatial and telemetry data into actionable intelligence. AI models analyze movement patterns, historical trends, and anomaly signals to predict potential failures, highlight high-risk zones, and support data-driven operational decisions with measurable accuracy.",
    image: {
      src: "/assets/chart-analysis.png",
      alt: "Entry and exit activity analysis",
      width: 1908,
      height: 1604,
    },
  },
];
