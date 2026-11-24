/**
 * Phone / desktop notifications (Web Push, RFC 8030) with no dependencies:
 * the payload is encrypted with aes128gcm (RFC 8291) and every request is
 * signed with our VAPID key (RFC 8292), all with WebCrypto.
 *
 * Keys: VAPID_PUBLIC_KEY (var, base64url raw P-256 point, also used by the
 * browser to subscribe) and VAPID_PRIVATE_JWK (secret, the private key as JWK).
 * Without them, sending is a no-op.
 */
import { env, waitUntil } from "cloudflare:workers";
import { db } from "./db";

export interface PushMessage {
  title: string;
  body: string;
  /** Opened when the notification is tapped. */
  url: string;
  /** Same tag = the new one replaces the old one on the phone. */
  tag?: string;
}

interface Subscription {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  lang: string;
}

const utf8 = new TextEncoder();

export function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

async function hmac(key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

/** RFC 8291: one aes128gcm record for the browser's key pair (p256dh) and auth secret. */
export async function encrypt(payload: Uint8Array, p256dh: string, auth: string) {
  const uaPublic = fromB64url(p256dh);
  const authSecret = fromB64url(auth);
  const local = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asPublic = new Uint8Array((await crypto.subtle.exportKey("raw", local.publicKey)) as ArrayBuffer);
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));

  const one = new Uint8Array([1]);
  const ikm = await hmac(await hmac(authSecret, shared), concat(utf8.encode("WebPush: info\0"), uaPublic, asPublic, one));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(utf8.encode("Content-Encoding: aes128gcm\0"), one))).slice(0, 16);
  const nonce = (await hmac(prk, concat(utf8.encode("Content-Encoding: nonce\0"), one))).slice(0, 12);

  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // 0x02 = last (and only) record, no padding.
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(payload, new Uint8Array([2]))));

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, sealed);
}

let signingKey: Promise<CryptoKey> | null = null;

/** RFC 8292: a short-lived ES256 JWT for the push service's origin. */
export async function vapidHeader(endpoint: string) {
  signingKey ??= crypto.subtle.importKey(
    "jwk",
    { ...JSON.parse(env.VAPID_PRIVATE_JWK!), key_ops: ["sign"] },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const part = (o: object) => b64url(utf8.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.APP_URL || "https://wishdrop.site",
  })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await signingKey, utf8.encode(unsigned)));
  return `vapid t=${unsigned}.${b64url(sig)}, k=${env.VAPID_PUBLIC_KEY}`;
}

export const pushConfigured = () => !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_JWK);

async function send(sub: Subscription, message: PushMessage) {
  const body = await encrypt(utf8.encode(JSON.stringify(message)), sub.p256dh, sub.auth);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      authorization: await vapidHeader(sub.endpoint),
      "content-encoding": "aes128gcm",
      "content-type": "application/octet-stream",
      ttl: String(24 * 3600),
      urgency: "normal",
    },
    body,
  });
  // Gone: the browser unsubscribed or the app was removed.
  if (res.status === 404 || res.status === 410) {
    await db().prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(sub.endpoint).run();
  } else if (!res.ok) {
    console.warn("push failed", res.status, new URL(sub.endpoint).host, await res.text().catch(() => ""));
  }
}

/**
 * Send to every browser these users turned notifications on in. `make` builds
 * the message in each browser's language. Runs after the response is sent.
 */
export function pushToUsers(userIds: string[], make: (lang: string) => PushMessage | Promise<PushMessage>) {
  if (!pushConfigured() || !userIds.length) return;
  const job = (async () => {
    const subs: Subscription[] = [];
    for (let i = 0; i < userIds.length; i += 50) {
      const chunk = userIds.slice(i, i + 50);
      const { results } = await db()
        .prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${chunk.map(() => "?").join(",")})`)
        .bind(...chunk)
        .all<Subscription>();
      subs.push(...results);
    }
    const byLang = new Map<string, Promise<PushMessage>>();
    await Promise.allSettled(
      subs.map(async (sub) => {
        if (!byLang.has(sub.lang)) byLang.set(sub.lang, Promise.resolve(make(sub.lang)));
        await send(sub, await byLang.get(sub.lang)!);
      }),
    );
  })().catch((e) => console.warn("push error", e));
  try {
    waitUntil(job);
  } catch {
    /* not inside a request: the promise still runs */
  }
}
