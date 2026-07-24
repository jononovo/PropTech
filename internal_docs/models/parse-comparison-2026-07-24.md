# Parse engine comparison — Paddle OCR-VL 1.6 vs Claude interim (Jul 24, 2026)

Same judge everywhere (`anthropic:claude-sonnet-4-6`). Template `purchase-loan-ca` v4 (deed slot live).
Packets: **v1** = `test-assets/sample-packet-v1.pdf` (9 pp, planted: blank p.6, dup p.7, VOE skew 4°, balance gap in statement).
**v2** = `test-assets/sample-packet-v2.pdf` (10 pp, harder: dense 2-col URLA, 28-txn honest-arithmetic statement table, low-contrast photocopy deed stamp page, blank p.7, dup p.8, VOE skew 8° with embedded table).

## Runs

| Packet | Parse engine | Run | Wall | Result |
|---|---|---|---|---|
| v1 | Claude (all-Anthropic) | run-20260724-151745-106f | ~3.5 min | 4 docs, deed p.5-7, VOE+index unassigned |
| v1 | **Paddle** | run-20260724-161118-2eb1 | 197 s | 4 docs, deed p.5-7, VOE+index unassigned |
| v2 | **Paddle** | run-20260724-161454-d60f | 181 s | 4 docs, deed p.5-8, VOE+index unassigned |
| v2 | Claude | run-20260724-162029-8e21 | 84 s | 4 docs, deed p.5-8, VOE+index unassigned |

Segmentation is **identical across engines** on both packets (same doc count, same spans, same honest unassigns). Differences live in parse fidelity and flag texture.

## What the planted stresses showed

**Dense 2-col URLA (v2 p.1) — the differentiator.**
- Paddle: judge flagged `truncated_parsed_markdown`, `missing_dollar_signs_in_parse`, `condensed_form_incomplete` — the parse itself degraded on the dense layout. Consistent with the v1 morning finding (`parse_field_order_error` on v3) and v1-afternoon `parser_field_misalignment`. This is Paddle's systematic weak spot: label↔value association under density.
- Claude: parsed clean (`condensed_form`, `ssn_redacted`, `round_ssn_suffix` — content observations, not parse-failure flags).

**Honest bank table (v2 p.2-3) — both engines discriminate correctly.**
- v1's statement (planted gap) drew `balance_continuity_gap` from Paddle-parse runs. v2's integer-cents table drew **no** false gap from either engine. Both caught the Zelle third-party inflow (`non_standard_income_credit` / `third_party_zelle_inflow`).

**Deed span gluing (v2 p.5-8) — shared failure, judge catches it.**
- BOTH engines absorbed blank p.7 + dup p.8 into the grant-deed span. Judge flagged it both times (`wrong_document_mixed_in` / `wrong_document_bundled`, plus preflight cross-references). Same shape on v1 (both glued dup p.7 into deed p.5-7).
- Engine-rule candidate for later: exclude preflight-flagged blank/duplicate pages from document spans before mapping. (Not built — needs spec author sign-off.)

**Skew — not a differentiator up to 8°.** Both engines read the 4° (v1) and 8° (v2) VOE well enough to describe employer, status, and the embedded compensation table in the unassigned summary.

**Low-contrast photocopy stamp page (v2 p.6)** — correctly kept inside the deed doc by both; Paddle's run noted `font_source_inconsistency`, Claude cited the preflight low-contrast flag. Claude additionally extracted the 2022 recording date (filename `2022-00-00_grant-deed_...`); Paddle left it `undated`.

## Wall-clock & cost shape
- Paddle runs: 181–197 s warm (v2 slightly faster than v1 despite +1 page — batching variance). Claude v2: 84 s.
- Paddle cost = **GPU-hours while the deployment is up** (H100 on-demand, now scale-to-zero after 10 min idle — was 60 min this morning, which is where the credits went). Tokens are negligible.
- Claude cost = per-token on the Anthropic key; judge runs there in every configuration.

## Bottom line
- Spec configuration (Paddle parse + GLM text + Claude judge) stands: segmentation quality matches Claude, and the judge reliably converts Paddle's parse-fidelity wobbles into visible flags rather than silent errors.
- Known open weakness: dense-form parse fidelity (URLA-class). Watch it on real packets; the judge currently compensates.
- Shared span-gluing behavior around preflight-flagged pages is the highest-value engine improvement candidate.
