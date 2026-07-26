import { objectStorageClient } from "../src/lib/objectStorage";
const dir = process.env["PRIVATE_OBJECT_DIR"]!;
const clean = dir.replace(/^\/+/, "").replace(/\/+$/, "");
const slash = clean.indexOf("/");
const bucket = objectStorageClient.bucket(slash < 0 ? clean : clean.slice(0, slash));
const prefix = `${slash < 0 ? "" : clean.slice(slash + 1) + "/"}applications/`;
const [files] = await bucket.getFiles({ prefix });
for (const f of files) console.log("applications/" + f.name.slice(prefix.length));
process.exit(0);
