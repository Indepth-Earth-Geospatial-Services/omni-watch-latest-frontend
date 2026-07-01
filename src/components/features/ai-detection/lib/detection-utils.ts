export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-theme-accent';
  if (confidence >= 0.5) return 'text-amber-400';
  return 'text-red-400';
}
