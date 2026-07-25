import type { Request } from "express";

/**
 * Client IP for the upload audit trail. Behind the Replit proxy the real
 * client is the FIRST hop in X-Forwarded-For; fall back to the socket.
 */
export function clientIp(req: Request): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  const first = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || undefined;
}
