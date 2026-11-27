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


def ro(path):
    """The checks read Romanian texts: pages go to /ro/…, "/en/…" means the English (unprefixed) page."""
    if path.startswith("/en/") or path == "/en":
        return path[3:] or "/"
    if path.startswith("/api/") or re.match(r"^/(ro|de|ru)(/|\?|$)", path) or (not path.startswith("/@") and re.search(r"\.[a-z]+$", path.split("?")[0])):
        return path
    return "/ro" + (path if path != "/" else "")


def call(op, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(B + ro(path), data=data, method=method)
    req.add_header("origin", B)
    req.add_header("referer", B + "/ro/")
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
    for _ in range(3):  # the sign-up limit (20/min per IP) can trip when suites run back to back
        s, r = call(op, "POST", "/api/auth/register", {"email": f"{tag}{stamp}@example.com", "password": secrets.token_hex(8)})
        if s != 429:
            break
        time.sleep(61)
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
check("sitemap lists the guides", s == 200 and "wishdrop.site/ideas/wedding-registry-online<" in xml and "wishdrop.site/ro/idei/lista-de-nunta-online<" in xml and xml.count("<url>") >= 40, s)
check("sitemap x-default is English", 'hreflang="x-default" href="https://wishdrop.site/ideas/wedding-registry-online"' in xml, "")

# --- English at the root, other languages by prefix ---
def raw(path, headers):
    req = urllib.request.Request(B + path, headers={"user-agent": "Mozilla/5.0 Chrome/131 wishdrop-e2e", **headers})
    try:
        r = urllib.request.build_opener(NoRedirect).open(req, timeout=30)
        return r.status, r.headers.get("location"), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("location"), e.read().decode("utf-8", "replace")

s, loc, page = raw("/", {})
check("root is English for search engines", s == 200 and '<html lang="en"' in page and 'rel="canonical" href="https://wishdrop.site/"' in page, s)
s, loc, _ = raw("/", {"accept-language": "ro-RO,ro;q=0.9,en;q=0.8"})
check("Romanian browser goes to /ro", s == 302 and loc.endswith("/ro"), (s, loc))
s, loc, _ = raw("/popular", {"accept-language": "fr-FR,fr;q=0.9"})
check("unsupported browser language stays English", s == 200, (s, loc))
s, loc, _ = raw("/", {"accept-language": "ro", "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"})
check("crawler never redirected by language", s == 200, (s, loc))
s, loc, _ = raw("/", {"accept-language": "ro", "cookie": "wd_lang=en"})
check("switcher choice beats the browser", s == 200, (s, loc))
s, loc, _ = raw("/ideas/?x=1", {})
check("trailing slash → 301 to the bare address", s == 301 and loc.endswith("/ideas?x=1") and not loc.endswith("/?x=1"), (s, loc))
s, loc, _ = raw("/ro/", {})
check("/ro/ → /ro", s == 301 and loc.endswith("/ro"), (s, loc))
s, loc, _ = raw("/api/health", {})
check("API untouched by the slash rule", s == 200, (s, loc))
s, loc, page = raw("/", {})
check("home has WebSite + Organization structured data", '"@type":"WebSite"' in page and '"@type":"Organization"' in page and '"@type":"WebApplication"' in page, "")
s, loc, page = raw("/ideas/christmas-gift-ideas", {})
check("guides are og:type article", 'property="og:type" content="article"' in page, "")
s, loc, page = raw("/ideas", {})
check("guides hub stays og:type website", 'property="og:type" content="website"' in page, "")
s, loc, page = raw("/nothing-here", {})
check("404 has no canonical or hreflang", s == 404 and 'rel="canonical"' not in page and "hreflang" not in page, s)
s, loc, _ = raw("/en/ideas?x=1", {})
check("old /en link → 301 to the root", s == 301 and loc.endswith("/ideas?x=1"), (s, loc))

# --- feed: older posts load while scrolling ---
fa, ufa = user("feeda"); fb, ufb = user("feedb")
call(fa, "POST", "/api/follows", {"username": ufb})
feed_lists = []
for k in range(2):
    s, r = call(fb, "POST", "/api/wishlists", {"name": f"Feed {k} {stamp}"})
    call(fb, "PATCH", f"/api/wishlists/{r['id']}", {"visibility": "public"})
    feed_lists.append(r["id"])
for n in range(40):  # alternating lists: every gift is its own post
    call(fb, "POST", f"/api/wishlists/{feed_lists[n % 2]}/items", {"product_url": f"https://example.com/feed{n}", "price": f"{n}0 feedlei"})
s, page = call(fa, "GET", "/feed")
first = re.findall(r">(\d+)0 feedlei<", page)
nxt = re.search(r'data-next="([^"]*)"', page)
call(fb, "POST", f"/api/wishlists/{feed_lists[0]}/items", {"product_url": "https://sexshops.md/produs/x", "title": "Ceva pentru adulti"})
s, fpage = call(fa, "GET", "/feed")
check("18+ gift is blurred for others", "adult-gift" in fpage and "data-adult-reveal" in fpage, s)
s, ppage = call(fa, "GET", "/popular")
check("18+ gift never on Popular", "Ceva pentru adulti" not in ppage, s)
s, spage = call(fa, "GET", "/search")
check("find friends shows invite and suggestions", s == 200 and 'id="invite-btn"' in spage and 'id="search-idle"' in spage, s)
check("friend with new gifts gets a bubble", 'data-story="new:' in page and re.search(r'class="story-name"[^>]*>Feedb<', page), "")
check("feed shows the first page", s == 200 and len(first) == 29 and "39" in first, (s, len(first)))
check("feed has a next page", bool(nxt and nxt.group(1)), "")
s, more = call(fa, "GET", nxt.group(1).replace("&amp;", "&") if nxt else "/feed/more")
rest = re.findall(r">(\d+)0 feedlei<", more)
check("next page has the older posts, no repeats", s == 200 and sorted(map(int, first + rest)) == list(range(40)), (s, len(rest)))
check("last page says there is no more", re.search(r'data-feed-next(=""|[ >])', more) and "<html" not in more, "")
s, _ = call(fa, "GET", "/feed/more?at=x")
check("bad cursor refused", s == 400, s)

s, page = call(fa, "GET", "/ro")
check("signed-in /ro home stays Romanian", s == 200 and '<html lang="ro"' in page, s)
s, page = call(fa, "GET", "/de")
check("signed-in /de home stays German", s == 200 and '<html lang="de"' in page, s)

# --- popular gifts ---
import os, uuid
photo = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "demo", "books.jpg"), "rb").read()


def upload(op):
    boundary = uuid.uuid4().hex
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="p.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode() + photo + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(B + "/api/upload", data=body, method="POST")
    req.add_header("content-type", f"multipart/form-data; boundary={boundary}")
    req.add_header("origin", B)
    req.add_header("referer", B + "/ro/")
    req.add_header("user-agent", "Mozilla/5.0 Chrome/131 wishdrop-e2e")
    return json.loads(op.open(req, timeout=30).read())["image_key"]


product = f"https://example.com/carte-{stamp}?ref=abc"
s, r = call(ana, "POST", "/api/wishlists", {"name": "Lista publică"})
plist = r["id"]
s, r = call(ana, "POST", f"/api/wishlists/{plist}/items", {"image_key": upload(ana), "product_url": product, "price": "77 lei"})
pitem = r["id"]
s, page = call(client(), "GET", "/popular")
check("popular page shows a public gift", s == 200 and pitem in page and "77 lei" in page, s)
check("popular page doesn't name the owner", ua not in page and "Ana Test" not in page, "")
s, r = call(bob, "POST", f"/api/items/{pitem}/react", {"kind": "want", "on": True})
s, r = call(bob, "POST", f"/api/items/{pitem}/copy", {"new_list": "Și eu"})
check("copy from popular", s == 201, (s, r))
s, page = call(client(), "GET", "/popular")
pop = page.split("Adăugate recent")[0]
check("liked + copied gift is in Most popular", "Cele mai populare" in page and pitem in pop, "")
check("same product grouped (2 lists)", "în 2 liste" in pop, "")
call(ana, "PATCH", "/api/account/profile", {"show_in_popular": False})
s, page = call(client(), "GET", "/popular")
check("opt-out hides my gifts", pitem not in page, "")
call(ana, "PATCH", "/api/account/profile", {"show_in_popular": True})
call(ana, "PATCH", f"/api/wishlists/{plist}", {"visibility": "link"})
s, page = call(client(), "GET", "/popular")
check("link-only lists never show", pitem not in page, "")

for op in (ana, bob):
    call(op, "POST", "/api/account/delete")
print(f"\n{passed} passed, {failed} failed")
