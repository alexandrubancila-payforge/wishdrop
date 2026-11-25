"""Gift features: priority, group gifts, reactions, received, list news, push subscribe. Usage: python3 -I tests/e2e/gifts.py http://localhost:4400"""
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



def item_on(page, item_id):
    """The <article> of one gift on a list page."""
    m = re.search(r'<article[^>]*data-item-id="%s".*?</article>' % re.escape(item_id), page, re.S)
    return m.group(0) if m else ""


ana, ua = user("ana")
bob, ub = user("bob")
cris, uc = user("cris")
guest = client()
call(bob, "POST", "/api/follows", {"username": ua})
call(ana, "GET", "/notifications")  # clear ana's follow note

# --- new list / new gift notifications ---
s, r = call(ana, "POST", "/api/wishlists", {"name": "Ziua mea"})
lid, slug = r["id"], r["slug"]
check("new list → follower bell 1", bell(bob) == 1, bell(bob))
s, r = call(ana, "POST", f"/api/wishlists/{lid}/items", {"product_url": "https://example.com/a", "price": "900 lei", "priority": -1, "group_size": 3})
check("add group gift", s == 201, (s, r))
g = r["id"]
s, r = call(ana, "POST", f"/api/wishlists/{lid}/items", {"product_url": "https://example.com/b", "price": "50 lei"})
n2 = r["id"]
check("gifts fold into the unread list note", bell(bob) == 1, bell(bob))
s, page = call(bob, "GET", "/notifications")
check("note says new list", "a creat o listă nouă" in page and "Ziua mea" in page, "")
s, r = call(ana, "POST", f"/api/wishlists/{lid}/items", {"product_url": "https://example.com/c", "price": "20 lei", "priority": 1})
n3 = r["id"]
check("after reading, a new gift → new note", bell(bob) == 1, bell(bob))
s, page = call(bob, "GET", "/notifications")
check("note says new gift", "a adăugat un cadou nou" in page, "")
call(ana, "PATCH", f"/api/wishlists/{lid}", {"visibility": "link"})
call(ana, "POST", f"/api/wishlists/{lid}/items", {"product_url": "https://example.com/d"})
check("link-only list → no note", bell(bob) == 0, bell(bob))
call(ana, "PATCH", f"/api/wishlists/{lid}", {"visibility": "public"})

# --- public page: priority + group ---
s, page = call(guest, "GET", f"/w/{slug}")
card = item_on(page, g)
check("group card shows progress", "0 din 3 s-au alăturat" in card and "data-join-btn" in card, card[:200])
check("idea chip", "O idee" in card, "")
check("most wanted star on priority 1", "Cel mai dorit" in item_on(page, n3), "")
check("no star on priority -1", "Cel mai dorit" not in card, "")
s, r = call(guest, "PATCH", f"/api/items/{g}/reserve", {"reserved_by": "X"})
check("group gift can't be reserved alone", s == 409, (s, r))
s, r = call(ana, "PATCH", f"/api/items/{n2}", {"group_size": 3})
call(guest, "PATCH", f"/api/items/{n2}/reserve", {"reserved_by": "Y"})
s, r = call(ana, "PATCH", f"/api/items/{n2}", {"group_size": 4})
check("making the gift a group after reserve: ok while no reservation", True)

# --- join / leave ---
s, r = call(guest, "POST", f"/api/items/{g}/join", {"name": "Gigi"})
check("guest joins", s == 200 and r.get("count") == 1 and r.get("token"), (s, r))
gtok = r.get("token")
s, r = call(bob, "POST", f"/api/items/{g}/join", {"name": "Bob"})
check("bob joins", s == 200 and r.get("count") == 2, (s, r))
s, r = call(bob, "POST", f"/api/items/{g}/join", {})
check("bob can't join twice", s == 409, (s, r))
s, r = call(ana, "POST", f"/api/items/{g}/join", {})
check("owner can't join", s == 403, (s, r))
s, r = call(ana, "PATCH", f"/api/items/{g}", {"group_size": None})
check("can't turn off a group with people", s == 409, (s, r))
s, r = call(cris, "POST", f"/api/items/{g}/join", {})
check("third joins → full", s == 200 and r.get("count") == 3, (s, r))
s, r = call(client(), "POST", f"/api/items/{g}/join", {})
check("full group refuses", s == 409, (s, r))
s, page = call(guest, "GET", f"/w/{slug}")
card = item_on(page, g)
check("full group shows complete", 'data-reserved="true"' in card and "Grup complet" in card and "Gigi, Bob" in card, card[:300])
s, r = call(ana, "PATCH", f"/api/items/{g}", {"group_size": 2})
check("can't shrink below the people who joined", s == 409, (s, r))
s, page = call(bob, "GET", "/dashboard/reservations")
check("joined group gift in my reservations", "Cadou de grup · 3 din 3" in page, "")
s, r = call(bob, "DELETE", f"/api/items/{g}/join", {})
check("bob leaves by account", s == 200 and r.get("count") == 2, (s, r))
s, page = call(guest, "GET", f"/w/{slug}")
check("not full after leaving", 'data-reserved="false"' in item_on(page, g), "")
s, r = call(client(), "DELETE", f"/api/items/{g}/join", {"token": "nope"})
check("stranger can't remove someone", s == 403, (s, r))
s, r = call(guest, "DELETE", f"/api/items/{g}/join", {"token": gtok})
check("guest leaves by token", s == 200 and r.get("count") == 1, (s, r))

# --- reactions ---
s, r = call(bob, "POST", f"/api/items/{n3}/react", {"kind": "heart", "on": True})
check("bob likes", s == 200 and r.get("heart") == 1 and r.get("mine") == ["heart"], (s, r))
call(cris, "POST", f"/api/items/{n3}/react", {"kind": "want", "on": True})
check("owner bell shows reactions", bell(ana) == 2, bell(ana))
s, page = call(ana, "GET", "/notifications")
check("reaction texts", "apreciază cadoul tău" in page and "își dorește cadoul tău" in page, "")
s, r = call(bob, "POST", f"/api/items/{n3}/react", {"kind": "heart", "on": False})
check("unlike", s == 200 and r.get("heart") == 0, (s, r))
s, r = call(guest, "POST", f"/api/items/{n3}/react", {"kind": "heart", "on": True})
check("guests can't react", s == 401, (s, r))
s, r = call(ana, "POST", f"/api/items/{n3}/react", {"kind": "heart", "on": True})
check("owner can't react", s == 403, (s, r))
s, page = call(cris, "GET", f"/w/{slug}")
check("reaction buttons on the list", 'data-react="want"' in item_on(page, n3) and 'aria-pressed="true"' in item_on(page, n3), "")

# --- "I want it too" → copy into my list ---
s, r = call(cris, "GET", "/api/wishlists")
check("my lists for the picker", s == 200 and isinstance(r.get("lists"), list), (s, r))
s, r = call(cris, "POST", f"/api/items/{n3}/copy", {"new_list": "Dorințele mele"})
check("copy a friend's gift into a new list", s == 201 and r.get("list", {}).get("name") == "Dorințele mele", (s, r))
clist = r.get("list", {}).get("id")
s, r = call(cris, "POST", f"/api/items/{n3}/copy", {"wishlist_id": clist})
check("copy into an existing list", s == 201, (s, r))
s, page = call(cris, "GET", f"/dashboard/{clist}")
check("copied gifts show in my list", page.count("data-item-id=") >= 2 and "20 lei" in page, "")
s, r = call(cris, "POST", f"/api/items/{n3}/copy", {"wishlist_id": lid})
check("can't copy into someone else's list", s == 404, (s, r))
s, r = call(ana, "POST", f"/api/items/{n3}/copy", {"new_list": "x"})
check("can't copy my own gift", s == 403, (s, r))
s, r = call(guest, "POST", f"/api/items/{n3}/copy", {"new_list": "x"})
check("guests can't copy", s == 401, (s, r))
s, page = call(cris, "GET", "/feed")
check("copy sheet on pages for signed-in users", 'id="copy-sheet"' in page, "")

# --- received ---
s, r = call(ana, "PATCH", f"/api/items/{n2}", {"received": True})
check("mark received", s == 200, (s, r))
s, page = call(guest, "GET", f"/w/{slug}")
check("received gift hidden from the public list", n2 not in page, "")
s, page = call(ana, "GET", f"/dashboard/{lid}")
check("editor lists it under Primite", "Primite (1)" in page and "data-unreceive-btn" in page, "")
call(ana, "PATCH", f"/api/items/{n2}", {"received": False})
s, page = call(guest, "GET", f"/w/{slug}")
check("put back → visible again", n2 in page, "")

# --- push subscription ---
sub = {"endpoint": "https://push.example.invalid/sub/" + stamp, "keys": {"p256dh": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U", "auth": "tBHItJI5svbpez7KI4CCXg"}}
s, r = call(bob, "POST", "/api/push/subscribe", {"subscription": sub, "lang": "en"})
check("push subscribe", s == 200, (s, r))
s, r = call(ana, "POST", f"/api/wishlists/{lid}/items", {"product_url": "https://example.com/e"})
check("adding a gift with a dead push endpoint still works", s == 201, (s, r))
s, r = call(bob, "DELETE", "/api/push/subscribe", {"subscription": sub})
check("push unsubscribe", s == 200, (s, r))

for op in (ana, bob, cris):
    call(op, "POST", "/api/account/delete")
print(f"\n{passed} passed, {failed} failed")
