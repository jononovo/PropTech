import type { Application } from "./store";

type TemplateBlock = Application["template"]["sections"][number]["subsections"][number]["blocks"][number];

/** Filesystem-safe path segment: ids used in disk paths must match this. */
export const SAFE_SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function isSafeSegment(value: string | undefined): value is string {
  return Boolean(value && SAFE_SEGMENT_RE.test(value));
}

type TemplateSection = Application["template"]["sections"][number];

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

/** Find the section a block belongs to — section permissions govern its blocks. */
export function findSectionOfBlock(app: Application, blockId: string): TemplateSection | undefined {
  return app.template.sections.find((section) =>
    section.subsections.some((ss) => ss.blocks.some((b) => b.id === blockId)),
  );
}

/**
 * Section-level upload permission from the pinned template ("Who adds").
 * A role absent from the permissions list is denied — declared intent only.
 */
export function sectionAllowsUpload(section: TemplateSection, role: string): boolean {
  return (section.permissions ?? []).some((p) => p.role === role && p.upload);
}

/** Check an uploaded filename against a document block's allowed formats. */
export function extensionAllowed(block: TemplateBlock, filename: string): boolean {
  const formats = block.formats ?? [];
  if (formats.length === 0) return true;
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : "";
  return formats.some((f) => f.toLowerCase() === ext);
}
