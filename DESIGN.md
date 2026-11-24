# WishDrop · Pastel design

Light and warm: white cards with soft shadows on a warm-white page, **coral** as the one accent, pastel tints (mint, lavender, sun) for dates and states. **Flat colors only — no gradients anywhere.** One typeface, Plus Jakarta Sans. Icons are Phosphor classic line icons ("regular").

Reference implementation: `src/pages/feed.astro` (the signed-in home) and `src/layouts/Layout.astro` (header, tab bar, footer). When in doubt, copy how they do it.

## Tokens (Tailwind classes; defined in `src/styles/global.css`)

| Use | Class |
|---|---|
| Page background | `bg-paper` (set on body) |
| Text / muted text | `text-ink` / `text-ink-soft` |
| Hairlines | `border-line`, `divide-line`, `ring-line`, `bg-line` |
| Soft input / tile fill | `bg-sand` |
| Coral: decoration (icons, dots, rings) | `text-accent-500`, `bg-accent-500` |
| Coral: filled button | `bg-accent-600` (via `.btn-primary`) |
| Coral: text and links | `text-accent-700` |
| Coral tints | `bg-accent-50` (hover), `bg-accent-100` (soft fill) |
| Pastel pairs (fill + ink on it) | `bg-mint text-mint-ink` · `bg-lav text-lav-ink` · `bg-sun text-sun-ink` · `bg-accent-100 text-accent-700` |
| Shadows | `shadow-soft` (cards, pills), `shadow-lift` (hover, menus), `shadow-coral` (primary button) |

Do not use Tailwind's own palette colors (violet, fuchsia, pink, purple, amber, emerald, rose…) or any `bg-gradient-*` / `from-*` / `via-*` / `to-*`. Exceptions: `text-rose-600` for error text; `text-emerald-600` for a "saved" confirmation is fine but prefer `text-mint-ink`.

## Meaning of the pastels

- **Coral** — the action and brand: primary buttons, active tab, "most wanted" (`bg-accent-100 text-accent-700`), today's birthday.
- **Mint** — done / reserved / success (`bg-mint text-mint-ink`).
- **Lavender** — social: followers, profiles, privacy notes (`bg-lav text-lav-ink`).
- **Sun** — dates, warnings, "x of y available" (`bg-sun text-sun-ink`).

## Components (classes in `global.css`)

- `.card` — white, 22px radius, soft shadow. The default container. Override radius with `!rounded-2xl` / `!rounded-3xl` when needed. Don't nest cards.
- `.btn` + `.btn-primary` (coral, white text, pill) — one per screen area. `.btn-ghost` (white pill with hairline) for secondary. `.btn-soft` (coral tint) for quiet actions like "Reserve". Sizes via `!px-… !py-… text-sm`.
- `.field` — inputs/textareas: sand fill, turns white with a coral ring on focus. Rounded `0.95rem`; search inputs use `!rounded-full`.
- `.chip` — small pill label; color it with a pastel pair. Prices on photos: `chip bg-white/95 text-ink shadow-soft`.
- `.tab` + `aria-current="page"` (or `.is-active`) — text tab with coral underline.
- `.no-scrollbar` — horizontal scrollers.

## Type

All headings `font-extrabold tracking-tight` (no separate display font; `font-display` still works but is the same face). Page title `text-3xl sm:text-4xl`; section title `text-lg font-extrabold` with a coral line icon before it (`<Icon name="sparkle" class="h-5 w-5 text-accent-500" />`); body `text-sm`/`text-base`, muted copy `text-ink-soft`. Labels `text-sm font-semibold`.

## Shapes and layout

- Radius: cards 22px; photos and tiles `rounded-2xl`; small images `rounded-xl`; buttons, chips, search, avatars fully round. Icon tiles: `grid h-12 w-12 place-items-center rounded-2xl bg-accent-100 text-accent-600`.
- Spacing: sections `mt-8`; card padding `p-5 sm:p-6`; grids `gap-3`–`gap-5`.
- Photos: `object-cover`, square or 4:5; price chip bottom-left; star / heart top-right in a white circle.
- Reserved gift: photo `opacity-50 grayscale`, label in mint.
- Empty state: centered card, icon tile (`h-16 w-16 rounded-3xl bg-accent-100 text-accent-600`), bold title, one muted line, one primary button.
- Mobile first: everything must look right at 375px. The layout adds the bottom tab bar.

## Icons

`<Icon name="…" />` from `src/components/Icon.astro`: Phosphor (phosphoricons.com) classic line icons. Use the default weight (`regular`) almost everywhere; `weight="fill"` only for an active state (active tab, a set star/heart); `weight="bold"` for small carets and check marks. Do not use `duotone`. Available names are the list in `scripts/build-icons.mjs` (add a name there and run `node scripts/build-icons.mjs` for more). Prefer icons to emoji for UI; emoji may stay inside user-facing text where the copy already has them.
