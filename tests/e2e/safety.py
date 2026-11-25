"""Safety: health, headers, reports, blocking, data export, login limits, moderation (local). Usage: python3 -I tests/e2e/safety.py http://localhost:4400"""
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

import os, subprocess, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCAL = "localhost" in B or "127.0.0.1" in B


def multipart(op, path, fields, file=None):
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    if file:
        name, data, ctype = file
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: {ctype}\r\n\r\n'.encode() + data + b"\r\n")
    body = b"".join(parts) + f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(B + path, data=body, method="POST")
    req.add_header("content-type", f"multipart/form-data; boundary={boundary}")
    req.add_header("origin", B)
    req.add_header("user-agent", "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 wishdrop-e2e")
    try:
        r = op.open(req, timeout=30)
        return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def sql(q):
    subprocess.run(["npx", "wrangler", "d1", "execute", "wishdrop-db", "--local", "--command", q], cwd=ROOT, capture_output=True, stdin=subprocess.DEVNULL, env={**os.environ, "CI": "true"})


ana, ua = user("ana")
bob, ub = user("bob")
guest = client()

# --- health + headers ---
s, r = call(guest, "GET", "/api/health")
check("health check", s == 200 and r.get("ok") is True, (s, r))
req = urllib.request.Request(B + "/", headers={"user-agent": "Mozilla/5.0 Chrome/131"})
h = urllib.request.urlopen(req, timeout=30).headers
check("security headers", h.get("x-frame-options") == "DENY" and "frame-ancestors" in (h.get("content-security-policy") or "") and h.get("x-content-type-options") == "nosniff", dict(h))

# --- report a problem ---
photo = open(os.path.join(ROOT, "public/demo/watch.jpg"), "rb").read()
s, r = multipart(guest, "/api/report", {"kind": "bug", "message": "Butonul nu merge", "email": "guest@example.com", "page_url": "/feed"}, ("shot.jpg", photo, "image/jpeg"))
check("guest reports a problem with screenshot", s == 200, (s, r))
s, r = multipart(guest, "/api/report", {"kind": "bug", "message": "x"})
check("too-short problem refused", s == 400, (s, r))
s, r = multipart(guest, "/api/report", {"kind": "bug", "message": "spam bot", "company": "ACME"})
check("honeypot answers ok", s == 200, (s, r))
s, page = call(ana, "GET", f"/report?type=bug&from=/feed")
check("report page renders", s == 200 and "Raportează o problemă" in page, s)
s, page = call(ana, "GET", "/feed")
check("footer/menu link to report", "/report?type=bug" in page, "")

# --- report a profile / list ---
s, me = call(bob, "GET", f"/@{ub}")
bob_id = re.search(r'type=user&amp;id=([0-9a-f-]+)|type=user&id=([0-9a-f-]+)', call(ana, "GET", f"/@{ub}")[1])
bob_id = bob_id and (bob_id.group(1) or bob_id.group(2))
check("profile has report link", bool(bob_id), "")
s, r = multipart(ana, "/api/report", {"kind": "user", "target_id": bob_id, "reason": "spam", "message": "reclame"})
check("report a profile", s == 200, (s, r))
s, r = multipart(ana, "/api/report", {"kind": "user", "target_id": bob_id, "reason": "nonsense"})
check("unknown reason refused", s == 400, (s, r))
s, r = call(bob, "POST", "/api/wishlists", {"name": "Lista lui Bob"})
blist, bslug = r["id"], r["slug"]
s, page = call(ana, "GET", f"/w/{bslug}")
check("list has report link", f"type=list&amp;id={blist}" in page or f"type=list&id={blist}" in page, "")
s, r = multipart(ana, "/api/report", {"kind": "list", "target_id": blist, "reason": "inappropriate"})
check("report a list", s == 200, (s, r))

# --- admin is private ---
s, _ = call(ana, "GET", "/admin")
check("admin is 404 for others", s == 404, s)
s, _ = call(ana, "POST", f"/api/admin/users/{bob_id}", {"suspended": True})
check("moderation API refused for others", s == 404, s)

# --- block ---
call(ana, "POST", "/api/follows", {"username": ub})
call(bob, "POST", "/api/follows", {"username": ua})
s, r = call(ana, "POST", "/api/blocks", {"username": ub})
check("block", s == 200, (s, r))
s, page = call(bob, "GET", f"/@{ua}")
check("blocked person can't open the profile", s == 404, s)
s, r = call(bob, "POST", "/api/follows", {"username": ua})
check("blocked person can't follow", s == 403, (s, r))
s, page = call(ana, "GET", f"/@{ub}")
check("blocker sees the blocked card", "Ai blocat acest cont" in page and "data-follow-btn" not in page, "")
s, page = call(bob, "GET", f"/search?q={ua}")
check("blocker hidden from search", f"@{ua}" not in page, "")
s, page = call(ana, "GET", "/settings/account")
check("blocked list in settings", "Conturi blocate" in page and "data-unblock" in page, "")
s, r = call(ana, "DELETE", "/api/blocks", {"username": ub})
check("unblock", s == 200, (s, r))
s, _ = call(bob, "GET", f"/@{ua}")
check("profile visible again", s == 200, s)

# --- data export ---
call(ana, "POST", "/api/wishlists", {"name": "Export test"})
s, r = call(ana, "GET", "/api/account/export")
check("export my data", s == 200 and r.get("account", {}).get("username") == ua and any(l["name"] == "Export test" for l in r.get("lists", [])) and "password_hash" not in json.dumps(r), (s, str(r)[:200]))

# --- rate limit on login ---
codes = [call(client(), "POST", "/api/auth/login", {"email": f"nobody{stamp}@example.com", "password": "wrongpass1"})[0] for _ in range(7)]
check("login attempts are limited", codes[:5] == [401] * 5 and 429 in codes[5:], codes)

# --- moderation (local only: set the flags straight in the local database) ---
if LOCAL:
    sql(f"UPDATE wishlists SET hidden_at = 1 WHERE id = '{blist}'")
    s, _ = call(ana, "GET", f"/w/{bslug}")
    check("hidden list answers 404", s == 404, s)
    s, page = call(bob, "GET", f"/w/{bslug}")
    check("owner still sees the hidden list with a note", s == 200 and "ascunsă de echipa WishDrop" in page, s)
    sql(f"UPDATE users SET suspended_at = 1 WHERE id = '{bob_id}'")
    s, _ = call(ana, "GET", f"/@{ub}")
    check("suspended profile answers 404", s == 404, s)
    s, _ = call(bob, "GET", "/dashboard")
    check("suspended account is signed out", s == 302, s)
    sql(f"UPDATE users SET suspended_at = NULL WHERE id = '{bob_id}'")

for op in (ana, bob):
    call(op, "POST", "/api/account/delete")
print(f"\n{passed} passed, {failed} failed")
