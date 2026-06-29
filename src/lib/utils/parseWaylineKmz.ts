'use client';

// Parses a DJI KMZ file (ZIP containing a WPML/KML file) and returns an ordered
// array of waypoint coordinates plus full mission metadata. Works entirely in the
// browser — no server round-trip.
//
// KMZ structure:
//   wpmz/template.kml  ← primary WPML file with mission config + survey polygon
//   wpmz/waylines.wpml ← alternative name in some firmware versions
//   *.kml              ← fallback

import JSZip from 'jszip';
import type { WaypointCoord, WaylineMissionData } from '@/lib/types';

/** Downloads a KMZ from the given URL and returns parsed waypoints (backward-compat). */
export async function fetchAndParseKmz(url: string): Promise<WaypointCoord[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`KMZ download failed: ${res.status} ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  return parseKmzBufferLegacy(buffer);
}

/** Legacy wrapper — returns only waypoints for existing callers. */
export async function parseKmzBufferLegacy(buffer: ArrayBuffer): Promise<WaypointCoord[]> {
  const result = await parseKmzBuffer(buffer);
  return result.waypoints;
}

/** Parses a KMZ ArrayBuffer and returns waypoints + mission metadata. */
export async function parseKmzBuffer(
  buffer: ArrayBuffer,
): Promise<{ waypoints: WaypointCoord[]; mission: WaylineMissionData | null }> {
  const zip = await JSZip.loadAsync(buffer);

  const kmlFiles = Object.values(zip.files).filter(
    (f) => !f.dir && (f.name.endsWith('.kml') || f.name.endsWith('.wpml')),
  );

  if (!kmlFiles.length) throw new Error('No KML/WPML file found inside KMZ');

  let best: WaypointCoord[] = [];
  let templateKml = '';
  let waylinesWpml = '';

  for (const file of kmlFiles) {
    const text = await file.async('string');
    const name = file.name.toLowerCase();

    // Identify the two primary files for mission metadata
    if (name.includes('template') && name.endsWith('.kml')) {
      templateKml = text;
    } else if (name.includes('waylines') && name.endsWith('.wpml')) {
      waylinesWpml = text;
    }

    const waypoints = extractWaypoints(text);
    if (waypoints.length > best.length) best = waypoints;
  }

  if (!best.length) throw new Error('KMZ contained no parseable waypoints');

  // If we didn't find the canonical files by name, use whatever we have
  if (!templateKml && !waylinesWpml && kmlFiles.length > 0) {
    const texts = await Promise.all(kmlFiles.map((f) => f.async('string')));
    // Use the file that had the most waypoints as waylines, the other as template
    for (const text of texts) {
      if (!templateKml && text.includes('<wpml:templateType>')) {
        templateKml = text;
      } else if (!waylinesWpml && text.includes('<wpml:distance>')) {
        waylinesWpml = text;
      }
    }
    // Fallback: first file with polygon data is template, rest is waylines
    if (!templateKml && texts.length > 0) {
      templateKml = texts.find((t) => /<Polygon[\s>]/i.test(t)) ?? texts[0];
    }
    if (!waylinesWpml && texts.length > 1) {
      waylinesWpml = texts.find((t) => t !== templateKml) ?? texts[0];
    }
  }

  let mission: WaylineMissionData | null = null;
  if (templateKml || waylinesWpml) {
    try {
      mission = extractMissionData(templateKml, waylinesWpml);
    } catch {
      // Mission data extraction is best-effort; return waypoints even if it fails
    }
  }

  return { waypoints: best, mission };
}

// ---------------------------------------------------------------------------
// Mission data extraction
// ---------------------------------------------------------------------------

function numMatch(xml: string, tag: string): number {
  const re = new RegExp(`<${tag}>\\s*([\\d.+-]+)\\s*</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? parseFloat(m[1]) : 0;
}

function strMatch(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>\\s*([^<]+)\\s*</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

/** Extracts full mission metadata from template.kml and waylines.wpml. */
export function extractMissionData(
  templateKml: string,
  waylinesWpml: string,
): WaylineMissionData {
  // --- From template.kml (mission config + survey polygon) ---
  const missionType = strMatch(templateKml, 'wpml:templateType') || 'waypoint';
  const templateType = numMatch(templateKml, 'wpml:templateType');
  const flightAltitude = numMatch(templateKml, 'wpml:globalShootHeight');
  const flightSpeed = numMatch(templateKml, 'wpml:autoFlightSpeed');
  const transitSpeed = numMatch(templateKml, 'wpml:globalTransitionalSpeed');
  const droneEnumValue = numMatch(templateKml, 'wpml:droneEnumValue');
  const payloadEnumValue = numMatch(templateKml, 'wpml:payloadEnumValue');
  const shootType = strMatch(templateKml, 'wpml:shootType') || 'distance';
  const frontOverlap = numMatch(templateKml, 'wpml:orthoCameraOverlapH');
  const sideOverlap = numMatch(templateKml, 'wpml:orthoCameraOverlapW');

  // Survey polygon from <Placemark> containing a <Polygon>
  const surveyPolygon = extractSurveyPolygon(templateKml);

  // --- From waylines.wpml (execution data) ---
  const totalDistance = numMatch(waylinesWpml, 'wpml:distance');
  const estimatedDuration = numMatch(waylinesWpml, 'wpml:duration');
  const wpFlightSpeed =
    numMatch(waylinesWpml, 'wpml:autoFlightSpeed') || flightSpeed;

  // Photo interval from first non-zero minShootInterval
  let photoInterval = 0;
  const shootIntervalMatches = waylinesWpml.match(
    /<wpml:minShootInterval>\s*([\d.+-]+)\s*<\/wpml:minShootInterval>/gi,
  );
  if (shootIntervalMatches) {
    for (const m of shootIntervalMatches) {
      const val = parseFloat(m.replace(/<[^>]+>/g, '').trim());
      if (val > 0) {
        photoInterval = val;
        break;
      }
    }
  }

  // Estimated photos
  const captureWindow = estimatedDuration > 1 ? estimatedDuration - 1 : estimatedDuration;
  const estimatedPhotos =
    photoInterval > 0 ? Math.floor(captureWindow / photoInterval) + 1 : 0;

  // Survey area from polygon
  const surveyArea = computeSurveyArea(surveyPolygon);

  return {
    missionType,
    templateType,
    flightAltitude,
    flightSpeed: wpFlightSpeed || flightSpeed,
    transitSpeed,
    droneEnumValue,
    payloadEnumValue,
    shootType,
    photoInterval,
    frontOverlap,
    sideOverlap,
    surveyPolygon,
    totalDistance,
    estimatedDuration,
    estimatedPhotos,
    surveyArea,
  };
}

/** Extracts the survey polygon coordinates from a KML/WPML string. */
function extractSurveyPolygon(kml: string): Array<{ lng: number; lat: number }> {
  // Find the Placemark that contains a Polygon (not a Point)
  const placemarks = kml.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? [];
  for (const pm of placemarks) {
    if (/<Polygon[\s>]/i.test(pm)) {
      const coordMatch = pm.match(
        /<coordinates>\s*([\s\S]*?)\s*<\/coordinates>/i,
      );
      if (!coordMatch) continue;

      const coords = coordMatch[1]
        .trim()
        .split(/\s+/)
        .map((pair) => {
          const [lngStr, latStr] = pair.split(',');
          return { lng: parseFloat(lngStr), lat: parseFloat(latStr) };
        })
        .filter((c) => !isNaN(c.lng) && !isNaN(c.lat));

      if (coords.length >= 3) return coords;
    }
  }
  return [];
}

/**
 * Computes survey area in square metres using the Shoelace formula with
 * latitude correction (approximate for small areas).
 */
export function computeSurveyArea(
  polygon: Array<{ lng: number; lat: number }>,
): number {
  if (polygon.length < 3) return 0;

  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Convert to approximate metres relative to centroid
  const centroidLat =
    polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length;
  const cosLat = Math.cos(toRad(centroidLat));

  const metresCoords = polygon.map((p) => ({
    x: toRad(p.lng) * R * cosLat,
    y: toRad(p.lat) * R,
  }));

  let area = 0;
  const n = metresCoords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += metresCoords[i].x * metresCoords[j].y;
    area -= metresCoords[j].x * metresCoords[i].y;
  }
  return Math.abs(area) / 2;
}

// ---------------------------------------------------------------------------
// Waypoint extraction (unchanged logic)
// ---------------------------------------------------------------------------

/** Pulls ordered waypoints out of a WPML/KML string. */
function extractWaypoints(kml: string): WaypointCoord[] {
  const placemarks = kml.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? [];
  const waypoints: WaypointCoord[] = [];

  for (const pm of placemarks) {
    if (!/<Point[\s>]/i.test(pm)) continue;

    const coordMatch = pm.match(/<coordinates>\s*([\s\S]*?)\s*<\/coordinates>/i);
    if (!coordMatch) continue;

    const [lngStr, latStr, altStr] = coordMatch[1].trim().split(',');
    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);
    if (isNaN(lat) || isNaN(lng)) continue;

    const heightMatch = pm.match(
      /<wpml:executeHeight>\s*([\d.+-]+)\s*<\/wpml:executeHeight>/i,
    );
    const alt = heightMatch
      ? parseFloat(heightMatch[1])
      : altStr
        ? parseFloat(altStr)
        : 0;

    waypoints.push({ lat, lng, alt: isNaN(alt) ? 0 : alt, index: waypoints.length });
  }

  return waypoints;
}
