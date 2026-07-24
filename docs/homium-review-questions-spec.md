# Sheaf — LLM Questions in the Review Room (proposal, v0.1 draft)

Status: **awaiting review — nothing built.** The "AI Question" card in the filmstrip mockup rail is a placeholder until this is signed off.

## What this is

Let the reviewer ask a question about the document they are looking at, from the review room rail, and get an answer grounded in the same evidence the judge saw: the page image(s) plus the parsed markdown. "Does the name here match the URLA?" — answered while both are on screen, without leaving the room.

Hard rule carried over from the analyzer spec (§1.6): **AI never writes verdicts.** Answers inform; the human decides. A Q&A answer can never accept, file, or flag anything.

## Product shape — pick one

| | Shape | Scope | Notes |
|---|---|---|---|
| **A** | Free-form question box on the active stop | one document | simplest honest v1; the reviewer types, the model answers from that doc's pages + md |
| **B** | A + curated question chips | one document | chips like "What's missing?", "Check names/dates against the parsed fields", "Summarize this doc" — one tap, same backend |
| **C** | Packet-wide questions | whole run | "Is there a paystub after May?" — needs multi-doc context assembly, bigger prompt, bigger cost, harder grounding |

**Recommendation: B.** Chips remove typing for the 3 questions everyone asks; free-form covers the rest. C is a different feature (cross-doc consistency) — park it; the judge-stage fraud/consistency work in the engine spec covers most of its value later.

## Grounding & honesty rules

- Context = the active document's page images + its parsed markdown excerpt + its judge output (scores, flags, core fields). Nothing else in v1.
- The prompt inherits the judge's discipline: *"Only report what you can actually see. Do not invent dates or names."* If the answer isn't visible in the evidence, the model must say so.
- Every answer carries a provenance line in the UI: which pages and which model produced it.
- Answers are advisory text only — no buttons inside an answer, no auto-actions.

## Backend (modular, judge-stage machinery)

New module, no pipeline changes:

1. **Analyzer** — `services/analyzer/qa.py` + `POST /qa` on the FastAPI app. Input: `{app_id, run_id, block_id, question}`. It loads the run sidecar for that document (page image paths, md, judge output), builds the prompt, calls `llm.chat` with the **`qa` role from the model plan registry** (defaults to the judge's model — same multimodal requirement). Output: `{answer, pages, model}`. Loud failure, no retry-into-nonsense.
2. **API server** — `POST /applications/:id/runs/:runId/questions` proxies to the analyzer (same pattern as the page-image proxy), stamps `askedBy` from the profile. OpenAPI + codegen as usual.
3. **Persistence — decide:**
   - **(i) Ephemeral** — answer lives in the rail until you navigate away. Zero storage, zero audit surface.
   - **(ii) Per-document Q&A log on the application doc** (`qaHistory[blockId][]`) — survives reloads, visible to the next reviewer, *not* in the case timeline (questions are exploration, not decisions).
   - **Recommendation: (i) for v1.** Persisting invites treating answers as record; this product's record is verdicts.

## Cost & controls

- Each question = one multimodal model call (real money). No background calls, ever — a question fires only on explicit tap/submit.
- v1 controls: signed-in profile required; one in-flight question per document; chips share the same single call path. No quotas until usage says otherwise.

## UI (review room rail)

- Card sits under the callouts on a document stop: chips row + one-line input + Ask.
- States: idle → asking (progress line, cancelable) → answered (text + provenance line) → error (loud, retry button). No silent fallbacks.
- Unassigned stops and clean pages don't get the card in v1 (no judged doc behind them).

## v1 cut list

- No packet-wide questions (C), no conversation threads (each question independent), no answer persistence, no citations-with-bbox highlighting (region highlighting is already parked for v2), no streaming.

## Open questions for sign-off

1. Shape A or B? (recommended B)
2. Persistence (i) ephemeral or (ii) stored log? (recommended i)
3. Chip set for v1 — proposed: "What's missing?" · "Check names & dates" · "Summarize this document"
4. Should the `qa` model role default to the judge model, or pin something cheaper (answers are advisory, a lighter model may do)?
