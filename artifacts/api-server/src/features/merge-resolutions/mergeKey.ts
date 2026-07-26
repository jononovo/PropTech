export type FileSpan = { fileId: string; pages: [number, number] };

/**
 * Canonical key for a merge recommendation between two run groups (file-native):
 * "<fileId>:p<f>-<l>|<fileId>:p<f>-<l>", spans sorted by fileId then first
 * page. Files are immutable, so spans identify the recommendation across
 * runs — human resolutions survive later (delta) runs. The client builds the
 * identical key from the same inputs — keep the format in lockstep with
 * `features/case-file/review/approval/docGroups.ts` (mergeResolutionKey).
 */
export function mergeResolutionKey(spans: FileSpan[]): string {
  const sorted = [...spans].sort((a, b) =>
    a.fileId === b.fileId ? a.pages[0] - b.pages[0] : a.fileId.localeCompare(b.fileId),
  );
  return sorted.map((s) => `${s.fileId}:p${s.pages[0]}-${s.pages[1]}`).join("|");
}
