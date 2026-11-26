/**
 * Reaction buttons ([data-react] inside [data-reactions], see
 * components/gifts/Reactions.astro). Optimistic: the count moves at once and
 * is corrected from the server's answer.
 */
if (!(window as any).__wdReact) {
  (window as any).__wdReact = true;

  const paint = (box: HTMLElement, counts: { heart: number; want: number; mine: string[] }) => {
    box.querySelectorAll<HTMLElement>("[data-react]").forEach((b) => {
      const kind = b.dataset.react as "heart" | "want";
      b.setAttribute("aria-pressed", String(counts.mine.includes(kind)));
      const c = b.querySelector<HTMLElement>("[data-count]")!;
      c.textContent = String(counts[kind]);
      c.classList.toggle("hidden", !counts[kind]);
    });
  };
  const read = (box: HTMLElement) => {
    const counts = { heart: 0, want: 0, mine: [] as string[] };
    box.querySelectorAll<HTMLElement>("[data-react]").forEach((b) => {
      const kind = b.dataset.react as "heart" | "want";
      counts[kind] = Number(b.querySelector("[data-count]")?.textContent) || 0;
      if (b.getAttribute("aria-pressed") === "true") counts.mine.push(kind);
    });
    return counts;
  };

  document.addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-react]");
    if (!b || b.disabled) return;
    e.preventDefault();
    const box = b.closest<HTMLElement>("[data-reactions]")!;
    const kind = b.dataset.react as "heart" | "want";
    const before = read(box);
    const on = !before.mine.includes(kind);
    const optimistic = { ...before, [kind]: Math.max(0, before[kind] + (on ? 1 : -1)), mine: on ? [...before.mine, kind] : before.mine.filter((k) => k !== kind) };
    paint(box, optimistic);
    if (on) {
      b.classList.remove("react-pop");
      void b.offsetWidth;
      b.classList.add("react-pop");
    }
    b.disabled = true;
    try {
      const res = await fetch(`/api/items/${box.dataset.reactions}/react`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, on }),
      });
      if (!res.ok) throw new Error();
      paint(box, await res.json());
      // "I want it too" → offer to put the gift in my own list (components/gifts/CopyGiftSheet.astro).
      if (on && kind === "want") {
        const card = box.closest<HTMLElement>("[data-item-id]");
        window.dispatchEvent(new CustomEvent("wd:want", { detail: { itemId: box.dataset.reactions, image: card?.dataset.imageUrl || "", button: b } }));
      }
    } catch {
      paint(box, before);
    } finally {
      b.disabled = false;
    }
  });
}
