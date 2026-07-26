/**
 * Canonical key for a merge recommendation between two run page ranges:
 * "<runId>:p<f>-<l>|p<f>-<l>", ranges sorted by first page. The client builds
 * the identical key from the same inputs — keep the format in lockstep with
 * `features/case-file/review/approval/docGroups.ts` (mergeResolutionKey).
 */
export function mergeResolutionKey(runId: string, ranges: [number, number][]): string {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  return `${runId}:${sorted.map(([f, l]) => `p${f}-${l}`).join("|")}`;
}
