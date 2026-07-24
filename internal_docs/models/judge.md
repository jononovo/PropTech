# Judge stage

**Role:** frontier multimodal model scores each segmented document — quality/consistency flags with page evidence, `document_date`/`expiry_date` extraction. Deep-scan depth comes from template criticality (scrutiny tier), not the model.

**Hard requirement (spec §1.2):** must be a frontier multimodal API with vision. The Fireworks key serves no vision model, so an external key is required **regardless of which parser is live**.

## Options

| Backend | Status | Notes |
| --- | --- | --- |
| **Claude Sonnet 4.6** (Anthropic, user's OWN key) | **LIVE — locked user decision** | Never Replit AI integrations (org-disabled anyway). |
| Other frontier multimodal APIs | Unevaluated | Possible future candidates; any swap needs a dated comparison in this folder. |

## Key handling

`ANTHROPIC_API_KEY` is an **account-linked secret**: present in process env (shell + workflows) but invisible in the workspace secrets listing. Verify with `[ -z "$ANTHROPIC_API_KEY" ]` in a shell — not by looking at the secrets list.

## Observed behavior

- **The pipeline's safety net:** reliably converts parse-fidelity wobbles into visible flags rather than silent errors — this is why Paddle's dense-form weakness is acceptable (see `parse.md`).
- Catches the span-gluing failure both parse engines commit (`wrong_document_mixed_in` / `wrong_document_bundled`), cross-referencing preflight flags.
- **v1 fraud scope: metadata / visual / core-field consistency ONLY — no amount checks. Don't oversell.**

## Cost

Per-token on the user's Anthropic key — and the judge runs there in **every** configuration, including all-Fireworks parse setups.
