# Parse head-to-head — Mistral OCR 4 (Jul 24, 2026, ~20:18Z)

Packet: `test-assets/sample-packet-v2.pdf` (10p stress packet), plan `parse=mistral-ocr-4`, gate bypassed.

## Result: PASS — promote from experimental to validated

- Run `run-20260724-201845-7ba4`, pipeline `parse=mistral:mistral-ocr-latest`, **104s wall for the full run** (single OCR API call for all 10 pages, then text/judge stages).
- Split/classify identical in structure to the Claude/Paddle baselines (`parse-comparison-2026-07-24.md`): 5 docs + 2 unassigned, all preflight flags (contrast, blank, duplicate) surfaced, judge flags sensible (watermark, unsigned, future-dated, masking inconsistency, duplicate-page alert, totals math).
- Markdown quality: clean pipe tables with correct amounts/balances, masking preserved (`***4821`), headers/sections intact — best table fidelity of the three backends tested so far.
- Bonus artifacts: `elements/p<N>.json` per page with typed blocks + bboxes (header/table/paragraph) and page confidence — same artifact slot Paddle fills, usable for future split signals/crops.
- Cost: $4/1,000 pages ⇒ ~$0.04 for this packet (vs ~$10–30/1k for Claude parse).

## Novita candidates: BLOCKED (same session)

`paddle-vl-novita` and `deepseek-ocr2-novita` both fail with Novita `403 NOT_ENOUGH_BALANCE` — key valid, catalog ids confirmed live (`paddlepaddle/paddleocr-vl`, `deepseek/deepseek-ocr-2`), account has no credits. Loud-failure path verified working (run reverted to gated with the error surfaced). Retest after top-up.

## Ops note

An analyzer-worker restart mid-run orphans the packet in `processing` (worker never sends `/run-failed`). Manual recovery: POST `/applications/:id/packet/run-failed` with the packet sha (from the run's `config.json`) — reverts to `gated`.
