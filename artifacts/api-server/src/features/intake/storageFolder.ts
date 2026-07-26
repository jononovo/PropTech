/**
 * Human-legible App Storage folder name, frozen at application creation:
 *   yyyymm_surname_initials_<id>   e.g. 202607_cole_m_1HR9b7q2sN
 *
 * Ruled Jul 26 2026: storage folders must be readable at a glance in the
 * App Storage browser. The nanoid suffix keeps the key unique; the prefix is
 * pure legibility. NEVER re-derive this from applicantName — corrections and
 * renames must not move bytes (GCS "rename" = copy every object).
 */
export function buildStorageFolder(applicantName: string, id: string, at: Date): string {
  const yyyymm = `${at.getUTCFullYear()}${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
  // generational suffixes are not surnames ("María O'Connor-Smith Jr." → smith)
  const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v", "esq", "phd", "md"]);
  const words = sanitize(applicantName)
    .split(/\s+/)
    .filter((w) => w && !SUFFIXES.has(w));
  const surname = words.length > 0 ? words[words.length - 1]! : "unknown";
  const initials = words.slice(0, -1).map((w) => w[0]!).join("");
  return [yyyymm, surname, initials, id].filter(Boolean).join("_");
}

/** ascii-fold + lowercase; anything outside [a-z0-9 ] becomes a space. */
function sanitize(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
