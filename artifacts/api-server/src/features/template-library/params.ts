import type { Request, Response } from "express";

const FAMILY_RE = /^[a-z0-9][a-z0-9-]*$/;

/** Parse and validate {family, version} path params; responds 400 on failure. */
export function parseVersionParams(req: Request, res: Response): { family: string; version: number } | undefined {
  const rawFamily = Array.isArray(req.params["family"]) ? req.params["family"][0] : req.params["family"];
  const rawVersion = Array.isArray(req.params["version"]) ? req.params["version"][0] : req.params["version"];
  const version = Number(rawVersion);
  if (!rawFamily || !FAMILY_RE.test(rawFamily) || !Number.isInteger(version) || version < 1) {
    res.status(400).json({ error: "Invalid family or version" });
    return undefined;
  }
  return { family: rawFamily, version };
}
