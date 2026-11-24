"""Event dates, gift guides and the sitemap. Usage: python3 -I tests/e2e/growth.py http://localhost:4400"""
import http.cookiejar, json, re, secrets, sys, time, urllib.request, urllib.error

B = sys.argv[1]
passed = failed = 0
stamp = str(int(time.time()))[-6:]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()), NoRedirect)


def call(op, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(B + path, data=data, method=method)
    req.add_header("origin", B)
    req.add_header("user-agent", "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 wishdrop-e2e")
    if data is not None:
        req.add_header("content-type", "application/json")
    try:
        r = op.open(req, timeout=30)
        status, text = r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status, text = e.code, e.read().decode("utf-8", "replace")
    try:
        return status, json.loads(text)
    except Exception:
        return status, text


def check(label, cond, detail=""):
    global passed, failed
    cond = bool(cond)
    passed += cond
    failed += not cond
    print(("  ok  " if cond else "  FAIL") + f" {label}" + ("" if cond else f"  -> {detail}"))


def user(tag, private=False):
    op = client()
    s, r = call(op, "POST", "/api/auth/register", {"email": f"{tag}{stamp}@example.com", "password": secrets.token_hex(8)})
    assert s == 200, (s, r)
    u = f"{tag}{stamp}"
    call(op, "PATCH", "/api/account/profile", {"username": u, "name": f"{tag.title()} Test", "is_private": private})
    return op, u


def bell(op):
    s, page = call(op, "GET", "/dashboard")
    m = re.search(r'aria-label="Notificări \((\d+)\)"', page)
    return int(m.group(1)) if m else 0

import datetime

ana, ua = user("ana")
bob, ub = user("bob")
call(bob, "POST", "/api/follows", {"username": ua})

# --- event date ---
in9 = (datetime.datetime.now(datetime.timezone.utc).date() + datetime.timedelta(days=9)).isoformat()
s, r = call(ana, "POST", "/api/wishlists", {"name": "Petrecerea mea"})
lid, slug = r["id"], r["slug"]
s, r = call(ana, "PATCH", f"/api/wishlists/{lid}", {"event_date": in9})
check("set event date", s == 200, (s, r))
s, r = call(ana, "PATCH", f"/api/wishlists/{lid}", {"event_date": "2026-13-45"})
check("bad date refused", s == 400, (s, r))
s, page = call(client(), "GET", f"/w/{slug}")
check("countdown on the list", "peste 9 zile" in page, "")
s, page = call(bob, "GET", "/feed")
check("event in friends' feed", "Petrecerea mea" in page and "Ce urmează" in page, "")
s, page = call(ana, "GET", f"/dashboard/{lid}")
check("editor has date + share", f'value="{in9}"' in page and 'id="open-share"' in page, "")
call(ana, "PATCH", f"/api/wishlists/{lid}", {"event_date": ""})
s, page = call(client(), "GET", f"/w/{slug}")
check("date removed", "peste 9 zile" not in page, "")

# --- reminders switch ---
s, r = call(ana, "PATCH", "/api/account/profile", {"reminder_emails": False})
check("turn reminders off", s == 200, (s, r))
s, page = call(ana, "GET", "/settings/account")
check("switch shows off", 'id="reminders-toggle"' in page and 'id="reminders-toggle" class="peer sr-only" checked' not in page, "")
s, r = call(client(), "GET", "/api/reminders/off?u=x&s=bad")
check("unsigned unsubscribe refused", s == 400, s)

# --- guides + sitemap ---
for path, code in [("/idei", 200), ("/idei/lista-de-nunta-online", 200), ("/en/ideas/christmas-gift-ideas", 200),
                   ("/de/ideen/wunschliste-geburtstag", 200), ("/ru/idei/spisok-podarkov-dlya-malysha", 200), ("/idei/nu-exista", 404)]:
    s, page = call(client(), "GET", path)
    check(f"guide {path} → {code}", s == code, s)
s, page = call(client(), "GET", "/en/idei/lista-de-nunta-online")
check("other-language slug redirects", s == 301, s)
s, page = call(client(), "GET", "/idei/lista-de-nunta-online")
check("guide has FAQ structured data and hreflang", "FAQPage" in page and 'hreflang="de" href="https://wishdrop.site/de/ideen/hochzeitsliste-online"' in page, "")
s, xml = call(client(), "GET", "/sitemap.xml")
check("sitemap lists the guides", s == 200 and "/en/ideas/wedding-registry-online" in xml and xml.count("<url>") >= 40, s)

for op in (ana, bob):
    call(op, "POST", "/api/account/delete")
print(f"\n{passed} passed, {failed} failed")
