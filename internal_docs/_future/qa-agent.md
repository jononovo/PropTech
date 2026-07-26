# Application Q&A Agent — technical spec (v1, Jul 26 2026)

> Rulings (user, Jul 26 2026): build the agentic-search pattern, NO vector
> store. Persist `elements/pN.json` to App Storage at ingest so bbox-grade
> citations are durable from day one ("get it right the first time").
> Citations surface in chat as **links that open the document at the cited
> page** — the chat does NOT auto-open or inline-render the document; the
> on-page bbox highlight is drawn by the (parked) v2 review UI when the link
> is followed.

## 1. What it is

A staff-facing chat agent scoped to ONE application: "what's the borrower's
income?", "which bank statements are missing?", "does the URLA address match
the escrow instructions?". It answers from the application's own record and
document corpus, and every factual claim carries a citation.

## 2. Architecture — agentic search, no vectors

Industry-settled pattern for corpora this size (a handful of PDFs, dozens of
markdown sidecars per application): an LLM loop with tools, structured
lookups first, then list/grep/read, iterating until it can answer.

Tool ladder (cheapest first):
1. **Structured lookups** — application record (core fields, fieldValues,
   verdicts, run state), judge scores, satisfaction JSONs, approved-docs
   registry, ledger events. All already in Postgres behind the portal API.
2. **List** — enumerate the application's corpus: run sidecars
   (`runs/<runId>/doc-NN_<slug>.md`), approved pairs (`approved/*.md`),
   source files registry.
3. **Grep** — regex/keyword search across the markdown corpus for this
   application only.
4. **Read** — fetch a whole sidecar/page markdown when grep hits need context.

**Vectors are a measured retrofit ONLY if grep recall demonstrably fails on
real packets. Not before.** (Decision researched Jul 2026; grep-based agentic
search is the established norm at this file count.)

## 2b. Tech (ruled Jul 26 2026 — pattern imported from user's "Stitch" agent doc)

Vercel AI SDK v5: `streamText` + Zod-schema tools + `stopWhen: stepCountIs(~12)`
on the server (Express: `pipeUIMessageStreamToResponse`), `useChat` on the
client. File structure copied from Stitch for maintainability:
`features/qa-agent/` with `tools/<name>/tool.ts`, a STATIC tool registry
(manual imports — no codegen at this tool count), `system-prompt.ts` (pins
core fields + file registry + sidecar list every turn; bodies fetched via the
read tool, never inlined), thin route wrapper.

Deliberate divergence from Stitch: ALL tools execute server-side (`execute()`
on the tool) — our tools are read-only lookups, there is no editor buffer to
mutate. This deletes Stitch gotchas #1/#2/#3/#7 (client tool-result plumbing)
by construction. No askChoice, no per-role tool restrictions in v1.

Model: via `@ai-sdk/openai-compatible` against our existing Fireworks/Mistral
keys (no Anthropic key; org AI integrations disabled). Tool-calling quality
on the loop needs burn-in — same registry-is-truth discipline as the workers.

## 3. Citation contract

Every claim cites: `{ approvedDocId | runId+docIndex, fileId, page, quote }`
— document → file-relative page → quoted line. The quote is matched against
`elements/pN.json` blocks server-side to attach a bbox when one resolves:
`{ bbox: [x1,y1,x2,y2], pageDimensions }`. Bbox resolution failing is fine —
the citation stands at line level.

Chat rendering: citation = a link chip ("URLA p.2") that OPENS the document
viewer at that page (deep link into the existing review/approved viewers).
The bbox travels in the link payload; drawing the highlight is the viewer's
job (v2 UI, parked). No auto-open, no inline document rendering in chat.

## 4. Data-path rule

The agent talks ONLY through existing portal/store boundaries — no new data
paths, no direct disk or bucket access:
- Postgres reads via the existing feature stores.
- Corpus reads via `packetObjectStore` keys under the application's
  `storageFolder`.
- NEVER the analyzer's local `store/` disk (ephemeral).

## 5. Prerequisite: durable elements projection — ✅ SHIPPED Jul 26 2026

`elements/pN.json` (typed blocks + bboxes + page dimensions, written by BOTH
parse engines — Mistral OCR and Paddle) today lives only on the analyzer's
ephemeral disk. At run ingest, project them to App Storage alongside the md
sidecars:

    applications/<storageFolder>/runs/<runId>/elements/<fileId>/pN.json

Same regenerable-projection semantics as sidecars: Postgres stays authority,
write failure emits `run.elements_failed` in the ledger, never fails ingest.
(Analyzer already exposes the bytes over its store endpoint; the portal
fetches during ingest exactly like page markdown for sidecars.)

## 6. Build order

1. ✅ Elements projection at ingest (§5) + `run.elements_failed` ledger action.
2. Portal endpoints for the agent tools (list/grep/read scoped to one
   application) + citation resolver (quote → bbox).
3. Agent loop + chat UI in the case file (new lens or side panel), streaming,
   with citation link chips.
4. (Parked, v2 review UI) viewer honors bbox in the deep link and draws the
   highlight.

## 7. Open questions

- Model choice for the agent loop (worker registry is truth; judge-tier
  model likely).
- Chat persistence: per-application thread history in Postgres, or ephemeral?
- Cross-application questions ("all of March's applications") — explicitly
  OUT of scope v1.
