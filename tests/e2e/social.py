"""Profiles, following and list visibility. Usage: python3 -I tests/e2e/social.py http://localhost:4400"""
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
    req.add_header("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 wishdrop-e2e")
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


def user(tag):
    op = client()
    for _ in range(3):  # the sign-up limit (20/min per IP) can trip when suites run back to back
        s, r = call(op, "POST", "/api/auth/register", {"email": f"{tag}{stamp}@example.com", "password": secrets.token_hex(8)})
        if s != 429:
            break
        time.sleep(61)
    assert s == 200, (s, r)
    return op


ana, bob, cris, guest = user("ana"), user("bob"), user("cris"), client()
# A signed-in stranger: profiles need an account, so this is who "anyone" is.
dan = user("dan")
ua, ub, uc = f"ana.{stamp}", f"bob_{stamp}", f"cris{stamp}"

# --- usernames ---
s, r = call(ana, "GET", "/api/users/username?u=Ab")
check("username too short rejected", s == 200 and r.get("ok") is False, r)
s, r = call(ana, "GET", "/api/users/username?u=admin")
check("reserved username rejected", r.get("ok") is False, r)
s, r = call(ana, "GET", "/api/users/username?u=a..b")
check("double dot rejected", r.get("ok") is False, r)
s, r = call(ana, "PATCH", "/api/account/profile", {"username": "@Ana." + stamp, "name": "Ana Test", "is_private": False, "bio": "Îmi plac cărțile"})
check("ana sets username (normalized) and goes public", s == 200, (s, r))
s, r = call(bob, "GET", f"/api/users/username?u={ua}")
check("taken username reported", r.get("ok") is False, r)
s, r = call(bob, "PATCH", "/api/account/profile", {"username": ua})
check("taken username refused on save", s == 409, (s, r))
s, page = call(bob, "GET", "/settings")
check("new account starts public with a generated username", 'id="set-private" type="checkbox"' in page and "checked" not in page.split('id="set-private"')[1][:80] and re.search(r'id="set-username".*?value="([a-z0-9._]{3,24})"', page, re.S), "")
s, r = call(bob, "PATCH", "/api/account/profile", {"username": ub, "name": "Bob Test", "is_private": True})
check("bob sets username and goes private", s == 200, (s, r))
call(cris, "PATCH", "/api/account/profile", {"username": uc, "is_private": False})
s, r = call(ana, "PATCH", "/api/account/profile", {"bio": "x" * 161})
check("bio over 160 rejected", s == 400, (s, r))

# --- lists with each visibility ---
lists = {}
for vis in ("public", "followers", "link"):
    s, r = call(ana, "POST", "/api/wishlists", {"name": f"Lista {vis} {stamp}"})
    lists[vis] = r
    s, r2 = call(ana, "PATCH", f"/api/wishlists/{r['id']}", {"visibility": vis})
    check(f"ana list visibility {vis}", s == 200, (s, r2))
s, r = call(ana, "PATCH", f"/api/wishlists/{lists['link']['id']}", {"visibility": "everyone"})
check("invalid visibility rejected", s == 400, (s, r))
for vis in ("public", "followers"):
    s, r = call(bob, "POST", "/api/wishlists", {"name": f"Bob {vis} {stamp}"})
    call(bob, "PATCH", f"/api/wishlists/{r['id']}", {"visibility": vis})
    lists["bob_" + vis] = r


def shows(page, vis):
    return f"Lista {vis} {stamp}" in page


s, page = call(guest, "GET", f"/@{ua}")
check("guest is sent to login from a profile", s == 302, s)
s, page = call(guest, "GET", f"/@{ua}/followers")
check("guest is sent to login from a followers page", s == 302, s)
s, page = call(dan, "GET", f"/@{ua}")
check("stranger sees ana's public profile", s == 200 and "Ana Test" in page and "Îmi plac cărțile" in page, s)
check("stranger sees public list only", shows(page, "public") and not shows(page, "followers") and not shows(page, "link"), "")
s, page = call(dan, "GET", f"/de/@{ua}")
check("profile works with language prefix", s == 200, s)
s, page = call(dan, "GET", f"/@{ua}/followers")
check("public profile followers page open", s == 200, s)
s, _ = call(guest, "GET", f"/w/{lists['link']['slug']}")
check("link-only list still opens by link", s == 200, s)
s, _ = call(guest, "GET", f"/w/{lists['followers']['slug']}")
check("followers-only list still opens by link", s == 200, s)
s, _ = call(dan, "GET", "/@nobody-here-" + stamp)
check("unknown profile -> 404", s == 404, s)

# --- search ---
s, page = call(guest, "GET", f"/search?q=ana.{stamp[:3]}")
check("search by username prefix", ua in page, "")
s, page = call(guest, "GET", "/search?q=Bob%20Test")
check("search by name", ub in page, "")
s, page = call(guest, "GET", "/search?q=a")
check("1-char search returns nothing", ua not in page, "")

# --- follow a public profile ---
s, r = call(bob, "POST", "/api/follows", {"username": ua})
check("bob follows public ana -> following", s == 200 and r.get("relation") == "following", (s, r))
s, page = call(bob, "GET", f"/@{ua}")
check("follower sees public + followers lists, not link", shows(page, "public") and shows(page, "followers") and not shows(page, "link"), "")
s, r = call(bob, "POST", "/api/follows", {"username": ub})
check("can't follow yourself", s == 400, (s, r))

# --- follow a private profile ---
s, r = call(ana, "POST", "/api/follows", {"username": ub})
check("ana follows private bob -> requested", r.get("relation") == "requested", (s, r))
s, page = call(ana, "GET", f"/@{ub}")
check("private profile locked while requested", f"Bob public {stamp}" not in page and s == 200, s)
s, _ = call(ana, "GET", f"/@{ub}/followers")
check("private followers page redirects", s == 302, s)
s, page = call(bob, "GET", "/requests")
check("bob sees ana's request", ua in page, s)
s, page = call(bob, "GET", "/dashboard")
check("request badge in menu", "Cereri de urmărire" in page, "")
s, r = call(bob, "POST", "/api/follows/requests", {"user_id": "nope", "action": "accept"})
check("accept unknown request -> 404", s == 404, (s, r))
uid_ana = re.search(r'data-request="([^"]+)"', call(bob, "GET", "/requests")[1]).group(1)
s, r = call(bob, "POST", "/api/follows/requests", {"user_id": uid_ana, "action": "accept"})
check("bob accepts ana", s == 200, (s, r))
s, page = call(ana, "GET", f"/@{ub}")
check("accepted follower sees bob's lists", f"Bob public {stamp}" in page and f"Bob followers {stamp}" in page, "")
s, page = call(guest, "GET", f"/@{ub}")
check("guest still locked out of private bob", f"Bob public {stamp}" not in page, "")

# --- decline + remove follower + going public ---
s, r = call(cris, "POST", "/api/follows", {"username": ub})
uid_cris = re.search(r'data-request="([^"]+)"', call(bob, "GET", "/requests")[1]).group(1)
s, r = call(bob, "POST", "/api/follows/requests", {"user_id": uid_cris, "action": "decline"})
check("bob declines cris", s == 200, (s, r))
s, page = call(cris, "GET", f"/@{ub}")
check("declined user stays locked out", f"Bob public {stamp}" not in page, "")
s, r = call(bob, "DELETE", "/api/follows/followers", {"user_id": uid_ana})
check("bob removes follower ana", s == 200, (s, r))
s, page = call(ana, "GET", f"/@{ub}")
check("removed follower locked out again", f"Bob followers {stamp}" not in page, "")
call(cris, "POST", "/api/follows", {"username": ub})
s, r = call(bob, "PATCH", "/api/account/profile", {"is_private": False})
check("bob goes public", s == 200, (s, r))
s, page = call(cris, "GET", f"/@{ub}")
check("pending request auto-accepted when going public", f"Bob followers {stamp}" in page, "")

# --- unfollow ---
s, r = call(bob, "DELETE", "/api/follows", {"username": ua})
check("bob unfollows ana", r.get("relation") == "none", (s, r))
s, page = call(bob, "GET", f"/@{ua}")
check("after unfollow only public list", shows(page, "public") and not shows(page, "followers"), "")

# --- owner views ---
s, page = call(ana, "GET", f"/@{ua}")
check("owner profile shows public + followers lists", shows(page, "public") and shows(page, "followers"), "")
s, page = call(ana, "GET", f"/dashboard/{lists['public']['id']}")
check("editor has visibility picker", 'name="visibility"' in page, s)
s, page = call(ana, "GET", "/settings")
check("settings has username field", 'id="set-username"' in page and ua in page, s)

# --- cleanup ---
for op in (ana, bob, cris):
    s, r = call(op, "POST", "/api/account/delete")
    check("delete account", s == 200, (s, r))
s, _ = call(dan, "GET", f"/@{ua}")
check("deleted user's profile gone", s == 404, s)
call(dan, "POST", "/api/account/delete")

print(f"\n{passed} passed, {failed} failed")
