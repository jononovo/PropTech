# Packet pipeline — upload → preflight → gate → run

The two-step choreography is a product value: **deterministic preflight first (no AI), human gate approval, only then an analyzer run.** Everything is honest — failures revert state and surface an error, never a silent hang.

## State machine (persisted server-side, atomic via row-locked transactions)

```
uploaded → preflight_running → gated → processing → report
                                  ↑__________________|   (run-failed → back to gated + lastRunError)
```

- **Upload** `POST /applications/{id}/packet` (multipart): staged to OS temp, preflight runs there (real checks from day one: page count, format, blank-page detect, duplicate-page detect; skew is deliberately parser-tier), then bytes + evidence thumbnails go to App Storage and temp is wiped.
- **Gate**: flags → `gated`, staff choose "Process anyway" or re-upload (`POST /packet/gate`). Clean small packets auto-approve. Gate races 409 across instances.
- **Processing**: the gate approval claims `processing` and kicks the worker (expects 202). The `processing` state blocks competing packet mutations.
- **Report**: the run lands later through `POST /applications/{id}/analysis` (ingest) — one run object per call, unique `(applicationId, runId)` = replay protection (duplicate → 409), portal owns `latestRunId` and validates every `suggestedBlockId` against the pinned template.
- **Failure**: worker calls `POST /packet/run-failed` → revert to `gated` + `lastRunError`. (Note: `lastRunError` is truncated — full tracebacks are in the worker logs.)

## Serving

- `GET /packet/file` streams the PDF from App Storage — this is also **how the analyzer pulls the packet** (HTTP, never shared disk).
- `GET /packet/thumbnails/{page}` — thumbnails exist **only for flag-evidence pages** (`preflight.thumbnails[].page`), not every page.
- Missing object → explicit 404; stream error → 502. No silent disk fallback.

## Notes

- Packet endpoints return the **full application doc**; packet fields nest under `.packet` (state / pages / preflight.flags / lastRunError).
- Upload currently holds the per-app lock through preflight + ingest kick — fine today; long-run engine work moves ingest to job + poll (parked in `_future.md`).
- Dev driver: `node artifacts/api-server/scripts/run-packet.mjs <appId> <pdfPath> [--auto]`.

## Where

- Server: `features/packet/` (upload, preflight, gate, serving), `features/analysis/` (ingest + runs).
- Client: packet rail inside `features/case-file/`.
