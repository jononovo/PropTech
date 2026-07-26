import { createHmac, timingSafeEqual } from "node:crypto";
import type { Response } from "express";

/**
 * Browser session identity: an HMAC-signed cookie set at login.
 *
 * Value format: `<username>.<hmac-sha256(username, SESSION_SECRET) base64url>`.
 * Stateless — no session table; the signature proves the server issued it.
 * Real auth later only changes HOW the cookie gets issued (credential
 * verification), not this carrier.
 */

export const SESSION_COOKIE = "sheaf_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET is not set — cannot sign sessions");
  return s;
}

function sign(username: string): string {
  return createHmac("sha256", secret()).update(username).digest("base64url");
}

export function sessionValue(username: string): string {
  return `${username}.${sign(username)}`;
}

/** Returns the username if the cookie is present and validly signed. */
export function verifySession(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const username = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(username));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return undefined;
  return username;
}

// Secure only in production: the published app is HTTPS-only; in dev the
// cookie must also work for plain-HTTP localhost curl testing.
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env["NODE_ENV"] === "production",
  };
}

export function setSessionCookie(res: Response, username: string): void {
  res.cookie(SESSION_COOKIE, sessionValue(username), { ...cookieOptions(), maxAge: MAX_AGE_MS });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}
