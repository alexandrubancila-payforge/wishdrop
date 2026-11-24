import type { APIRoute } from "astro";
import { LANGS, localePath, type Lang } from "@/lib/i18n";
import { guideAlternates } from "@/lib/guides";
import { guides } from "@/i18n/guides";

const SITE = "https://wishdrop.site";

/** Public pages in every language, with hreflang alternates (robots.txt points here). */
export const GET: APIRoute = () => {
  const same = (path: string) => Object.fromEntries(LANGS.map((l) => [l, path])) as Record<Lang, string>;
  const pages: Record<Lang, string>[] = [
    same("/"),
    same("/example"),
    same("/contact"),
    same("/privacy"),
    same("/terms"),
    guideAlternates(null),
    ...guides.ro.map((g) => guideAlternates(g.key)),
  ];
  const url = (l: Lang, path: string) => SITE + localePath(l, path);
  const body = pages
    .flatMap((alts) =>
      LANGS.map(
        (l) => `  <url>
    <loc>${url(l, alts[l])}</loc>
${LANGS.map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${url(a, alts[a])}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url("ro", alts.ro)}"/>
  </url>`,
      ),
    )
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`,
    { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } },
  );
};
