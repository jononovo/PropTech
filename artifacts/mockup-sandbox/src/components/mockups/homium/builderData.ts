// ─────────────────────────────────────────────────────────────────────────────
// Shared contract for the Form Builder exploration.
//
// The builder's entire output is ONE JSON file — this module defines that
// shape, the block palette, and the single seed template every variant renders.
// Variants must import from here and may not fork the data: they differ only
// in interaction model (how blocks are added, where the JSON is felt).
//
// Restraint doctrine (user call): no flags, no notifications, no marketing
// subtitles. Blocks, a form, and the JSON. Ops Desk aesthetic throughout.
// ─────────────────────────────────────────────────────────────────────────────

export type ExpiryRule =
  | { kind: "staleness"; days: number } // goes stale N days after its date
  | { kind: "hard" }                    // must remain valid through closing
  | null;                               // no clock

// ── document dimensions ──────────────────────────────────────────────────────
// Requirement is a RULE (does the application proceed without it).
// Criticality is a WEIGHT (how much this document matters to the outcome) —
// drives analyzer scrutiny and review-queue ordering, never blocks intake.
// Sourcing is an INTELLIGENCE TAG (how hard this document is to obtain) —
// consumed by analysis, e.g. critical + scarce ⇒ deeper fraud scan on substitutes.
export type RequirementLevel = "required" | "required_alt" | "recommended" | "optional";
export type Criticality = "critical" | "standard" | "supporting";
export type Sourcing = "readily_available" | "constrained" | "scarce";

// A requirement that can be satisfied by any one of a set of documents,
// regardless of which section they live in. Belongs to the TEMPLATE, not a block.
export type AlternativeGroup = {
  id: string;
  name: string;          // e.g. "Proof of Identity"
  primary: string;       // block id of the preferred document
  satisfiedBy: string[]; // block ids that also satisfy it (any one)
};

export type FieldType = "text" | "number" | "date" | "select" | "yesno";

export type Field = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[]; // select only
};

export type Block =
  | {
      kind: "document";
      id: string;
      name: string;
      formats: string[];   // accepted upload formats
      required: boolean;   // deprecated — derived from requirement !== "optional"; kept for older variants
      requirement: RequirementLevel;
      criticality: Criticality;
      sourcing: Sourcing;
      multiPage: boolean;
      expiry: ExpiryRule;
    }
  | {
      kind: "fields";
      id: string;
      name: string;
      fields: Field[];
    };

export type Subsection = { id: string; name: string; blocks: Block[] };

// Who can see a section and who is responsible for adding its documents.
// The section's `owner` is the responsible party; permissions govern visibility/upload per role.
export type Role = "Applicant" | "Originator" | "Underwriter" | "Manager";
export type Permission = { role: Role; view: boolean; upload: boolean };

const ROLES: Role[] = ["Applicant", "Originator", "Underwriter", "Manager"];
// perms("vu","v","v","-") → Applicant view+upload, Originator view, Underwriter view, Manager none
const perms = (...codes: string[]): Permission[] =>
  ROLES.map((role, i) => ({ role, view: codes[i].includes("v"), upload: codes[i].includes("u") }));

export type Section = {
  id: string;
  name: string;
  owner: "Applicant" | "Originator" | "Escrow" | "Homium";
  permissions: Permission[];
  subsections: Subsection[];
};

export type Template = {
  template: string;
  version: number;
  program: string;
  alternatives: AlternativeGroup[];
  sections: Section[];
};

// ── the palette: what can be dragged into the form ──────────────────────────
export const PALETTE = [
  { kind: "section" as const,    label: "Section",        hint: "Top-level group with an owner" },
  { kind: "subsection" as const, label: "Subsection",     hint: "Group inside a section" },
  { kind: "document" as const,   label: "Document upload", hint: "A required page or multi-page document" },
  { kind: "fields" as const,     label: "Field group",    hint: "Typed inputs — text, date, select" },
];

// ── seed template: CA purchase loan, mirrors the Workfile's six sections ────
export const PURCHASE_LOAN: Template = {
  template: "Purchase Loan — CA",
  version: 3,
  program: "Homium Deposit Assistance",
  alternatives: [
    { id: "proof-of-identity", name: "Proof of Identity", primary: "gov-id", satisfiedBy: ["passport"] },
  ],
  sections: [
    {
      id: "initial-application", name: "Initial Application", owner: "Applicant",
      permissions: perms("vu", "vu", "v", "v"),
      subsections: [
        {
          id: "application-forms", name: "Application forms",
          blocks: [
            { kind: "document", id: "urla-1003", name: "URLA — Form 1003", formats: [".pdf"], required: true, requirement: "required", criticality: "critical", sourcing: "readily_available", multiPage: true, expiry: null },
            { kind: "document", id: "disclosures", name: "Disclosure Acknowledgments", formats: [".pdf"], required: true, requirement: "required", criticality: "standard", sourcing: "readily_available", multiPage: true, expiry: null },
          ],
        },
        {
          id: "employment", name: "Employment",
          blocks: [
            {
              kind: "fields", id: "employment-details", name: "Employment details",
              fields: [
                { id: "employer", type: "text", label: "Current employer", required: true },
                { id: "start-date", type: "date", label: "Start date", required: true },
                { id: "self-employed", type: "yesno", label: "Self-employed?" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "identity", name: "Identity Verification", owner: "Applicant",
      permissions: perms("vu", "v", "v", "v"),
      subsections: [
        {
          id: "identity-docs", name: "Identity documents",
          blocks: [
            { kind: "document", id: "gov-id", name: "Government ID — Driver License", formats: [".pdf", ".jpg", ".png"], required: true, requirement: "required_alt", criticality: "critical", sourcing: "constrained", multiPage: false, expiry: { kind: "hard" } },
            { kind: "document", id: "passport", name: "Passport", formats: [".pdf", ".jpg", ".png"], required: false, requirement: "optional", criticality: "critical", sourcing: "constrained", multiPage: false, expiry: { kind: "hard" } },
            { kind: "document", id: "ssn-verify", name: "SSN Verification", formats: [".pdf"], required: true, requirement: "required", criticality: "critical", sourcing: "constrained", multiPage: false, expiry: null },
          ],
        },
      ],
    },
    {
      id: "income-assets", name: "Income & Assets", owner: "Applicant",
      permissions: perms("vu", "v", "v", "v"),
      subsections: [
        {
          id: "income", name: "Income",
          blocks: [
            { kind: "document", id: "pay-stubs", name: "Pay Stubs — Last 30 Days", formats: [".pdf"], required: true, requirement: "required", criticality: "standard", sourcing: "readily_available", multiPage: true, expiry: { kind: "staleness", days: 30 } },
            { kind: "document", id: "w2-forms", name: "W-2 Forms (last 2 years)", formats: [".pdf"], required: true, requirement: "required", criticality: "standard", sourcing: "readily_available", multiPage: true, expiry: null },
          ],
        },
        {
          id: "assets", name: "Assets",
          blocks: [
            { kind: "document", id: "bank-statements", name: "Bank Statements — Last 3 Months", formats: [".pdf"], required: true, requirement: "required", criticality: "standard", sourcing: "readily_available", multiPage: true, expiry: { kind: "staleness", days: 90 } },
            { kind: "document", id: "gift-letter", name: "Gift Letter", formats: [".pdf"], required: false, requirement: "optional", criticality: "critical", sourcing: "readily_available", multiPage: false, expiry: null },
          ],
        },
      ],
    },
    {
      id: "property", name: "Property Valuation", owner: "Originator",
      permissions: perms("v", "vu", "v", "v"),
      subsections: [
        {
          id: "valuation", name: "Valuation",
          blocks: [
            { kind: "document", id: "appraisal", name: "Appraisal Report", formats: [".pdf"], required: true, requirement: "required", criticality: "critical", sourcing: "constrained", multiPage: true, expiry: { kind: "staleness", days: 120 } },
            { kind: "document", id: "purchase-agreement", name: "Purchase Agreement", formats: [".pdf"], required: true, requirement: "required", criticality: "critical", sourcing: "readily_available", multiPage: true, expiry: null },
          ],
        },
      ],
    },
    {
      id: "title-escrow", name: "Title & Escrow", owner: "Escrow",
      permissions: perms("-", "vu", "v", "vu"),
      subsections: [
        {
          id: "title-docs", name: "Title documents",
          blocks: [
            { kind: "document", id: "prelim-title", name: "Preliminary Title Report", formats: [".pdf"], required: true, requirement: "required", criticality: "standard", sourcing: "constrained", multiPage: true, expiry: null },
            { kind: "document", id: "insurance-binder", name: "Insurance Binder", formats: [".pdf"], required: true, requirement: "required", criticality: "supporting", sourcing: "readily_available", multiPage: false, expiry: null },
            { kind: "document", id: "prelim-cd", name: "Preliminary Closing Disclosure", formats: [".pdf"], required: true, requirement: "required", criticality: "standard", sourcing: "readily_available", multiPage: true, expiry: null },
          ],
        },
      ],
    },
    {
      id: "credit-compliance", name: "Credit & Compliance", owner: "Homium",
      permissions: perms("-", "-", "v", "vu"),
      subsections: [
        {
          id: "credit", name: "Credit",
          blocks: [
            { kind: "document", id: "credit-report", name: "Credit Report — Tri-Merge", formats: [".pdf"], required: true, requirement: "required", criticality: "critical", sourcing: "readily_available", multiPage: true, expiry: { kind: "hard" } },
            { kind: "document", id: "background-check", name: "Background Check — CA DOJ", formats: [".pdf"], required: true, requirement: "required", criticality: "critical", sourcing: "constrained", multiPage: false, expiry: { kind: "staleness", days: 60 } },
          ],
        },
        {
          id: "attestations", name: "Attestations",
          blocks: [
            {
              kind: "fields", id: "program-attestation", name: "Homium Program Attestation",
              fields: [
                { id: "occupancy", type: "select", label: "Occupancy type", required: true, options: ["Primary residence", "Second home"] },
                { id: "consent", type: "yesno", label: "Equity-share terms acknowledged", required: true },
                { id: "signed-on", type: "date", label: "Signed on", required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ── saved sections: reusable section fragments (copies on insert, never links) ─
export const SAVED_SECTIONS: { id: string; name: string; blocks: number; docs: number; source: string }[] = [
  { id: "std-application", name: "Standard Application", blocks: 3, docs: 2, source: "saved Jul 12" },
  { id: "ca-compliance", name: "CA Compliance Pack", blocks: 4, docs: 4, source: "from Refi — CA" },
  { id: "self-employed", name: "Self-Employed Income", blocks: 5, docs: 4, source: "saved Jun 30" },
];

// ── helpers ──────────────────────────────────────────────────────────────────
export const templateToJson = (t: Template): string => JSON.stringify(t, null, 2);

export const templateStats = (t: Template) => {
  let docs = 0, fieldGroups = 0, fields = 0;
  for (const s of t.sections)
    for (const ss of s.subsections)
      for (const b of ss.blocks) {
        if (b.kind === "document") docs++;
        else { fieldGroups++; fields += b.fields.length; }
      }
  return { sections: t.sections.length, docs, fieldGroups, fields };
};

// Expiry rendered the Ops Desk way: quiet mono, no badges.
export const expiryLabel = (e: ExpiryRule): string =>
  e === null ? "no clock" : e.kind === "hard" ? "valid through closing" : `stale after ${e.days}d`;

// Labels rendered the Ops Desk way: quiet mono, lowercase, no badges.
export const requirementLabel = (r: RequirementLevel): string =>
  r === "required" ? "required" : r === "required_alt" ? "required · alternatives accepted" : r === "recommended" ? "recommended" : "optional";

export const criticalityLabel = (c: Criticality): string =>
  c === "critical" ? "critical" : c === "standard" ? "standard" : "supporting";

export const sourcingLabel = (s: Sourcing): string =>
  s === "readily_available" ? "readily available" : s === "constrained" ? "constrained" : "scarce";

// Alternative-group lookups for cross-referencing captions (both directions).
export const groupForPrimary = (t: Template, blockId: string): AlternativeGroup | undefined =>
  t.alternatives.find((g) => g.primary === blockId);
export const groupsSatisfiedBy = (t: Template, blockId: string): AlternativeGroup[] =>
  t.alternatives.filter((g) => g.satisfiedBy.includes(blockId));
export const blockName = (t: Template, blockId: string): string => {
  for (const s of t.sections) for (const ss of s.subsections) for (const b of ss.blocks) if (b.id === blockId) return b.name;
  return blockId;
};
