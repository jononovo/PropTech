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

Progress:
- Phase 1 (ledger) SHIPPED + tester-verified Jul 26: `application_events` table, `updateApplication(id, (app, emit) => …)` emit hook writes events in-tx, `appendEvent` for out-of-tx inserts, GET /applications/:id/events, Ledger lens in case file. All mutating routes instrumented (see features/ledger/README).
- Rulings: one gate per run with per-file X to exclude before proceed; run picker surfaces never-analyzed files only; archive concept deferred (status field in schema only, zero UI); physical split/merge-as-derived-files DEFERRED — review-room merges stay logical.
