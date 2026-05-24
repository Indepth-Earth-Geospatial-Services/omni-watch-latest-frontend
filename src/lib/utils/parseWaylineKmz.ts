'use client';

// Parses a DJI KMZ file (ZIP containing a WPML/KML file) and returns an ordered
// array of waypoint coordinates. Works entirely in the browser — no server round-trip.
//
// KMZ structure:
//   wpmz/template.kml  ← primary WPML file with <Placemark><Point> entries
//   wpmz/waylines.wpml ← alternative name in some firmware versions
//   *.kml              ← fallback

import JSZip from 'jszip';
import type { WaypointCoord } from '@/lib/types';

/** Downloads a KMZ from the given URL and returns parsed waypoints. */
export async function fetchAndParseKmz(url: string): Promise<WaypointCoord[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`KMZ download failed: ${res.status} ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  return parseKmzBuffer(buffer);
}

/** Parses a KMZ ArrayBuffer already in memory. */
export async function parseKmzBuffer(buffer: ArrayBuffer): Promise<WaypointCoord[]> {
  const zip = await JSZip.loadAsync(buffer);

  // Collect all KML/WPML entries — mapping missions store waypoints in waylines.wpml,
  // not template.kml (which only describes the survey polygon).
  const kmlFiles = Object.values(zip.files).filter(
    (f) => !f.dir && (f.name.endsWith('.kml') || f.name.endsWith('.wpml'))
  );

  if (!kmlFiles.length) throw new Error('No KML/WPML file found inside KMZ');

  let best: WaypointCoord[] = [];

  for (const file of kmlFiles) {
    const text = await file.async('string');
    const waypoints = extractWaypoints(text);
    if (waypoints.length > best.length) best = waypoints;
  }

  if (!best.length) throw new Error('KMZ contained no parseable waypoints');
  return best;
}

/** Pulls ordered waypoints out of a WPML/KML string. */
function extractWaypoints(kml: string): WaypointCoord[] {
  // Split by Placemark boundaries — each Placemark is one waypoint
  const placemarks = kml.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? [];
  const waypoints: WaypointCoord[] = [];

  for (const pm of placemarks) {
    // Skip Placemarks that are not Points (e.g. LineString for the route preview)
    if (!/<Point[\s>]/i.test(pm)) continue;

    const coordMatch = pm.match(/<coordinates>\s*([\s\S]*?)\s*<\/coordinates>/i);
    if (!coordMatch) continue;

    // KML coordinates are "lng,lat[,alt]" — note longitude-first order
    const [lngStr, latStr, altStr] = coordMatch[1].trim().split(',');
    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);
    if (isNaN(lat) || isNaN(lng)) continue;

    // DJI WPML stores the actual flight height in wpml:executeHeight (AGL)
    const heightMatch = pm.match(/<wpml:executeHeight>\s*([\d.+-]+)\s*<\/wpml:executeHeight>/i);
    const alt = heightMatch ? parseFloat(heightMatch[1]) : (altStr ? parseFloat(altStr) : 0);

    waypoints.push({ lat, lng, alt: isNaN(alt) ? 0 : alt, index: waypoints.length });
  }

  return waypoints;
}
