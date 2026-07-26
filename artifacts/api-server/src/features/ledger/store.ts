import { desc, eq } from "drizzle-orm";
import { db, applicationEventsTable, type ApplicationEventRow } from "@workspace/db";

/** Actor: who did it. kind "system" for automated transitions (no human). */
export type EventActor = { kind: "user" | "system"; name?: string; ip?: string };
/** Target: what was touched — e.g. {type:"file", id:"sf-x", label:"bank-stmt.pdf"}. */
export type EventTarget = { type: string; id?: string; label?: string };

export type LedgerEventInput = {
  applicationId: string;
  actor: EventActor;
  action: string;
  target?: EventTarget;
  detail?: Record<string, unknown>;
};

/** Drizzle tx or root db — both expose .insert(). */
type DbLike = Pick<typeof db, "insert">;

/**
 * Append events inside an existing transaction — THE way state-changing code
 * records history. updateApplication's emit hook routes here so the event
 * commits or rolls back with the change itself.
 */
export async function appendEventsTx(tx: DbLike, events: LedgerEventInput[]): Promise<void> {
  if (events.length === 0) return;
  await tx.insert(applicationEventsTable).values(
    events.map((e) => ({
      applicationId: e.applicationId,
      actor: e.actor,
      action: e.action,
      target: e.target ?? null,
      detail: e.detail ?? null,
    })),
  );
}

/** For writes that don't run through updateApplication (inserts, run ingest). */
export async function appendEvent(event: LedgerEventInput): Promise<void> {
  await appendEventsTx(db, [event]);
}

/** Newest first. Filtering by actor/action/date happens client-side for now. */
export async function listEvents(applicationId: string): Promise<ApplicationEventRow[]> {
  return db
    .select()
    .from(applicationEventsTable)
    .where(eq(applicationEventsTable.applicationId, applicationId))
    .orderBy(desc(applicationEventsTable.seq));
}
