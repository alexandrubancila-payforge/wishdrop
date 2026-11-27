"""Core flows: sign-up, lists, gifts, photos, reservations. Usage: python3 -I tests/e2e/core.py http://localhost:4400 public/demo/watch.jpg"""
import http.cookiejar, json, secrets, sys, time, urllib.request, urllib.error, uuid, re

B, PHOTO = sys.argv[1], sys.argv[2]
ok_count = fail_count = 0


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def client():
    jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NoRedirect)


def ro(path):
    """The checks read Romanian texts: pages go to /ro/…, "/en/…" means the English (unprefixed) page."""
    if path.startswith("/en/") or path == "/en":
        return path[3:] or "/"
    if path.startswith("/api/") or re.match(r"^/(ro|de|ru)(/|\?|$)", path) or (not path.startswith("/@") and re.search(r"\.[a-z]+$", path.split("?")[0])):
        return path
    return "/ro" + (path if path != "/" else "")


def call(op, method, path, body=None, referer=None, raw=None, ctype="application/json"):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(B + ro(path), data=data, method=method)
    req.add_header("origin", B)
    req.add_header("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 wishdrop-e2e")
    if data is not None:
        req.add_header("content-type", ctype)
    req.add_header("referer", B + (referer or "/ro/"))
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
    global ok_count, fail_count
    cond = bool(cond)
    ok_count += cond
    fail_count += not cond
    print(("  ok  " if cond else "  FAIL") + f" {label}" + (f"  -> {detail}" if not cond else ""))


owner, guest, other = client(), client(), client()
email, pw = f"test{int(time.time())}@example.com", secrets.token_hex(8)

s, r = call(owner, "POST", "/api/auth/register", {"email": email, "password": pw})
check("register", s == 200, r)
s, _ = call(owner, "GET", "/dashboard")
check("dashboard after register", s == 200, s)
s, r = call(owner, "POST", "/api/auth/register", {"email": email, "password": pw})
check("register same email -> 409", s == 409, (s, r))
s, r = call(owner, "POST", "/api/auth/register", {"email": "bad", "password": pw})
check("register bad email -> 400", s == 400, (s, r))
call(owner, "POST", "/api/auth/logout")
s, _ = call(owner, "GET", "/dashboard")
check("dashboard after logout redirects", s == 302, s)
s, r = call(owner, "POST", "/api/auth/login", {"email": email, "password": "wrongpass"}, referer="/en/login")
check("wrong password -> English error", s == 401 and r.get("error") == "Wrong email or password.", (s, r))
s, r = call(owner, "POST", "/api/auth/login", {"email": email.upper(), "password": pw})
check("login (email case-insensitive)", s == 200, (s, r))

s, r = call(owner, "POST", "/api/wishlists", {"name": "Zi de naștere 🎂"})
check("create list", s == 201 and r.get("slug", "").startswith("zi-de-nastere-"), (s, r))
lid, slug = r["id"], r["slug"]
s, r = call(owner, "POST", "/api/wishlists", {"name": "x" * 61})
check("list name > 60 rejected", s == 400, (s, r))

boundary = uuid.uuid4().hex
photo = open(PHOTO, "rb").read()
body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"w.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n").encode() + photo + f"\r\n--{boundary}--\r\n".encode()
s, r = call(owner, "POST", "/api/upload", raw=body, ctype=f"multipart/form-data; boundary={boundary}")
check("upload photo", s == 200 and r.get("image_key", "").startswith("items/"), (s, r))
key = r["image_key"]
s, _ = call(guest, "GET", "/api/images/" + key)
check("photo served", s == 200, s)
s, r = call(guest, "POST", "/api/upload", raw=body, ctype=f"multipart/form-data; boundary={boundary}")
check("upload needs login", s == 401, s)

s, r = call(owner, "POST", f"/api/wishlists/{lid}/items", {"image_key": key, "price": "350 lei", "product_url": "https://example.com/ceas"})
check("add gift", s == 201, (s, r))
iid = r["id"]
s, r = call(owner, "POST", f"/api/wishlists/{lid}/items", {"price": "1"})
check("gift without photo or link rejected", s == 400, (s, r))
s, r = call(owner, "POST", f"/api/wishlists/{lid}/items", {"product_url": "javascript:alert(1)"})
check("bad link rejected", s == 400, (s, r))
s, r = call(owner, "PATCH", f"/api/items/{iid}", {"priority": True})
check("mark most wanted", s == 200, (s, r))
s, r = call(owner, "PATCH", f"/api/items/{iid}", {"price": "400 lei"})
check("edit price", s == 200, (s, r))
s, r = call(owner, "PATCH", f"/api/wishlists/{lid}", {"name": "Ziua mea"})
check("rename list", s == 200, (s, r))

for path in ["/dashboard", f"/dashboard/{lid}", "/dashboard/reservations", "/settings", "/settings/password", "/settings/account",
             "/ro/dashboard", f"/de/dashboard/{lid}", "/ru/settings"]:
    s, page = call(owner, "GET", path)
    check(f"page {path}", s == 200 and "Ziua mea" in page if path.endswith(lid) else s == 200, s)
s, page = call(owner, "GET", "/dashboard")
check("dashboard lists the new list", "Ziua mea" in page, "")

s, r = call(other, "GET", f"/dashboard/{lid}")
check("editor of someone else's list blocked", s in (302, 404), s)
other_email = f"other{int(time.time())}@example.com"
call(other, "POST", "/api/auth/register", {"email": other_email, "password": pw})
s, r = call(other, "PATCH", f"/api/items/{iid}", {"price": "0"})
check("other user can't edit gift", s == 404, (s, r))
s, r = call(other, "DELETE", f"/api/wishlists/{lid}")
check("other user can't delete list", s == 404, (s, r))
s, page = call(other, "GET", f"/dashboard/{lid}")
check("other user's editor view blocked", s in (302, 404), s)

s, page = call(guest, "GET", f"/w/{slug}")
check("public list", s == 200 and "Ziua mea" in page and "400 lei" in page, s)
s, r = call(owner, "PATCH", f"/api/items/{iid}/reserve", {"reserved_by": "Eu"})
check("owner can't reserve own gift", s == 403, (s, r))
s, r = call(guest, "PATCH", f"/api/items/{iid}/reserve", {"reserved_by": "Ana"})
check("guest can't reserve (needs an account)", s == 401, (s, r))
s, r = call(guest, "POST", f"/api/items/{iid}/join", {"name": "Ana"})
check("guest can't join a group gift either", s in (401, 409), (s, r))
s, page = call(guest, "GET", f"/w/{slug}")
check("guest gets the sign-in prompt", "Intră în cont ca să rezervi" in page, "")
third = client()
call(third, "POST", "/api/auth/register", {"email": f"third{int(time.time())}@example.com", "password": pw})
s, r = call(other, "PATCH", f"/api/items/{iid}/reserve", {"reserved_by": "Ana"})
check("signed-in user reserves", s == 200, (s, r))
s, r = call(third, "PATCH", f"/api/items/{iid}/reserve", {"reserved_by": "Ion"})
check("second reservation -> 409", s == 409, (s, r))
s, page = call(guest, "GET", f"/w/{slug}")
check("public list shows reserver name", "Ana" in page, "")
s, r = call(third, "DELETE", f"/api/items/{iid}/reserve", {"token": "nope"})
check("someone else can't cancel -> 403", s == 403, (s, r))
s, r = call(other, "DELETE", f"/api/items/{iid}/reserve", {})
check("reserver cancels by account", s == 200, (s, r))

s, r = call(other, "PATCH", f"/api/items/{iid}/reserve", {"reserved_by": None})
check("logged-in user reserves anonymously", s == 200, (s, r))
s, page = call(other, "GET", "/dashboard/reservations")
check("reservation shows in My reservations", "Ziua mea" in page, s)
s, r = call(other, "DELETE", f"/api/items/{iid}/reserve", {})
check("logged-in reserver cancels without token", s == 200, (s, r))

s, r = call(owner, "PATCH", f"/api/wishlists/{lid}", {"hide_reservations": True})
check("surprise mode on", s == 200, (s, r))
s, page = call(owner, "GET", f"/w/{slug}")
check("owner view has surprise on", 'data-surprise="on"' in page, "")

s, r = call(owner, "PATCH", "/api/account/profile", {"name": "Test User", "birthday": "1995-03-08"})
check("profile save", s == 200, (s, r))
s, page = call(owner, "GET", "/settings")
check("settings shows name", "Test User" in page, "")
s, r = call(owner, "POST", "/api/account/seasons", {"disable": True})
check("seasons toggle", s == 200, (s, r))
new_pw = secrets.token_hex(8)
s, r = call(owner, "POST", "/api/account/password", {"current": "nope", "new": new_pw})
check("password change needs current", s == 401, (s, r))
s, r = call(owner, "POST", "/api/account/password", {"current": pw, "new": new_pw})
check("password change", s == 200, (s, r))
call(owner, "POST", "/api/auth/logout")
s, r = call(owner, "POST", "/api/auth/login", {"email": email, "password": new_pw})
check("login with new password", s == 200, (s, r))

s, r = call(guest, "POST", "/api/auth/forgot-password", {"email": email})
check("forgot password", s == 200, (s, r))
s, r = call(guest, "POST", "/api/auth/reset-password", {"token": "bad", "password": new_pw})
check("reset with bad token rejected", s == 400, (s, r))
s, r = call(guest, "POST", "/api/contact", {"name": "Test", "email": "t@example.com", "message": "Salut, acesta e un test.", "company": ""})
check("contact form", s == 200, (s, r))

s, r = call(owner, "DELETE", f"/api/items/{iid}")
check("delete gift", s == 200, (s, r))
s, _ = call(guest, "GET", "/api/images/" + key)
check("photo removed with gift", s == 404, s)
s, r = call(owner, "DELETE", f"/api/wishlists/{lid}")
check("delete list", s == 200, (s, r))
s, _ = call(guest, "GET", f"/w/{slug}")
check("deleted list -> 404", s == 404, s)
for op in (owner, other):
    s, r = call(op, "POST", "/api/account/delete")
    check("delete account", s == 200, (s, r))
s, _ = call(owner, "GET", "/dashboard")
check("logged out after delete", s == 302, s)

print(f"\n{ok_count} passed, {fail_count} failed")
