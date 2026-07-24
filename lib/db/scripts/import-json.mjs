// One-off, idempotent import of the file-era operational data into Postgres.
// Run from lib/db:  node scripts/import-json.mjs
// Applications upsert by id; analysis runs insert in file order (preserves
// seq/latest semantics) and skip already-imported runIds.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const root = path.resolve(process.cwd(), "../..");
const dataDir = path.join(root, "artifacts/api-server/data");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const appsDir = path.join(dataDir, "applications");
for (const f of existsSync(appsDir) ? readdirSync(appsDir).filter((f) => f.endsWith(".json")) : []) {
  const app = JSON.parse(readFileSync(path.join(appsDir, f), "utf8"));
  await pool.query(
    `insert into applications (id, data, created_at) values ($1, $2, $3)
     on conflict (id) do update set data = excluded.data`,
    [app.id, JSON.stringify(app), app.createdAt ?? new Date().toISOString()],
  );
  console.log("application:", app.id, "—", app.applicantName);
}

const anDir = path.join(dataDir, "analysis");
for (const f of existsSync(anDir) ? readdirSync(anDir).filter((f) => f.endsWith(".json")) : []) {
  const sc = JSON.parse(readFileSync(path.join(anDir, f), "utf8"));
  for (const run of sc.runs ?? []) {
    await pool.query(
      `insert into analysis_runs (application_id, run_id, data) values ($1, $2, $3)
       on conflict (application_id, run_id) do nothing`,
      [sc.applicationId, run.runId, JSON.stringify(run)],
    );
    console.log("run:", sc.applicationId, "—", run.runId);
  }
}

const c1 = await pool.query("select count(*)::int n from applications");
const c2 = await pool.query("select count(*)::int n from analysis_runs");
console.log(`DB now: ${c1.rows[0].n} applications, ${c2.rows[0].n} runs`);
await pool.end();
