"""Notifications (follow, requests). Usage: python3 -I tests/e2e/notif.py http://localhost:4400"""
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


ana, ua = user("ana")
bob, ub = user("bob", private=True)
cris, uc = user("cris")

check("no notifications at start", bell(ana) == 0, bell(ana))
call(cris, "POST", "/api/follows", {"username": ua})
check("follow → bell shows 1", bell(ana) == 1, bell(ana))
s, page = call(ana, "GET", "/notifications")
check("notifications page lists the follower", s == 200 and "Cris Test" in page and "a început să te urmărească" in page, s)
check("follow back button offered", "data-follow-btn" in page and uc in page, "")
check("opening the page clears the bell", bell(ana) == 0, bell(ana))
s, page = call(ana, "GET", "/notifications")
check("read notification moves to Earlier", "Mai devreme" in page and "Cris Test" in page, "")

call(cris, "DELETE", "/api/follows", {"username": ua})
s, page = call(ana, "GET", "/notifications")
check("unfollow removes the notification", "Cris Test" not in page, "")

call(ana, "POST", "/api/follows", {"username": ub})
check("request to private profile → bell 1", bell(bob) == 1, bell(bob))
s, page = call(bob, "GET", "/notifications")
check("request notification with Accept button", "vrea să te urmărească" in page and 'data-action="accept"' in page, "")
uid = re.search(r'data-request="([^"]+)"', page).group(1)
s, r = call(bob, "POST", "/api/follows/requests", {"user_id": uid, "action": "accept"})
check("accept from notification", s == 200, (s, r))
check("requester gets 'accepted' notification", bell(ana) == 1, bell(ana))
s, page = call(ana, "GET", "/notifications")
check("accepted text shown", "ți-a acceptat cererea" in page and "Bob Test" in page, "")
s, page = call(bob, "GET", "/notifications")
check("accepted request now reads as a follow", "a început să te urmărească" in page and 'data-action="accept"' not in page, "")

call(cris, "POST", "/api/follows", {"username": ub})
s, page = call(bob, "GET", "/notifications")
uid = re.search(r'data-request="([^"]+)"', page).group(1)
call(bob, "POST", "/api/follows/requests", {"user_id": uid, "action": "decline"})
s, page = call(bob, "GET", "/notifications")
check("declined request disappears", "Cris Test" not in page, "")

call(cris, "POST", "/api/follows", {"username": ub})
call(bob, "PATCH", "/api/account/profile", {"is_private": False})
s, page = call(bob, "GET", "/notifications")
check("going public turns pending requests into follows", "Cris Test" in page and 'data-action="accept"' not in page, "")

s, page = call(ana, "GET", "/")
check("home sidebar has Notifications", "/notifications" in page, "")
for op in (ana, bob, cris):
    call(op, "POST", "/api/account/delete")
print(f"\n{passed} passed, {failed} failed")
