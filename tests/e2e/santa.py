"""Secret Santa: groups, invites, picking a list, the draw. Usage: python3 -I tests/e2e/santa.py http://localhost:4400"""
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




org, uo = user("org")
ana, ua = user("ana")
bob, ub = user("bob")
cris, uc = user("cris")
dan, ud = user("dan")
names = {"org": "Org Test", "ana": "Ana Test", "bob": "Bob Test", "cris": "Cris Test"}

s, r = call(org, "POST", "/api/santa", {"name": "Colegii", "budget": "100 lei", "exchange_date": "2026-12-20"})
check("create group", s == 201 and r.get("id") and r.get("code"), (s, r))
gid, code = r["id"], r["code"]
s, _ = call(ana, "GET", f"/santa/{gid}")
check("non-member can't open the group", s == 404, s)
s, page = call(client(), "GET", f"/santa/join/{code}")
check("invite page is public", s == 200 and "Colegii" in page and "/register?next=" in page, s)
s, r = call(ana, "POST", "/api/santa/join", {"code": code})
check("join with the code", s == 200 and r.get("id") == gid, (s, r))
s, r = call(org, "POST", f"/api/santa/{gid}/draw")
check("can't draw with 2 people", s == 400, (s, r))
for op in (bob, cris):
    call(op, "POST", "/api/santa/join", {"code": code})
s, r = call(ana, "POST", "/api/wishlists", {"name": "Lista Anei"})
alist = r["id"]
s, r = call(ana, "PATCH", f"/api/santa/{gid}", {"wishlist_id": alist})
check("pick the list my Santa sees", s == 200, (s, r))
s, r = call(bob, "PATCH", f"/api/santa/{gid}", {"wishlist_id": alist})
check("can't pick someone else's list", s == 404, (s, r))
s, r = call(ana, "DELETE", f"/api/santa/{gid}", {"user_id": "x"})
check("members can't remove others", s == 403, (s, r))
s, r = call(ana, "POST", f"/api/santa/{gid}/draw")
check("only the organizer draws", s == 404, (s, r))
s, page = call(org, "GET", f"/santa/{gid}")
check("group page lists 4 people", "Participanți (4)" in page and 'id="santa-draw"' in page, "")

s, r = call(org, "POST", f"/api/santa/{gid}/draw")
check("draw names", s == 200 and r.get("members") == 4, (s, r))
giftees = {}
for tag, op in (("org", org), ("ana", ana), ("bob", bob), ("cris", cris)):
    s, page = call(op, "GET", f"/santa/{gid}")
    m = re.search(r'text-3xl font-extrabold tracking-tight"[^>]*>([^<]+)</p>', page)
    giftees[tag] = m.group(1) if m else None
    if giftees[tag] == "Ana Test":
        check("the one who drew Ana sees her list", "Lista Anei" in page, tag)
check("everyone got someone", all(giftees.values()), giftees)
check("nobody drew themselves", all(giftees[t] != names[t] for t in giftees), giftees)
check("everyone drawn exactly once", len(set(giftees.values())) == 4, giftees)
s, page = call(org, "GET", f"/santa/{gid}")
check("organizer sees only their own pair", page.count("Tu faci cadou pentru") == 1 and "giftee_id" not in page, "")
s, r = call(org, "POST", f"/api/santa/{gid}/draw")
check("can't draw twice", s == 409, (s, r))
s, r = call(dan, "POST", "/api/santa/join", {"code": code})
check("can't join after the draw", s == 409, (s, r))
s, r = call(bob, "DELETE", f"/api/santa/{gid}", {})
check("can't leave after the draw", s == 409, (s, r))
s, page = call(cris, "GET", "/notifications")
check("draw notification", "a tras la sorți" in page and "Colegii" in page, "")
s, page = call(cris, "GET", "/santa")
check("my groups list", "Colegii" in page and "Tras la sorți" in page, "")

s, r = call(org, "DELETE", f"/api/santa/{gid}", {})
check("organizer deletes the group", s == 200 and r.get("deleted"), (s, r))
s, _ = call(ana, "GET", f"/santa/{gid}")
check("deleted group is gone", s == 404, s)

for op in (org, ana, bob, cris, dan):
    call(op, "POST", "/api/account/delete")
print(f"\n{passed} passed, {failed} failed")
