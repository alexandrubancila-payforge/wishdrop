/**
 * Automatic photo check before a photo is stored (gift photos, avatars and
 * photos fetched from a product link). A vision model on Workers AI (binding
 * `AI`) answers one word:
 *
 *   block    nudity, sexual content, gore… → the upload is refused
 *   review   borderline → stored, and a "photo" report lands in /admin
 *   ok       everything else
 *
 * If the model can't be reached the photo goes through (logged): a broken AI
 * call must never stop people from adding gifts. Workers AI's free daily
 * allowance covers hundreds of photos a day.
 */
import { env, waitUntil } from "cloudflare:workers";
import { db, newId, now } from "./db";
import { sendOwnerEmail } from "./email";

const MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";
/** Bigger photos aren't sent to the model (the image goes over as a byte array). */
export const MAX_CHECK_BYTES = 3 * 1024 * 1024;

const PROMPT = `You moderate photos for a family-friendly gift wish list website, where people add photos of gifts they would like.
Classify the image. Reply with exactly one word.
BLOCK: nudity, exposed genitals or breasts, sexual acts, pornography, erotic or sexual posing, sex toys, gore, graphic violence or injuries, self-harm, hate symbols.
REVIEW: suggestive photos that are not explicit (for example underwear or swimwear worn in a provocative pose), drugs, weapons aimed at people.
OK: everything else, including ordinary product photos of clothes, underwear or swimwear, toys, books, electronics, cosmetics, food, games, and normal photos of people, pets or places.
Answer with BLOCK, REVIEW or OK.`;

export type Verdict = "ok" | "review" | "block";

interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<{ response?: string }>;
}

const ai = () => (env as unknown as { AI?: AiBinding }).AI;

async function ask(bytes: Uint8Array) {
  const res = await ai()!.run(MODEL, { prompt: PROMPT, image: Array.from(bytes), max_tokens: 5, temperature: 0 });
  return (res.response ?? "").trim().toUpperCase();
}

export async function checkImage(body: ArrayBuffer): Promise<{ verdict: Verdict; answer: string }> {
  if (!ai()) return { verdict: "ok", answer: "no AI binding" };
  const bytes = new Uint8Array(body);
  let answer: string;
  try {
    answer = await ask(bytes);
  } catch (e) {
    // Meta's license has to be accepted once per account ("prompt": "agree"), then the call works.
    if (String(e).toLowerCase().includes("agree")) {
      try {
        // Accepting answers with an error too ("5016: Thank you for agreeing…").
        await ai()!.run(MODEL, { prompt: "agree" }).catch(() => {});
        answer = await ask(bytes);
      } catch (e2) {
        console.error("photo check failed", e2);
        return { verdict: "ok", answer: "error" };
      }
    } else {
      console.error("photo check failed", e);
      return { verdict: "ok", answer: "error" };
    }
  }
  if (import.meta.env.DEV) console.log("[photo check]", answer);
  const verdict: Verdict = answer.startsWith("BLOCK") ? "block" : answer.startsWith("REVIEW") ? "review" : "ok";
  return { verdict, answer };
}

/** A borderline photo: an open "photo" report in /admin (target = who uploaded it) and an email to the owner. */
export async function flagPhoto(userId: string, imageKey: string, origin: string) {
  await db()
    .prepare(
      `INSERT INTO reports (id, kind, target_id, reason, message, image_key, created_at)
       VALUES (?, 'photo', ?, 'inappropriate', ?, ?, ?)`,
    )
    .bind(newId(), userId, "Verificare automată: poză la limită", imageKey, now())
    .run();
  if (env.OWNER_EMAIL) {
    waitUntil(
      sendOwnerEmail({
        subject: "WishDrop — poză de verificat",
        emoji: "🖼️",
        title: "O poză de verificat",
        facts: [["Ce", "Verificarea automată a găsit o poză la limită. A fost publicată, dar merită o privire."]],
        button: { label: "Vezi și decide", url: `${origin}/admin#reports` },
      }).catch(() => false),
    );
  }
}
