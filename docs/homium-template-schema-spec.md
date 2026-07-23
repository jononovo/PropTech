# Homium Form Template — Technical Specification
**Document dimensions, alternatives, and how analysis consumes them**
Status: draft for build · Owner: Homium product · Last updated: Jul 23, 2026

---

## 1. Context

The form builder's entire output is **one JSON file per template**. That file is the
contract between three consumers:

1. **The portal** (React + Vite) — renders the applicant-facing form, the builder, and the register view from the same JSON.
2. **The analyzer** (separate build) — splits, names, and scores incoming loan PDFs against the checklist the JSON defines.
3. **The review room** — orders the human verification queue.

This spec defines the three per-document dimensions, the alternatives mechanism,
and the analysis semantics they carry. It extends the existing contract
(sections → subsections → blocks; permissions; expiry clocks) without changing it.

---

## 2. The three dimensions

Every `document` block carries three orthogonal values. They answer different
questions and must never be collapsed into one field.

### 2.1 `requirement` — a rule (blocks intake?)

| Value | Meaning | Intake behavior |
|---|---|---|
| `required` | Application cannot proceed without it | Blocks completion of its section |
| `required_alt` | Must be satisfied — by this document **or** any one member of its alternative group (§3) | Blocks completion until the group is satisfied |
| `recommended` | Strengthens the application; absence is flagged, never blocks | Surfaced as "missing" in register + review, non-blocking |
| `optional` | Accepted if offered | No flag when absent |

Replaces the former `required: boolean` (kept in the type as deprecated;
`required === (requirement !== "optional")` during migration).

### 2.2 `criticality` — a weight (how much does it matter?)

| Value | Meaning | Examples |
|---|---|---|
| `critical` | Outcome-defining. Errors or fraud here sink the application | Founding documents, government ID, birth certificate, appraisal, credit report |
| `standard` | Materially relevant, routine | Pay stubs, bank statements, disclosures |
| `supporting` | Context; low individual weight | Extra bank statement, letter of intent |

Criticality is independent of requirement: a gift letter can be `optional` +
`critical` (matters enormously *if present*); the fifteenth disclosure form is
`required` + `standard`.

### 2.3 `sourcing` — an intelligence tag (how hard to obtain?)

| Value | Meaning |
|---|---|
| `readily_available` | Applicant can produce on demand (bank portal, employer) |
| `constrained` | Third party or slow registry involved (government agency, foreign registry) |
| `scarce` | May be genuinely unobtainable; alternatives likely needed |

Sourcing is **not** applicant-facing guidance and renders no help text. It exists
for the analysis layer (§4) and to prompt the form author to define alternatives
where `scarce` appears.

---

## 3. Alternative groups

**The alternative belongs to the requirement, not the document.** A template
carries a top-level `alternatives` array:

```json
{
  "alternatives": [
    {
      "id": "proof-of-identity",
      "name": "Proof of Identity",
      "primary": "gov-id",
      "satisfiedBy": ["passport"]
    }
  ]
}
```

Semantics:

- The group is **satisfied when any one** of `[primary, ...satisfiedBy]` is filed and passes verification.
- Members may live in **different sections**; satisfaction tracking is template-wide.
- The `primary` block's `requirement` must be `required_alt`. Members listed only in `satisfiedBy` keep their own requirement (usually `optional`) — filing them is not demanded unless the primary is absent.
- UI derives captions in both directions, from the group alone:
  - on the primary: *"required — unless Passport (02) is filed"*
  - on an alternative: *"can satisfy: Proof of Identity (02)"*
- v1 restraint: **no conditional logic beyond this**. No nested groups, no "2 of 3" quorums, no cross-template references. A group is a flat any-one-of list.

### Data invariants (validate on save/export)
- Every `primary` and `satisfiedBy` id must resolve to an existing document block.
- A block may be `primary` of at most one group.
- `requirement === "required_alt"` ⇔ the block is some group's `primary`.
- Groups with an empty `satisfiedBy` are invalid.

---

## 4. How analysis consumes the dimensions

The tags exist so scrutiny is **budgeted where it matters**, deterministically:

1. **Scrutiny tiering.** Analyzer depth per document = f(criticality). `critical` documents get the full pipeline (OCR + tamper/fraud heuristics + cross-field consistency); `standard` gets standard scoring; `supporting` gets classification + legibility only.
2. **Substitution scrutiny.** When a requirement is satisfied by an **alternative rather than its primary**, and the group's primary is `critical`, the substitute is automatically escalated one scrutiny tier and flagged for the review queue ("satisfied by alternative").
3. **Overlap escalation (the "fraud scan" rule).** When tags overlap — e.g. `critical` + `scarce`, or `critical` + satisfied-by-alternative, or multiple `critical` documents from the same section failing quality thresholds — the workfile is escalated to a **deep scan**: additional fraud heuristics across the document set, not just the individual file.
4. **Queue ordering.** Review queue sorts by (criticality of the flagged document, escalation clock). A `supporting` document never outranks a `critical` one regardless of age.
5. **Expiry interaction.** The 90/30/7 escalation clocks apply per document as today; criticality only affects *ordering* of expiry alerts, never their timing.

Deliberately out of scope: negative weighting ("documents that hurt the
application"). That is reviewer judgment, not schema.

---

## 5. Builder UI requirements (v1)

Minimal, no decoration:

- The selected block's edit row replaces the Required checkbox with three quiet dropdowns: **Requirement** (4 options), **Criticality** (3), **Sourcing** (3).
- Choosing *required — alternatives accepted* exposes an **alternatives picker**: choose any document blocks in the template (cross-section); selection creates/updates the group with this block as primary.
- Blocks in a group render a one-line mono caption (both directions, per §3). No badges, no color.
- Register view gains **CRITICALITY** column; REQ column shows the four-level value.
- JSON export includes `alternatives`, and the three fields on every document block.

## 6. Migration & build order

1. Schema (this document) — done in the mockup contract (`builderData.ts` mirrors it).
2. Builder UI dropdowns + alternatives picker.
3. Portal render rules (captions, register columns, applicant view unchanged except alternative hints).
4. Analyzer consumes tags per §4 when it lands.
