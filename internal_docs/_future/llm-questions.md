# LLM questions over a case — per-application searchable index (ideas, not scheduled)

Status: **deferred by decision (Jul 24, 2026).** Build order is analysis features first — they produce the data worth searching. Revisit once analysis output is stable and good. Until then the mockup rail's "AI Question" card stays a placeholder, and nothing in the product promises Q&A.

## The idea

Every run already produces (or will produce) rich, structured evidence per application: parsed markdown per document, segmentation with page ranges, judge scores (quality / formatting / fraud-signal), flags with details, core fields (dates, parties), preflight findings, manual placements, verdicts, and the audit trail. Once that corpus is complete per application, drop it into a **per-application searchable index** and put a **chat interface** on top: ask questions in plain language, get answers that surface specific documents, scores, and probabilities — with links that jump straight to the page in the review room.

Examples of what it should answer:
- "Is there a paystub covering May?" → names the document, pages, link.
- "What's the riskiest document in this file?" → highest fraud-signal + its flags.
- "What's still missing before underwriting?" → open checklist blocks + blockers.
- "When does the credit report expire?" → core-field lookup with provenance.

## Shape (when its time comes)

- **Index per application, built from run artifacts** — not a global corpus. Rebuild/refresh when a new run lands or placements/verdicts change. The analyzer store already has everything on disk per run; the op-store has verdicts/placements.
- **Two-tier retrieval, lexical first.** Most questions hit structured data (scores, flags, dates, block status) — answer those from the model we already assemble client-side today (caseData) without any embedding. Fall back to semantic search over parsed markdown chunks for free-text questions. Don't reach for a vector DB until lexical + structured retrieval demonstrably falls short.
- **Storage candidates** (decide later, cheapest that works): Postgres FTS on md chunks → pgvector on the same rows if semantics needed → external index only if scale demands (it won't for a while). All three keep the op-store as source of truth; the index is disposable/rebuildable.
- **Answering**: retrieval assembles evidence (doc descriptions, scores, flags, md excerpts, page refs) → one LLM call composes the answer with citations (block id + pages). Chat interface per application; every answer carries provenance and deep-links into the review room / workfile.
- **Honesty rules carry over**: AI never writes verdicts (§1.6); answers are advisory; if the evidence doesn't contain the answer, say so; no silent fallbacks. Cost: one model call per question, fired only on explicit ask.

## Prerequisites before starting

1. Analysis features complete and trusted (segmentation, scores, flags, core fields stable across the real model plan).
2. Enough real runs to know what people actually ask (chip/preset design falls out of this).
3. Decision on retention/access controls if real borrower data is in play (already a spec gate).

## Superseded

Replaces the earlier `docs/homium-review-questions-spec.md` proposal (single-document Q&A card in the review rail, judge-stage prompt reuse). That per-document shape is a strict subset of this — if a quick win is ever wanted before the index exists, that spec's §Backend (analyzer `/qa` endpoint reusing judge context) is still the smallest honest version.
