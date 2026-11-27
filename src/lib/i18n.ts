/**
 * Languages and translations.
 *
 * English is served at the root (`/dashboard`), the others under a prefix
 * (`/ro/dashboard`, `/de/…`, `/ru/…`). The middleware strips the prefix and sets
 * `Astro.locals.lang`, so every page exists once in `src/pages/`. Until
 * 2026-11 Romanian was at the root and English under /en (now redirected).
 *
 * Strings live in `src/i18n/<namespace>.ts`, one object per language.
 */
export const LANGS = ["ro", "en", "de", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const LANG_NAMES: Record<Lang, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

export const OG_LOCALE: Record<Lang, string> = {
  ro: "ro_RO",
  en: "en_US",
  de: "de_DE",
  ru: "ru_RU",
};

/** Cookie set by the language switcher; unprefixed URLs redirect to it. */
export const LANG_COOKIE = "wd_lang";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

const PREFIX_RE = new RegExp(`^/(${LANGS.filter((l) => l !== DEFAULT_LANG).join("|")})(/.*)?$`);

/** "/ro/dashboard" → { lang: "ro", path: "/dashboard" }; "/dashboard" → { lang: "en", … } */
export function splitLang(pathname: string): { lang: Lang; path: string; prefixed: boolean } {
  const m = pathname.match(PREFIX_RE);
  if (m) return { lang: m[1] as Lang, path: m[2] || "/", prefixed: true };
  return { lang: DEFAULT_LANG, path: pathname || "/", prefixed: false };
}

/** The URL of `path` in `lang`: localePath("ro", "/dashboard") → "/ro/dashboard". */
export function localePath(lang: Lang, path = "/"): string {
  if (lang === DEFAULT_LANG) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

export type Dict = Record<string, string>;
export type Bundle = Record<Lang, Dict>;
export type T = (key: string, vars?: Record<string, string | number>) => string;

/**
 * The visitor's language from the browser's Accept-Language header
 * ("ro-RO,ro;q=0.9,en;q=0.8" → "ro"), or null when none of ours is listed.
 */
export function browserLang(header: string | null): Lang | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.trim().slice(2) ?? 1);
      return { lang: tag.split("-")[0], q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((x) => x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return (ranked.find((x) => isLang(x.lang))?.lang as Lang | undefined) ?? null;
}

/** Merge namespaces and return `t(key, vars)` for one language (English as fallback). */
export function makeT(lang: Lang, ...bundles: Bundle[]): T {
  const dict: Dict = {};
  const fallback: Dict = {};
  for (const b of bundles) {
    Object.assign(dict, b[lang]);
    Object.assign(fallback, b.en);
  }
  return (key, vars) => {
    let s = dict[key] ?? fallback[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

/** The strings a client script needs, as a plain object for `define:vars`. */
export function pick(t: T, keys: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, t(key)]));
}
