/**
 * Plural forms for the logged-in pages. Dictionary keys end in the CLDR
 * category: "lists.one", "lists.few", "lists.many", "lists.other".
 * Romanian: one (1) · few (0, 2–19) · other (20+ → "de liste").
 * Russian: one (1, 21…) · few (2–4, 22–24…) · many (5–20…).
 */
import type { Lang, T } from "@/lib/i18n";

export function plural(t: T, lang: Lang, base: string, n: number, vars: Record<string, string | number> = {}) {
  const cat = new Intl.PluralRules(lang).select(n);
  for (const k of [`${base}.${cat}`, `${base}.other`]) {
    const s = t(k, { n, ...vars });
    if (s !== k) return s;
  }
  return String(n);
}
