/**
 * Access matrix — the whole-application permission table (revived Jul 26 2026
 * from the original workflow-builder design: per-role view/upload/edit).
 *
 * v1 is application-wide and code-defined: one matrix for the entire portal,
 * enforced centrally (middleware.ts) and displayed read-only in the case
 * header. Per-section matrices (the design's original ambition) are a later
 * step once this earns it.
 *
 * "Applicant" is declared for the future borrower-facing upload portal —
 * no Applicant login exists today, the row documents intent.
 */

export type AccessRight = "view" | "upload" | "edit";
export type AccessRole = "Applicant" | "Originator" | "Underwriter" | "Manager";

export const RIGHTS: readonly AccessRight[] = ["view", "upload", "edit"] as const;

export const MATRIX: Record<AccessRole, readonly AccessRight[]> = {
  Applicant: ["view", "upload"],
  Originator: ["view", "upload", "edit"],
  Underwriter: ["view", "upload", "edit"],
  // Deviation from the original mockup (Manager: view+edit): managers run
  // the desk today (Marcus), so upload stays granted until an Applicant/
  // Originator intake flow actually exists to do the uploading.
  Manager: ["view", "upload", "edit"],
};

export const ROLE_META: Record<AccessRole, { abbr: string }> = {
  Applicant: { abbr: "AP" },
  Originator: { abbr: "OR" },
  Underwriter: { abbr: "UN" },
  Manager: { abbr: "MA" },
};

export function roleHas(role: string, right: AccessRight): boolean {
  const rights = MATRIX[role as AccessRole];
  return rights ? rights.includes(right) : false;
}
