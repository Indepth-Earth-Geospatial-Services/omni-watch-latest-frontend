import { Split } from "./Split";
import { splits } from "./splits.data";

/**
 * Renders the three text-and-image split sections (Multi-layer map,
 * AI Incidents, AI Analysis) from data. All use the default orientation,
 * matching the original markup.
 */
export function Splits() {
  return (
    <>
      {splits.map((item) => (
        <Split key={item.eyebrow} {...item} />
      ))}
    </>
  );
}
