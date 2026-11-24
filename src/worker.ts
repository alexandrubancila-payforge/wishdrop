/**
 * The Worker's entry point: Astro answers every request (fetch), and the
 * daily cron (wrangler.jsonc "triggers") sends reminder emails, copies new
 * photos to the backup bucket and clears old notifications and request counters.
 */
import { handle } from "@astrojs/cloudflare/handler";
import { backupPhotos } from "./lib/backup";
import { db, now } from "./lib/db";
import { KEEP_DAYS } from "./lib/notifications";
import { pruneLimits } from "./lib/limits";
import { sendReminders } from "./lib/reminders";

export default {
  fetch: handle,
  async scheduled(_controller: ScheduledController, _env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      Promise.all([
        backupPhotos(),
        pruneLimits(),
        sendReminders(),
        db().prepare("DELETE FROM notifications WHERE created_at < ?").bind(now() - KEEP_DAYS * 86_400_000).run(),
      ]),
    );
  },
};
