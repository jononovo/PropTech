#!/usr/bin/env node
/**
 * One-shot backfill: copies legacy on-disk document bytes
 *   data/packets/<appId>/packet.pdf            → packets/<appId>/packet.pdf
 *   data/packets/<appId>/thumbs/page-N.png     → packets/<appId>/thumbs/page-N.png
 *   data/uploads/<appId>/<blockId>/<filename>  → uploads/<appId>/<blockId>/<filename>
 * into App Storage under PRIVATE_OBJECT_DIR.
 *
 * Idempotent: objects that already exist with the same byte size are skipped.
 * Legacy disk files are left in place as a manual backup.
 *
 * Usage: node scripts/backfill-bytes-to-app-storage.mjs
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Storage } from "@google-cloud/storage";

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(API_ROOT, "data");

const privateDir = process.env.PRIVATE_OBJECT_DIR;
if (!privateDir) {
  console.error("PRIVATE_OBJECT_DIR is not set — App Storage is not provisioned");
  process.exit(1);
}
const clean = privateDir.replace(/^\/+/, "").replace(/\/+$/, "");
const bucketName = clean.split("/")[0];
const prefix = clean.slice(bucketName.length + 1);

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});
const bucket = storage.bucket(bucketName);

const CONTENT_TYPES = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
const contentTypeFor = (file) => CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";

let uploaded = 0;
let skipped = 0;

async function put(localPath, key) {
  const destination = prefix ? `${prefix}/${key}` : key;
  const object = bucket.file(destination);
  const [exists] = await object.exists();
  if (exists) {
    const [meta] = await object.getMetadata();
    if (Number(meta.size) === statSync(localPath).size) {
      skipped++;
      return;
    }
  }
  await bucket.upload(localPath, { destination, contentType: contentTypeFor(localPath) });
  uploaded++;
  console.log(`uploaded ${key}`);
}

const dirs = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);
const files = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name) : []);

for (const appId of dirs(path.join(DATA_DIR, "packets"))) {
  const pdf = path.join(DATA_DIR, "packets", appId, "packet.pdf");
  if (existsSync(pdf)) await put(pdf, `packets/${appId}/packet.pdf`);
  for (const thumb of files(path.join(DATA_DIR, "packets", appId, "thumbs"))) {
    await put(path.join(DATA_DIR, "packets", appId, "thumbs", thumb), `packets/${appId}/thumbs/${thumb}`);
  }
}
for (const appId of dirs(path.join(DATA_DIR, "uploads"))) {
  for (const blockId of dirs(path.join(DATA_DIR, "uploads", appId))) {
    for (const file of files(path.join(DATA_DIR, "uploads", appId, blockId))) {
      await put(path.join(DATA_DIR, "uploads", appId, blockId, file), `uploads/${appId}/${blockId}/${file}`);
    }
  }
}

console.log(`backfill done: ${uploaded} uploaded, ${skipped} already present`);
