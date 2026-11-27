/**
 * The "Phone notifications" card on /notifications (#push-card): subscribes
 * this browser to Web Push with our VAPID key and registers it with
 * /api/push/subscribe. iPhones need WishDrop on the Home Screen first.
 */
const card = document.getElementById("push-card");

function keyBytes(b64: string) {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function save(sub: PushSubscription | null, lang: string, remove = false) {
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: remove ? "DELETE" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), lang }),
  });
}

if (card) {
  const btn = card.querySelector<HTMLButtonElement>("[data-push-btn]")!;
  const note = card.querySelector<HTMLElement>("[data-push-note]")!;
  const onText = card.querySelector<HTMLElement>("[data-push-on]")!;
  const lang = card.dataset.lang || "en";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

  const say = (msg: string) => {
    note.textContent = msg;
    note.classList.toggle("hidden", !msg);
  };
  const paint = (on: boolean) => {
    btn.textContent = on ? card.dataset.lDisable! : card.dataset.lEnable!;
    btn.classList.toggle("btn-primary", !on);
    btn.classList.toggle("btn-ghost", on);
    onText.classList.toggle("hidden", !on);
  };

  card.classList.replace("hidden", "flex");
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) {
    btn.classList.add("hidden");
    say(ios && !standalone ? note.dataset.ios! : note.dataset.unsupported!);
  } else if (Notification.permission === "denied") {
    btn.classList.add("hidden");
    say(note.dataset.denied!);
  } else {
    (async () => {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      paint(!!sub);
      // Keep the server's copy current (it drops subscriptions the push service rejects).
      if (sub) save(sub, lang).catch(() => {});

      btn.addEventListener("click", async () => {
        btn.disabled = true;
        say("");
        try {
          if (sub) {
            await save(sub, lang, true);
            await sub.unsubscribe();
            sub = null;
          } else {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              if (permission === "denied") {
                btn.classList.add("hidden");
                say(note.dataset.denied!);
              }
              return;
            }
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(card.dataset.key!) });
            await save(sub, lang);
          }
          paint(!!sub);
        } catch {
          say(card.dataset.lFail!);
        } finally {
          btn.disabled = false;
        }
      });
    })();
  }
}
