/**
 * Sessions and passwords.
 *
 * Passwords are bcrypt (cost 10), the same format as the live database, so
 * existing email accounts keep working. The session is a signed JWT in an
 * HttpOnly cookie.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "cloudflare:workers";
import type { AstroCookies } from "astro";

export const SESSION_COOKIE = "wd_session";
/** Short-lived cookie holding the Google sign-in state, return path and language. */
export const OAUTH_COOKIE = "wd_oauth";
const SESSION_DAYS = 60;

const secret = () => new TextEncoder().encode(env.JWT_SECRET);

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export async function verifyPassword(password: string, hash: string | null | undefined) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function startSession(cookies: AstroCookies, userId: string, secure: boolean) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

/** The user id in the session cookie, or null. */
export async function sessionUserId(cookies: AstroCookies): Promise<string | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** A random URL-safe token (email verification, password reset, reservations). */
export function randomToken(bytes = 32) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
