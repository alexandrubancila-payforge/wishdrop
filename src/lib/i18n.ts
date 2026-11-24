/**
 * Languages and translations.
 *
 * Romanian is served at the root (`/dashboard`), the others under a prefix
 * (`/en/dashboard`, `/de/…`, `/ru/…`). The middleware strips the prefix and sets
 * `Astro.locals.lang`, so every page exists once in `src/pages/`.
 *
 * Strings live in `src/i18n/<namespace>.ts`, one object per language.
 */
export const LANGS = ["ro", "en", "de", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ro";

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

/** "/en/dashboard" → { lang: "en", path: "/dashboard" }; "/dashboard" → { lang: "ro", … } */
export function splitLang(pathname: string): { lang: Lang; path: string; prefixed: boolean } {
  const m = pathname.match(/^\/(en|de|ru)(\/.*)?$/);
  if (m) return { lang: m[1] as Lang, path: m[2] || "/", prefixed: true };
  return { lang: DEFAULT_LANG, path: pathname || "/", prefixed: false };
}

/** The URL of `path` in `lang`: localePath("en", "/dashboard") → "/en/dashboard". */
export function localePath(lang: Lang, path = "/"): string {
  if (lang === DEFAULT_LANG) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

export type Dict = Record<string, string>;
export type Bundle = Record<Lang, Dict>;
export type T = (key: string, vars?: Record<string, string | number>) => string;

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
