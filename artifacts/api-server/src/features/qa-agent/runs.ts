import { listCorpusKeys } from "../../lib/packetObjectStore";

/**
 * Latest analyzer run id for an application, derived from the corpus layout
 * (runs/<runId>/...). Run ids are timestamp-prefixed, so lexicographic max =
 * latest — same convention the citation resolver relies on.
 */
export async function latestRunId(storageFolder: string): Promise<string | undefined> {
  const keys = await listCorpusKeys(storageFolder);
  let latest: string | undefined;
  for (const k of keys) {
    if (!k.startsWith("runs/")) continue;
    const id = k.split("/")[1];
    if (id && (!latest || id > latest)) latest = id;
  }
  return latest;
}
