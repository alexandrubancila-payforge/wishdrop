"""Align the 4 language versions of each captured page and list every string that differs.

Output: _recovered/i18n/<page>.json  ->  [{"en": ..., "ro": ..., "de": ..., "ru": ...}, ...]
Run: python3 -I _recovered/extract_i18n.py
"""
import html.parser, json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = {
    "home": "site/{p}index.html",
    "login": "site/{p}login/index.html",
    "register": "site/{p}register/index.html",
    "forgot": "site/{p}forgot-password/index.html",
    "reset": "site/{p}reset-password/index.html",
    "contact": "site/{p}contact/index.html",
    "example": "site/{p}example/index.html",
    "privacy": "site/{p}privacy/index.html",
    "terms": "site/{p}terms/index.html",
    "publiclist": "site-public-list/{p}w/wishlist-3v7uzd/index.html",
    "dashboard": "logged-in/{p}dashboard/index.html",
    "reservations": "logged-in/{p}dashboard/reservations/index.html",
    "settings": "logged-in/{p}settings/index.html",
    "editor": "logged-in/{p}dashboard/5500c42f-53bb-45ee-9a13-4bb8d1e8c500/index.html",
}
LANGS = {"ro": "", "en": "en/", "de": "de/", "ru": "ru/"}
ATTRS = {"placeholder", "aria-label", "title", "alt", "data-confirm", "data-err-min", "data-err-match", "data-default-label"}


class Tok(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.toks, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        for k, v in attrs:
            if v and (k in ATTRS or (tag == "meta" and k == "content" and len(v) > 25)):
                self.toks.append(v.strip())

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.toks.append(re.sub(r"\s+", " ", data.strip()))


def scripts_m(h):
    """The `const M = {...}` style string tables inside inline scripts."""
    out = []
    for m in re.finditer(r"const (?:M|RM|f|jsStr) = (\{.*?\});", h):
        try:
            out.append(json.loads(m.group(1)))
        except Exception:
            pass
    return out


os.makedirs(os.path.join(ROOT, "i18n"), exist_ok=True)
for page, pattern in PAGES.items():
    toks, tables = {}, {}
    for lang, prefix in LANGS.items():
        h = open(os.path.join(ROOT, pattern.format(p=prefix)), encoding="utf-8").read()
        t = Tok(); t.feed(h); toks[lang] = t.toks
        tables[lang] = scripts_m(h)
    lens = {l: len(v) for l, v in toks.items()}
    rows, seen = [], set()
    if len(set(lens.values())) == 1:
        for i in range(lens["en"]):
            vals = {l: toks[l][i] for l in LANGS}
            if len(set(vals.values())) > 1 and vals["en"] not in seen:
                seen.add(vals["en"]); rows.append(vals)
    else:
        rows.append({"_warning": f"token counts differ {lens}; align by hand", "en_tokens": toks["en"]})
    script_rows = []
    for i, tbl in enumerate(tables["en"]):
        for k in tbl:
            vals = {l: (tables[l][i].get(k) if i < len(tables[l]) else None) for l in LANGS}
            if isinstance(vals["en"], str):
                script_rows.append({"key": k, **vals})
    json.dump({"strings": rows, "script": script_rows}, open(os.path.join(ROOT, "i18n", page + ".json"), "w"), ensure_ascii=False, indent=1)
    print(f"{page:13} tokens={lens} strings={len(rows)} script={len(script_rows)}")
