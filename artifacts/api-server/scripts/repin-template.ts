// One-off operational script: move an application's pinned template to a newer
// version of the SAME family. The pin is deliberately frozen at creation (spec:
// "pinned per application") so a reviewer's checklist never shifts silently —
// moving it is therefore an explicit, validated operation, not an edit.
//
// Run from repo root:
//   pnpm dlx tsx artifacts/api-server/scripts/repin-template.ts <applicationId> <targetVersion>
//
// Safety: refuses downgrades and any target version that drops a block id the
// application already references in uploads. Goes through updateApplication
// (SELECT ... FOR UPDATE) like every other mutation — no side-door SQL.
import { readFileSync } from "node:fs";
import path from "node:path";
import { updateApplication } from "../src/features/intake/store";

const [appId, versionArg] = process.argv.slice(2);
const targetVersion = Number(versionArg);
if (!appId || !Number.isInteger(targetVersion)) {
  console.error("usage: tsx repin-template.ts <applicationId> <targetVersion>");
  process.exit(2);
}

const app = await updateApplication(appId, (app) => {
  if (targetVersion < app.version) {
    throw new Error(`refusing downgrade v${app.version} -> v${targetVersion}`);
  }
  if (targetVersion === app.version) {
    throw new Error(`application already pins v${app.version}`);
  }
  const file = path.resolve(
    import.meta.dirname,
    "..",
    "data",
    "templates",
    app.family,
    `v${targetVersion}.json`,
  );
  const tpl = JSON.parse(readFileSync(file, "utf8"));
  if (tpl.version !== targetVersion) {
    throw new Error(`${file} declares version ${tpl.version}, expected ${targetVersion}`);
  }
  const nextIds = new Set<string>(
    tpl.sections.flatMap((s: { subsections: { blocks: { id: string }[] }[] }) =>
      s.subsections.flatMap((ss) => ss.blocks.map((b) => b.id)),
    ),
  );
  const orphaned = Object.keys(app.uploads).filter((id) => !nextIds.has(id));
  if (orphaned.length > 0) {
    throw new Error(`target version drops blocks that already have uploads: ${orphaned.join(", ")}`);
  }
  console.log(`repinning ${app.id}: ${app.family} v${app.version} -> v${targetVersion}`);
  app.version = targetVersion;
  app.template = tpl;
  return app;
});

if (!app) {
  console.error(`application ${appId} not found`);
  process.exit(1);
}
console.log(`done: ${app.id} now pins ${app.family} v${app.version}`);
process.exit(0);
