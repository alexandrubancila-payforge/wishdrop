/**
 * Daily copy of the photo bucket (BUCKET → BACKUP_BUCKET), run by the cron
 * in src/worker.ts. Keys never change, so only keys missing from the backup
 * are copied; photos deleted from the site stay in the backup. At most
 * MAX_COPIES per run (Workers limits), the rest follow the next day.
 */
import { env } from "cloudflare:workers";

const MAX_COPIES = 250;

async function allKeys(bucket: R2Bucket) {
  const keys = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ cursor, limit: 1000 });
    for (const o of page.objects) keys.add(o.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys;
}

export async function backupPhotos() {
  const backup = env.BACKUP_BUCKET;
  if (!backup) return { copied: 0, missing: 0 };
  const [source, done] = await Promise.all([allKeys(env.BUCKET), allKeys(backup)]);
  const missing = [...source].filter((k) => !done.has(k));
  let copied = 0;
  for (const key of missing.slice(0, MAX_COPIES)) {
    const obj = await env.BUCKET.get(key);
    if (!obj) continue;
    await backup.put(key, obj.body, { httpMetadata: obj.httpMetadata, customMetadata: obj.customMetadata });
    copied++;
  }
  console.log(`photo backup: copied ${copied}, still missing ${missing.length - copied}, total ${source.size}`);
  return { copied, missing: missing.length - copied };
}
