import { useMemo, useState } from 'react';
import { useListApplicationEvents } from '@workspace/api-client-react';
import type { ApplicationEvent } from '@workspace/api-client-react';

/**
 * Ledger lens — the boring, filterable audit trail. Rows only: every state
 * change on this application, newest first, straight from the append-only
 * application_events table. Filters are client-side (per-app volumes small).
 */
export function LedgerPage({ applicationId }: { applicationId: string }) {
  const eventsQ = useListApplicationEvents(applicationId);
  const [who, setWho] = useState('all');
  const [action, setAction] = useState('all');
  const [q, setQ] = useState('');

  const events = useMemo(() => eventsQ.data ?? [], [eventsQ.data]);

  const whoOptions = useMemo(() => {
    const names = new Set<string>();
    for (const e of events) names.add(e.actor.kind === 'system' ? 'system' : (e.actor.name ?? 'unknown user'));
    return [...names].sort();
  }, [events]);

  // filter dropdown groups by the noun before the dot: file.*, gate.*, verdict.* …
  const actionGroups = useMemo(
    () => [...new Set(events.map((e) => e.action.split('.')[0]))].sort(),
    [events],
  );

  const query = q.trim().toLowerCase();
  const rows = events.filter((e) => {
    const actorName = e.actor.kind === 'system' ? 'system' : (e.actor.name ?? 'unknown user');
    if (who !== 'all' && actorName !== who) return false;
    if (action !== 'all' && !e.action.startsWith(`${action}.`)) return false;
    if (query) {
      const hay = `${e.action} ${actorName} ${e.target?.label ?? ''} ${e.target?.id ?? ''} ${JSON.stringify(e.detail ?? {})}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const selectCls =
    'bg-white border border-[var(--ops-border)] rounded-[4px] px-2 py-1.5 text-[12px] focus:outline-none focus:border-[var(--ops-accent)]';

  return (
    <div className="h-full overflow-y-auto bg-white flex flex-col">
      <div className="flex-none px-4 md:px-6 py-2.5 border-b border-[var(--ops-border)] bg-[var(--ops-inset)] flex flex-wrap items-center gap-2 sticky top-0 z-20">
        <select value={who} onChange={(e) => setWho(e.target.value)} data-testid="select-ledger-who" className={selectCls}>
          <option value="all">Everyone</option>
          {whoOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} data-testid="select-ledger-action" className={selectCls}>
          <option value="all">All activity</option>
          {actionGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter…"
          data-testid="input-ledger-search"
          className="flex-1 min-w-[140px] max-w-[280px] px-3 py-1.5 bg-white border border-[var(--ops-border)] rounded-[4px] text-[12px] focus:outline-none focus:border-[var(--ops-accent)] placeholder:text-[var(--ops-faint)]"
        />
        <span className="ops-mono text-[11px] text-[var(--ops-muted)] ml-auto">
          {rows.length} of {events.length} events
        </span>
      </div>

      <div className="flex-1 w-full pt-4 pb-12 overflow-x-auto">
        <div className="max-w-[1100px] mx-auto min-w-[760px] px-2 md:px-0">
          {eventsQ.isLoading ? (
            <div className="ops-mono text-sm text-[var(--ops-muted)] p-6">Loading ledger…</div>
          ) : eventsQ.error ? (
            <div className="text-[12.5px] text-[var(--ops-critical-text)] p-6">The ledger could not be loaded.</div>
          ) : rows.length === 0 ? (
            <div className="ops-mono text-[12px] text-[var(--ops-muted)] p-6">No events{events.length ? ' match these filters' : ' yet'}.</div>
          ) : (
            <table className="w-full border border-[var(--ops-strong-border)] text-left">
              <thead>
                <tr className="bg-[var(--ops-inset)] border-b border-[var(--ops-strong-border)]">
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--ops-muted)] w-[170px]">When</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--ops-muted)] w-[160px]">Who</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--ops-muted)] w-[170px]">Action</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--ops-muted)]">What</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <LedgerRow key={e.seq} event={e} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ event: e }: { event: ApplicationEvent }) {
  const when = new Date(e.at);
  const actorName = e.actor.kind === 'system' ? 'system' : (e.actor.name ?? 'unknown user');
  const detail = e.detail as Record<string, unknown> | undefined;
  const bits: string[] = [];
  if (e.target?.label) bits.push(e.target.label);
  else if (e.target?.id) bits.push(e.target.id);
  if (detail) {
    for (const [k, v] of Object.entries(detail)) {
      if (v == null) continue;
      bits.push(`${k}: ${Array.isArray(v) ? v.join('–') : String(v)}`);
    }
  }
  return (
    <tr className="border-b border-[var(--ops-border)] align-top" data-testid={`ledger-row-${e.seq}`}>
      <td className="px-3 py-2 ops-mono text-[11px] text-[var(--ops-neutral-text)] whitespace-nowrap">
        {when.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
        {when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-3 py-2 text-[12px] text-[var(--ops-ink)]">
        {actorName}
        {e.actor.ip ? <span className="ops-mono text-[10px] text-[var(--ops-faint)] ml-1.5">{e.actor.ip}</span> : null}
      </td>
      <td className="px-3 py-2">
        <span className="ops-mono text-[11px] px-1.5 py-0.5 rounded-[3px] border border-[var(--ops-border)] bg-[var(--ops-inset)] text-[var(--ops-neutral-text)]">
          {e.action}
        </span>
      </td>
      <td className="px-3 py-2 text-[12px] text-[var(--ops-body-sec)] break-all">{bits.join(' · ') || '—'}</td>
    </tr>
  );
}
