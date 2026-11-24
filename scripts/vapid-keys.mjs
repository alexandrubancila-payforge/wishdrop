#!/usr/bin/env node
/**
 * New Web Push (VAPID) keys for lib/push.ts. Prints the public key (the
 * VAPID_PUBLIC_KEY var in wrangler.jsonc) and the private key as JWK (the
 * VAPID_PRIVATE_JWK secret: `wrangler secret put VAPID_PRIVATE_JWK`).
 * New keys invalidate every existing phone subscription.
 */
import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const { kty, crv, x, y, d } = privateKey.export({ format: "jwk" });
console.log("VAPID_PUBLIC_KEY=" + publicKey.export({ format: "der", type: "spki" }).subarray(-65).toString("base64url"));
console.log("VAPID_PRIVATE_JWK=" + JSON.stringify({ kty, crv, x, y, d }));
