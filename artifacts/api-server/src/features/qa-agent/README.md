# QA agent (case assistant)

Chat agent scoped to ONE application. Spec: `internal_docs/_future/qa-agent.md`.

## Layout

```
qa-agent/
├── router.ts          POST /applications/:id/agent/chat (streaming, stateless)
│                      GET  /applications/:id/citations/resolve
├── instructions.md    system prompt (bundled as text via esbuild .md loader)
├── model.ts           model resolution — fireworks default, QA_AGENT_MODEL override
├── portal.ts          self-HTTP client + `attempt` envelope for write tools
├── runs.ts            latestRunId from corpus layout
├── citations.ts       quote → fractional bbox (elements projection reader)
├── registry.ts        READ / WRITE tool tiers, filename-=-toolname assertion
└── tools/             one file per tool; default-exports (ctx) => tool
    ├── types.ts       AgentCtx { app, mode, decidedBy, portal }
    ├── read tier:     lookup_application, list_corpus, grep_corpus, read_corpus
    └── write tier:    approve_document, update_fields, trigger_rescan,
                       file_pages, resolve_merge, rename_file, add_variant
```

## Power model

- The client sends `mode: "read" | "act"` with every chat request — driven by
  the panel's **Read-only / Full control** toggle, default read-only, never
  persisted anywhere. Write tools are simply not built in read mode.
- Every write tool has `needsApproval: true` (AI SDK 7 tool approvals): the
  stream pauses, the panel renders an approve/decline card, and the client
  resends with the approval response. Because the server is stateless, the
  toggle must still be on when the approval lands.
- **Portal-only:** write tools go through `portal.ts` → the app's own HTTP
  API with the caller's forwarded auth headers. No direct store/DB/object
  writes, so router validation, row-locked transactions, and ledger events
  apply to agent writes exactly as to human ones.
- **Hard limits:** approve only (never reject/delete), never bypass red
  flags, templates untouchable (no template tool exists — keep it that way).

## Adding a write tool

1. `tools/<name>.ts` — default-export factory named `<name>`, zod
   `inputSchema`, `needsApproval: true`, body via `attempt(() =>
   ctx.portal.send(...))` so refusals reach the model as text.
2. One line in `registry.ts` under `WRITE`.
3. `TOOL_META` entry in the client `AgentPanel.tsx` (label + icon + verb for
   the approval card).
4. A rule in `instructions.md` if the tool has semantics the model must know.
