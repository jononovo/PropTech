// One-time seed: materialize the approved mockup template into the file store.
// Run from repo root: pnpm dlx tsx artifacts/api-server/scripts/seed.ts
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PURCHASE_LOAN } from "../../mockup-sandbox/src/components/mockups/homium/builderData";

const DATA_DIR = path.resolve(import.meta.dirname, "..", "data");

// Strip deprecated/mockup-only keys so the stored JSON exactly matches the contract.
function cleanTemplate(tpl: typeof PURCHASE_LOAN) {
  return {
    template: tpl.template,
    version: tpl.version,
    status: tpl.status,
    program: tpl.program,
    alternatives: tpl.alternatives.map((g) => ({
      id: g.id,
      name: g.name,
      primary: g.primary,
      satisfiedBy: [...g.satisfiedBy],
    })),
    sections: tpl.sections.map((s) => ({
      id: s.id,
      name: s.name,
      owner: s.owner,
      permissions: s.permissions.map((p) => ({ role: p.role, view: p.view, upload: p.upload })),
      subsections: s.subsections.map((ss) => ({
        id: ss.id,
        name: ss.name,
        blocks: ss.blocks.map((b: Record<string, unknown>) => {
          const out: Record<string, unknown> = { kind: b.kind, id: b.id, name: b.name };
          for (const k of ["formats", "requirement", "criticality", "sourcing", "multiPage", "expiry", "fields"]) {
            if (b[k] !== undefined) out[k] = b[k];
          }
          return out;
        }),
      })),
    })),
  };
}

function writeJson(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
  console.log("wrote", path.relative(process.cwd(), file));
}

const family = "purchase-loan-ca";
const base = cleanTemplate(PURCHASE_LOAN);

writeJson(path.join(DATA_DIR, "templates", family, "v3.json"), { ...base, version: 3, status: "active" });
writeJson(path.join(DATA_DIR, "templates", family, "v4.json"), { ...base, version: 4, status: "draft" });

// Saved sections: real copies of two sections from the seed template.
const bySectionId = Object.fromEntries(base.sections.map((s) => [s.id, s]));
const saved = [
  { id: "std-application", name: "Standard Application", source: "from Purchase Loan — CA v3", sectionId: "initial-application" },
  { id: "income-employment", name: "Income & Employment", source: "from Purchase Loan — CA v3", sectionId: "income" },
];
for (const s of saved) {
  const section = bySectionId[s.sectionId] ?? base.sections[1];
  if (!section) continue;
  writeJson(path.join(DATA_DIR, "saved-sections", `${s.id}.json`), {
    id: s.id,
    name: s.name,
    source: s.source,
    section,
  });
}
