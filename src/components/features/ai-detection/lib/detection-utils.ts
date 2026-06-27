export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-[#45F0CF]';
  if (confidence >= 0.5) return 'text-amber-400';
  return 'text-red-400';
}
