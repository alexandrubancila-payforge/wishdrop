/**
 * Gift guides (SEO pages, texts in src/i18n/guides.ts). Each language has its
 * own folder and slugs: /ideas/… (en), /ro/idei/…, /de/ideen/…, /ru/idei/….
 * The route files in src/pages/{idei,ideas,ideen}/ all call resolveGuide().
 */
import { LANGS, type Lang } from "./i18n";
import { guides, guidesHub, type GuideDoc, type GuideKey } from "@/i18n/guides";

export const hubPath = (lang: Lang) => `/${guidesHub[lang].slug}`;
export const guidePath = (lang: Lang, key: GuideKey) => {
  const g = guides[lang].find((x) => x.key === key)!;
  return `${hubPath(lang)}/${g.slug}`;
};

/** Paths of the same guide (or the hub) in every language, for hreflang. */
export const guideAlternates = (key: GuideKey | null) =>
  Object.fromEntries(LANGS.map((l) => [l, key ? guidePath(l, key) : hubPath(l)])) as Record<Lang, string>;

export type Resolved =
  | { kind: "hub" }
  | { kind: "guide"; guide: GuideDoc }
  | { kind: "redirect"; to: string }
  | { kind: "missing" };

/**
 * What /<folder>/<slug> shows in this language. A folder or slug from another
 * language redirects to this language's address (e.g. /idei/… → /ideas/…).
 */
export function resolveGuide(lang: Lang, folder: string, slug: string | undefined): Resolved {
  const own = guidesHub[lang].slug === folder;
  if (!slug) return own ? { kind: "hub" } : { kind: "redirect", to: hubPath(lang) };
  const mine = guides[lang].find((g) => g.slug === slug);
  if (mine && own) return { kind: "guide", guide: mine };
  for (const l of LANGS) {
    const other = guides[l].find((g) => g.slug === slug);
    if (other) return { kind: "redirect", to: guidePath(lang, other.key) };
  }
  return { kind: "missing" };
}
