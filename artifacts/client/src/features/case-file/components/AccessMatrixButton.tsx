import { useEffect, useState } from 'react';
import { Eye, Upload, PenLine, ShieldCheck } from 'lucide-react';
import { profileHeaders } from '../../auth/ProfileContext';

/**
 * Access matrix — header popover (revived Jul 26 2026 from the original
 * workflow-builder design: per-role view/upload/edit chips). Read-only
 * display of the server-enforced matrix (GET /api/access-matrix); the row
 * matching the signed-in role is highlighted.
 */

type Matrix = {
  rights: string[];
  roles: { role: string; abbr: string; rights: string[] }[];
  you: string | null;
};

const RIGHT_ICON = { view: Eye, upload: Upload, edit: PenLine } as const;

const ABBR_COLOR: Record<string, string> = {
  AP: 'bg-emerald-100 text-emerald-800',
  OR: 'bg-blue-100 text-blue-800',
  UN: 'bg-purple-100 text-purple-800',
  MA: 'bg-amber-100 text-amber-800',
};

export function AccessMatrixButton() {
  const [open, setOpen] = useState(false);
  const [matrix, setMatrix] = useState<Matrix | null>(null);

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  useEffect(() => {
    if (!open || matrix) return;
    fetch(`${base}/api/access-matrix`, { headers: profileHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Matrix | null) => m && setMatrix(m))
      .catch(() => {});
  }, [open, matrix, base]);

  return (
    <div className="relative shrink-0 hidden sm:block">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="button-access-matrix"
        title="Access matrix — who can view, upload, edit"
        className={`relative z-50 w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-[4px] transition-colors ${
          open ? 'text-[var(--ops-accent)] bg-[var(--ops-accent-wash)]' : 'text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] hover:text-[var(--ops-ink)]'
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
      </button>
      {open && (
        <div
          data-testid="popover-access-matrix"
          className="absolute right-0 top-full mt-2 w-[300px] z-50 rounded-[6px] border border-[var(--ops-border)] bg-white shadow-xl p-4"
        >
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ops-faint)]">Access matrix</h4>
          {!matrix ? (
            <div className="ops-mono text-[10px] text-[var(--ops-muted)]">Loading…</div>
          ) : (
            <div className="space-y-2.5">
              {matrix.roles.map((r) => {
                const you = matrix.you === r.role;
                return (
                  <div
                    key={r.role}
                    data-testid={`row-access-${r.role.toLowerCase()}`}
                    className={`flex items-center justify-between rounded-[4px] px-1.5 py-1 -mx-1.5 ${you ? 'bg-[var(--ops-accent-wash)]' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${ABBR_COLOR[r.abbr] ?? 'bg-[var(--ops-inset)] text-[var(--ops-muted)]'}`}>
                        {r.abbr}
                      </span>
                      <span className="text-[12.5px] font-medium text-[var(--ops-ink)] truncate">{r.role}</span>
                      {you && <span className="ops-mono text-[8.5px] text-[var(--ops-accent)] shrink-0">YOU</span>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {matrix.rights.map((right) => {
                        const has = r.rights.includes(right);
                        const Icon = RIGHT_ICON[right as keyof typeof RIGHT_ICON] ?? Eye;
                        return (
                          <span
                            key={right}
                            title={`${right}${has ? '' : ' — not granted'}`}
                            className={`flex h-6 w-6 items-center justify-center rounded-[4px] ${
                              has ? 'bg-[var(--ops-ink)] text-white' : 'bg-[var(--ops-inset)] text-[var(--ops-faint)]'
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="pt-1 text-[10px] leading-snug text-[var(--ops-muted)] border-t border-[var(--ops-inner-rule)]">
                Enforced on every request. Applicant access arrives with the borrower upload portal.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
