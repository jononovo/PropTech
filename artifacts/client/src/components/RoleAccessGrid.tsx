import { Eye, Upload, PenLine } from 'lucide-react';

/**
 * Role-access grid — ONE presentation for every roles × rights surface:
 * the platform access matrix (read-only, Settings) and template section
 * permissions (editable, template editor). Rows are roles, cells are
 * right-chips; pass onToggle to make the chips buttons.
 */

export type RoleAccessRow = {
  role: string;
  abbr: string;
  /** right → granted */
  granted: Record<string, boolean>;
};

const RIGHT_ICON = { view: Eye, upload: Upload, edit: PenLine } as const;

const ABBR_COLOR: Record<string, string> = {
  AP: 'bg-emerald-100 text-emerald-800',
  OR: 'bg-blue-100 text-blue-800',
  UN: 'bg-purple-100 text-purple-800',
  MA: 'bg-amber-100 text-amber-800',
};

export function RoleAccessGrid({
  rights,
  rows,
  you,
  onToggle,
}: {
  rights: string[];
  rows: RoleAccessRow[];
  /** highlight this role's row (signed-in user) */
  you?: string | null;
  /** when set, chips become toggle buttons */
  onToggle?: (role: string, right: string, value: boolean) => void;
}) {
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div
          key={r.role}
          data-testid={`row-access-${r.role.toLowerCase()}`}
          className={`flex items-center justify-between rounded-[4px] px-1.5 py-1 -mx-1.5 ${you === r.role ? 'bg-[var(--ops-accent-wash)]' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${ABBR_COLOR[r.abbr] ?? 'bg-[var(--ops-inset)] text-[var(--ops-muted)]'}`}
            >
              {r.abbr}
            </span>
            <span className="text-[12.5px] font-medium text-[var(--ops-ink)] truncate">{r.role}</span>
            {you === r.role && <span className="ops-mono text-[8.5px] text-[var(--ops-accent)] shrink-0">YOU</span>}
          </div>
          <div className="flex gap-1 shrink-0">
            {rights.map((right) => {
              const has = r.granted[right] ?? false;
              const Icon = RIGHT_ICON[right as keyof typeof RIGHT_ICON] ?? Eye;
              const chip = `flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors ${
                has ? 'bg-[var(--ops-ink)] text-white' : 'bg-[var(--ops-inset)] text-[var(--ops-faint)]'
              }`;
              return onToggle ? (
                <button
                  key={right}
                  onClick={() => onToggle(r.role, right, !has)}
                  title={`${r.role} · ${right} — click to ${has ? 'revoke' : 'grant'}`}
                  data-testid={`toggle-access-${r.role.toLowerCase()}-${right}`}
                  className={`${chip} ${has ? 'hover:bg-[var(--ops-accent)]' : 'hover:bg-[var(--ops-inner-rule)] hover:text-[var(--ops-ink)]'}`}
                >
                  <Icon className="h-3 w-3" />
                </button>
              ) : (
                <span key={right} title={`${right}${has ? '' : ' — not granted'}`} className={chip}>
                  <Icon className="h-3 w-3" />
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
