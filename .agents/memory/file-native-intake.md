---
name: File-native intake
description: Jul 26 2026 ruling that retires the one-PDF packet model; where the spec lives and the core rules.
---

# File-native intake (rulings, Jul 26 2026)

Spec: `internal_docs/_future/file-native-intake.md` (authoritative; keep its open-questions section updated as the user answers).

Core rules:
- **No concatenation, ever.** Files stay in the form they were dropped — evidence/audit. This DELETES packet assemble/pdfunite/packetManifest (built same day, now scheduled for removal — don't extend them).
- Rename ≠ copy: originals immutable, id-addressed bytes; renames are metadata + ledger event. New physical files ONLY on split/merge (derived, with lineage).
- Page addressing becomes (fileId, page) / FileSpan end-to-end (analyzer, approvals, merge keys, render URLs).
- Uploads and packets unify into one SourceFile entity (origin: solicited/unsolicited); solicited docs go through the same approval filmstrip with an "analyzer agrees/disagrees with declared intent" banner.
- One append-only `application_events` ledger (written in the same tx as the state change) subsumes templateHistory + materializationErrors; operational structures (documentApprovals, mergeResolutions, registries) stay and emit events. Boring rows-and-filters UI, per-file history = filtered ledger.
- NO batches — person/date/status filters + archive status replace them.

**Why:** user rejected concatenation ("irrelevant benefit"), wants clean audit trail, less code, modularity.
**How to apply:** follow spec sequencing (ledger → SourceFile registry → file-native runs → review on FileSpans → cleanup). No back-compat shims; migrate/delete demo fixtures.

Markdown intelligence corpus (ruled + shipped Jul 26): every run ingest writes one frontmattered .md per suggested doc to App Storage `applications/<appId>/runs/<runId>/` (scores/flags/coreFields/provenance + transcript). These are regenerable PROJECTIONS — Postgres stays authority; write failure emits `run.sidecars_failed`, never fails ingest. Agent layer = post-phase-5 own plan; no vector DB per application (direct search + tools suffice); context docs as plain MDs in corpus.

Progress:
- Phase 2 (SourceFile registry + unified receive) SHIPPED + curl-verified Jul 26: `app.files`, `receiveSourceFiles()` in features/files is THE receive seam (all 4 entry points route through it), bytes id-addressed `files/<fileId><ext>` (ext from immutable originalFilename), rename PATCH, bytes GET, staging.ts deleted (assemble pulls durable bytes), upload-delete archives the row, uploads records carry `fileId` (materialize requires it — no legacy path).
- RULING Jul 26 (in replit.md): ZERO backward compatibility ever — no fallbacks, shims, or legacy paths; delete old code, migrate/delete old data. Pre-registry fixture uploads/manifests are simply broken by design.
- Phase 1 (ledger) SHIPPED + tester-verified Jul 26: `application_events` table, `updateApplication(id, (app, emit) => …)` emit hook writes events in-tx, `appendEvent` for out-of-tx inserts, GET /applications/:id/events, Ledger lens in case file. All mutating routes instrumented (see features/ledger/README).
- Phases 3–5 SHIPPED + tester-verified Jul 26 (server, analyzer, client): `Application.run: RunState` replaces packet; canonical FileSpan everywhere; client builds a global PageIndex (1..N over run.input) purely for VIEW — all submissions translate back to (fileId, page). Old packet fixtures deleted from Postgres (zero back-compat). PacketPanel → FilesPanel.
- **Gated is implicit**: server keeps `app.run` NULL until the first gate decision — "gated" as an explicit state only exists after a failed run reverts processing→gated. Client gate card must trigger on (active files present && run not processing/report), not on `run.state === 'gated'`.
- Gate decision semantics are strict: `confirmed` 400s if the set has flags, `bypassed` 400s if clean — pick by flag count, they are not interchangeable.
- Rulings: one gate per run with per-file X to exclude before proceed; run picker surfaces never-analyzed files only; archive concept deferred (status field in schema only, zero UI); physical split/merge-as-derived-files DEFERRED — review-room merges stay logical.
