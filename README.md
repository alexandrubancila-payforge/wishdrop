# WishDrop

Shareable gift lists — [wishdrop.site](https://wishdrop.site). Astro (server-rendered) on a Cloudflare Worker, with D1, R2 and Tailwind 4.

> **Rebuilt from the live site (November 2026).** The original source code was lost; this project was reconstructed from what the live site and Cloudflare expose: the rendered pages in all four languages, the client scripts, the compiled CSS, the database schema and the API calls. It uses the **same** Cloudflare database (`wishdrop-db`), photo bucket (`wishdrop-images`) and session store, so every user, list, gift and reservation carries over. See `_recovered/` for the raw material.

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars      # once; set a JWT_SECRET
npm run db:local                    # once; loads _recovered/wishdrop-db.sql into the local D1
npm run dev                         # http://localhost:4321
```

Locally, emails are printed to the terminal instead of being sent. Google sign-in needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.dev.vars` and `http://localhost:4321/api/auth/google/callback` as an authorized redirect URI in Google Cloud.

## Structure

| Path | What |
|---|---|
| `src/pages/` | One file per page. `/en/…`, `/de/…`, `/ru/…` are the same pages: `src/middleware.ts` strips the prefix and sets `Astro.locals.lang` (Romanian has no prefix). |
| `src/pages/api/` | JSON API used by the pages: auth (email + Google), lists, gifts, reservations, upload, link auto-fill (`scrape`), contact, images. |
| `src/i18n/*.ts` | Every text, per page group, in ro / en / de / ru. `makeT(lang, common, ns)` returns `t("key")`. |
| `src/layouts/Layout.astro` | `<head>`, header (language + account menus), footer, mobile tab bar, donate and confirm modals. |
| `src/lib/` | `db.ts` (D1 queries), `auth.ts` (bcrypt + JWT session cookie), `storage.ts` (R2), `email.ts` (Cloudflare Email Service), `i18n.ts`. |
| `src/styles/global.css` | Tailwind 4 theme (colors, fonts) and component classes (`.btn`, `.card`, `.field`, …) recovered from the live CSS. |
| `migrations/` | The database schema, under the same migration names already applied to `wishdrop-db`. |
| `_recovered/` | What was pulled from the live site. `wishdrop-db.sql`, `r2/` and `logged-in/` hold user data and are git-ignored. |

## Deploy

Secrets (once): `npx wrangler secret put JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CF_EMAIL_TOKEN`.

```bash
npm run deploy
```

The old site is a Cloudflare **Pages** project (`wishdrop`); this one deploys as a **Worker** with the same bindings. Moving `wishdrop.site` from the Pages project to the Worker is the cut-over step — until then the live site is untouched. Everyone signs in again once after the switch (new session secret); passwords keep working (same bcrypt hashes).
