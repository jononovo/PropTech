// Dev utility: push a packet PDF through the full pipeline for one application
// and print the resulting analysis. Replaces the throwaway /tmp e2e script —
// lives in the repo so it survives container recycles.
//
//   node artifacts/api-server/scripts/run-packet.mjs <applicationId> <pdfPath> [--auto]
//
// Uploads the packet, decides the gate (bypassed by default — the sample packet
// carries preflight flags; --auto for clean packets), then polls until the run
// lands (report) or honestly fails (gated + lastRunError).
import { readFileSync } from "node:fs";
import path from "node:path";

const API = process.env.API_BASE ?? "http://127.0.0.1:80/api";
const [appId, pdfPath, flag] = process.argv.slice(2);
if (!appId || !pdfPath) {
  console.error("usage: node run-packet.mjs <applicationId> <pdfPath> [--auto]");
  process.exit(2);
}

const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

// 1. Upload
const form = new FormData();
form.set("file", new Blob([readFileSync(pdfPath)], { type: "application/pdf" }), path.basename(pdfPath));
let res = await fetch(`${API}/applications/${appId}/packet`, { method: "POST", body: form });
let body = await res.json();
if (!res.ok) die(`upload failed ${res.status}: ${JSON.stringify(body)}`);
// Packet endpoints return the full application document; packet fields are nested.
let pkt = body.packet ?? {};
console.log(`upload: ${res.status} state=${pkt.state} pages=${pkt.pages} flags=${JSON.stringify(pkt.preflightFlags ?? [])}`);

// 2. Gate (skip if upload auto-started processing)
if (pkt.state === "gated") {
  const decision = flag === "--auto" ? { decision: "auto" } : { decision: "bypassed", decidedBy: "Underwriter" };
  res = await fetch(`${API}/applications/${appId}/packet/gate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(decision),
  });
  body = await res.json();
  if (!res.ok) die(`gate failed ${res.status}: ${JSON.stringify(body)}`);
  pkt = body.packet ?? {};
  console.log(`gate: ${res.status} state=${pkt.state} decision=${pkt.gate?.decision}`);
}

// 3. Poll to completion
const t0 = Date.now();
for (;;) {
  await new Promise((r) => setTimeout(r, 4000));
  const app = await (await fetch(`${API}/applications/${appId}`)).json();
  const s = app.packet?.state;
  const secs = Math.round((Date.now() - t0) / 1000);
  if (s === "report") {
    console.log(`[${secs}s] state=report`);
    break;
  }
  if (s === "gated") die(`[${secs}s] RUN FAILED (honest revert): ${app.packet?.lastRunError ?? "no lastRunError"}`);
  if (secs > Number(process.env.POLL_SECS ?? 240)) die(`[${secs}s] still state=${s} — poll window over (run may still land; check the app)`);
}

// 4. Print the landed run
const analysis = await (await fetch(`${API}/applications/${appId}/analysis`)).json();
const run = analysis.runs[analysis.runs.length - 1];
console.log(`run=${run.runId}\npipeline=${run.pipelineVersion}`);
for (const d of run.documents) {
  console.log(`  DOC p.${d.segment.pages[0]}-${d.segment.pages[1]} -> ${d.suggestedBlockId} (conf ${d.confidence}) ${d.suggestedName}`);
  for (const f of d.flags ?? []) console.log(`      flag ${f.code}`);
}
for (const u of run.unassigned ?? []) {
  console.log(`  UNASSIGNED p.${u.pages[0]}-${u.pages[1]}: ${u.description.slice(0, 90)}`);
}
console.log(`whisper: ${JSON.stringify(run.whisper)}`);
