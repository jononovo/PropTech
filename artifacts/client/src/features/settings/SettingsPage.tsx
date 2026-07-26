import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { RoleAccessGrid } from '@/components/RoleAccessGrid';

/**
 * Settings — platform-wide policy, not per-case state. First resident: the
 * access matrix (GET /api/access-matrix), the server-enforced roles × rights
 * table. Read-only: the matrix is code-defined; editing it is a code change.
 */

type Matrix = {
  rights: string[];
  roles: { role: string; abbr: string; rights: string[] }[];
  you: string | null;
};

export function SettingsPage() {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    fetch(`${base}/api/access-matrix`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Matrix | null) => m && setMatrix(m))
      .catch(() => {});
  }, [base]);

  return (
    <div className="max-w-[640px] mx-auto px-4 md:px-6 py-8">
      <h1 className="text-[19px] font-semibold text-[var(--ops-ink)] mb-6">Settings</h1>

      <section
        className="bg-white border border-[var(--ops-border)] rounded-[6px] p-5"
        data-testid="card-access-matrix"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-[var(--ops-muted)]" />
          <h2 className="text-[13.5px] font-semibold text-[var(--ops-ink)]">Access matrix</h2>
        </div>
        <p className="text-[11.5px] text-[var(--ops-muted)] leading-relaxed mb-4">
          Platform-wide role rights, enforced on every request. Per-section upload rules live on
          each template ("Who sees · Who adds") and apply on top of this.
        </p>
        {!matrix ? (
          <div className="ops-mono text-[10px] text-[var(--ops-muted)]">Loading…</div>
        ) : (
          <RoleAccessGrid
            rights={matrix.rights}
            rows={matrix.roles.map((r) => ({
              role: r.role,
              abbr: r.abbr,
              granted: Object.fromEntries(matrix.rights.map((right) => [right, r.rights.includes(right)])),
            }))}
            you={matrix.you}
          />
        )}
        <p className="mt-4 pt-3 text-[10px] leading-snug text-[var(--ops-muted)] border-t border-[var(--ops-inner-rule)]">
          Applicant access arrives with the borrower upload portal.
        </p>
      </section>
    </div>
  );
}
