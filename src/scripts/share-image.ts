/**
 * Share pictures of a list, drawn in the browser (no server rendering):
 *   storyImage()  1080×1920 for Instagram / WhatsApp stories: title, owner,
 *                 event date, up to four gift photos and a QR code to the list.
 *   qrCard()      1200×1500 printable card for invitations: big QR + title + link.
 * Both return PNG blobs. Photos come from /api/images (same origin), so the
 * canvas stays exportable.
 */
import QRCode from "qrcode";

export interface ShareInfo {
  url: string;
  title: string;
  owner: string;
  event: string;
  photos: string[];
  /** Texts in the page language. */
  labels: { myList: string; scan: string; by: string };
}

const C = {
  paper: "#fffaf7",
  ink: "#2b2433",
  soft: "#75697f",
  coral: "#f0726a",
  coralLight: "#fde3df",
  lav: "#ece8fd",
  sun: "#fdf0d5",
  mint: "#dcf5ec",
  sand: "#f7efeb",
};
const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw an image filling the box (like object-fit: cover), with rounded corners. */
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

/** Lines of `text` that fit `width`, at most `max` lines (the last one ends with "…"). */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= width || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    lines.length = max;
    let last = lines[max - 1];
    while (ctx.measureText(last + "…").width > width && last.length > 1) last = last.slice(0, -1);
    lines[max - 1] = last + "…";
  }
  return lines;
}

async function qrCanvas(url: string, size: number) {
  const c = document.createElement("canvas");
  await QRCode.toCanvas(c, url, { width: size, margin: 0, errorCorrectionLevel: "M", color: { dark: C.ink, light: "#ffffff" } });
  return c;
}

function giftIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  // A simple flat gift box (body, lid, ribbon).
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, cx - s / 2, cy - s * 0.15, s, s * 0.6, s * 0.08);
  ctx.fill();
  roundRect(ctx, cx - s * 0.58, cy - s * 0.38, s * 1.16, s * 0.26, s * 0.08);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - s * 0.07, cy - s * 0.38, s * 0.14, s * 0.83);
  ctx.restore();
}

function brand(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = C.coral;
  roundRect(ctx, x, y, s, s, s * 0.3);
  ctx.fill();
  giftIcon(ctx, x + s / 2, y + s / 2 + s * 0.02, s * 0.5, "#fff");
  ctx.fillStyle = C.ink;
  ctx.font = `800 ${s * 0.62}px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Wish", x + s * 1.3, y + s / 2);
  const w = ctx.measureText("Wish").width;
  ctx.fillStyle = C.coral;
  ctx.fillText("Drop", x + s * 1.3 + w, y + s / 2);
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));

export async function storyImage(info: ShareInfo): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  // Soft pastel shapes in the corners (flat colours, no gradients).
  for (const [x, y, r, col] of [
    [960, 170, 170, C.lav],
    [120, 1760, 210, C.sun],
    [1010, 1530, 120, C.mint],
    [70, 420, 80, C.coralLight],
  ] as const) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  brand(ctx, 90, 110, 76);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.coral;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(info.labels.myList.toUpperCase(), 90, 330);

  ctx.fillStyle = C.ink;
  ctx.font = `800 104px ${FONT}`;
  const lines = wrap(ctx, info.title, W - 180, 2);
  lines.forEach((l, i) => ctx.fillText(l, 90, 450 + i * 116));
  let y = 450 + (lines.length - 1) * 116 + 72;

  ctx.font = `600 40px ${FONT}`;
  ctx.fillStyle = C.soft;
  if (info.owner) {
    ctx.fillText(info.labels.by.replace("{name}", info.owner), 90, y);
    y += 30;
  }
  if (info.event) {
    ctx.font = `700 38px ${FONT}`;
    const tw = ctx.measureText(info.event).width;
    ctx.fillStyle = C.lav;
    roundRect(ctx, 90, y + 10, tw + 64, 72, 36);
    ctx.fill();
    ctx.fillStyle = "#5b4bc4";
    ctx.textBaseline = "middle";
    ctx.fillText(info.event, 122, y + 47);
    ctx.textBaseline = "alphabetic";
    y += 90;
  }

  // Photos: 2×2 grid (or one big / two side by side).
  const photos = (await Promise.all(info.photos.slice(0, 4).map(loadImage))).filter((p): p is HTMLImageElement => !!p);
  const top = Math.max(y + 50, 820);
  const gridH = 1390 - top;
  const gap = 28;
  const gx = 90;
  const gw = W - 180;
  ctx.save();
  ctx.shadowColor = "rgba(43,36,51,0.12)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#fff";
  roundRect(ctx, gx - 20, top - 20, gw + 40, gridH + 40, 56);
  ctx.fill();
  ctx.restore();
  if (photos.length === 0) {
    ctx.fillStyle = C.coralLight;
    roundRect(ctx, gx, top, gw, gridH, 40);
    ctx.fill();
    giftIcon(ctx, W / 2, top + gridH / 2, 220, C.coral);
  } else {
    const cells =
      photos.length === 1
        ? [[gx, top, gw, gridH]]
        : photos.length === 2
          ? [
              [gx, top, (gw - gap) / 2, gridH],
              [gx + (gw + gap) / 2, top, (gw - gap) / 2, gridH],
            ]
          : [
              [gx, top, (gw - gap) / 2, (gridH - gap) / 2],
              [gx + (gw + gap) / 2, top, (gw - gap) / 2, (gridH - gap) / 2],
              [gx, top + (gridH + gap) / 2, (gw - gap) / 2, (gridH - gap) / 2],
              [gx + (gw + gap) / 2, top + (gridH + gap) / 2, (gw - gap) / 2, (gridH - gap) / 2],
            ];
    cells.forEach(([x, cy, w, h], i) => {
      const img = photos[i];
      if (img) cover(ctx, img, x, cy, w, h, 34);
      else {
        ctx.fillStyle = C.coralLight;
        roundRect(ctx, x, cy, w, h, 34);
        ctx.fill();
        giftIcon(ctx, x + w / 2, cy + h / 2, Math.min(w, h) * 0.35, C.coral);
      }
    });
  }

  // QR + call to action.
  const qrSize = 300;
  const qy = 1470;
  ctx.fillStyle = "#fff";
  roundRect(ctx, 90, qy, qrSize + 48, qrSize + 48, 36);
  ctx.fill();
  ctx.drawImage(await qrCanvas(info.url, qrSize), 114, qy + 24, qrSize, qrSize);
  ctx.fillStyle = C.ink;
  ctx.font = `800 52px ${FONT}`;
  const ctaLines = wrap(ctx, info.labels.scan, W - 180 - qrSize - 90, 3);
  ctaLines.forEach((l, i) => ctx.fillText(l, 90 + qrSize + 90, qy + 90 + i * 64));
  ctx.fillStyle = C.coral;
  ctx.font = `700 36px ${FONT}`;
  ctx.fillText(info.url.replace(/^https?:\/\//, "").slice(0, 34), 90 + qrSize + 90, qy + 90 + ctaLines.length * 64 + 20);

  return toBlob(c);
}

export async function qrCard(info: ShareInfo): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1200;
  const H = 1500;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.paper;
  roundRect(ctx, 40, 40, W - 80, H - 80, 60);
  ctx.fill();

  brand(ctx, 100, 100, 64);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  ctx.font = `800 76px ${FONT}`;
  const lines = wrap(ctx, info.title, W - 200, 2);
  lines.forEach((l, i) => ctx.fillText(l, 100, 300 + i * 88));
  let y = 300 + (lines.length - 1) * 88 + 60;
  ctx.font = `600 36px ${FONT}`;
  ctx.fillStyle = C.soft;
  if (info.event) {
    ctx.fillText(info.event, 100, y);
    y += 40;
  }

  const size = 640;
  const qx = (W - size) / 2;
  const qy = Math.max(y + 50, 480);
  ctx.fillStyle = "#fff";
  roundRect(ctx, qx - 40, qy - 40, size + 80, size + 80, 48);
  ctx.fill();
  ctx.drawImage(await qrCanvas(info.url, size), qx, qy, size, size);

  ctx.textAlign = "center";
  ctx.fillStyle = C.ink;
  ctx.font = `800 48px ${FONT}`;
  ctx.fillText(info.labels.scan, W / 2, qy + size + 130);
  ctx.fillStyle = C.coral;
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(info.url.replace(/^https?:\/\//, ""), W / 2, qy + size + 190);
  return toBlob(c);
}

/** Share the PNG (phones: straight to Instagram / WhatsApp), or download it. */
export async function shareOrDownload(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  download(blob, filename);
}

export function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
