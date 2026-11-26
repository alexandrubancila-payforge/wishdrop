// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://wishdrop.site",
  output: "server",
  // GitHub Actions has no Cloudflare login, so the dev server there runs without remote bindings
  // (Workers AI, the photo check in lib/moderation.ts, then fails and lets photos through).
  adapter: cloudflare({ imageService: "passthrough", remoteBindings: !process.env.GITHUB_ACTIONS }),
  vite: { plugins: [tailwindcss()] },
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
});
