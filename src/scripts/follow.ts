/**
 * Follow buttons ([data-follow-btn], see components/social/FollowButton.astro).
 * Delegated on document, so buttons added later (live search results) work too.
 */
// One handler for every follow button on the page.
if (!(window as any).__wdFollow) {
  (window as any).__wdFollow = true;

  const label = (b: HTMLElement, hover = false) => {
    const rel = b.dataset.relation;
    if (rel === "none") return b.dataset.lFollow!;
    if (rel === "following") return hover ? b.dataset.lUnfollow! : b.dataset.lFollowing!;
    return hover ? b.dataset.lCancel! : b.dataset.lRequested!;
  };
  const paint = (b: HTMLElement) => {
    b.textContent = label(b);
    b.classList.toggle("btn-primary", b.dataset.relation === "none");
    b.classList.toggle("btn-ghost", b.dataset.relation !== "none");
  };

  document.addEventListener("mouseover", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-follow-btn]");
    if (b && b.dataset.relation !== "none") b.textContent = label(b, true);
  });
  document.addEventListener("mouseout", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-follow-btn]");
    if (b) b.textContent = label(b);
  });

  document.addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-follow-btn]");
    if (!b || b.disabled) return;
    const wasNone = b.dataset.relation === "none";
    b.disabled = true;
    try {
      const res = await fetch("/api/follows", {
        method: wasNone ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: b.dataset.username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      b.dataset.relation = data.relation;
      paint(b);
      if (b.dataset.reload === "true") window.location.reload();
    } catch {
      paint(b);
    } finally {
      b.disabled = false;
    }
  });
}

export {};
