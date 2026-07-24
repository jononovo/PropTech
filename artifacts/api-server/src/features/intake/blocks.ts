import type { Application } from "./store";

type TemplateBlock = Application["template"]["sections"][number]["subsections"][number]["blocks"][number];

/** Filesystem-safe path segment: ids used in disk paths must match this. */
export const SAFE_SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function isSafeSegment(value: string | undefined): value is string {
  return Boolean(value && SAFE_SEGMENT_RE.test(value));
}

/** Find a block by id within the application's pinned template. */
export function findBlock(app: Application, blockId: string): TemplateBlock | undefined {
  for (const section of app.template.sections) {
    for (const ss of section.subsections) {
      const hit = ss.blocks.find((b) => b.id === blockId);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Check an uploaded filename against a document block's allowed formats. */
export function extensionAllowed(block: TemplateBlock, filename: string): boolean {
  const formats = block.formats ?? [];
  if (formats.length === 0) return true;
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : "";
  return formats.some((f) => f.toLowerCase() === ext);
}
