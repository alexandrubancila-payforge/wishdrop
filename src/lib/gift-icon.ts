/**
 * A fitting icon for a gift with no photo, picked from words in its name
 * ("Carte de citit" → a book, "Parfum" → a drop). Words in the four site
 * languages, matched at the start of a word and without diacritics.
 */
const WORDS: [icon: string, words: string[]][] = [
  ["book-open-text", ["carte", "carti", "book", "buch", "bucher", "книг", "roman", "kindle", "manga", "comic"]],
  ["drop", ["parfum", "perfume", "duft", "духи", "парфюм", "crema", "cream", "cosmetic", "machiaj", "makeup", "ruj", "serum", "kosmetik", "косметик"]],
  ["dress", ["rochie", "rochii", "dress", "kleid", "плать", "fusta", "skirt"]],
  ["t-shirt", ["tricou", "bluza", "hanorac", "pulover", "geaca", "haine", "shirt", "hoodie", "sweater", "jacket", "clothes", "pullover", "jacke", "футболк", "кофт", "свитер", "куртк", "одежд"]],
  ["sneaker", ["adidas", "pantof", "ghete", "cizme", "incaltaminte", "shoe", "sneaker", "boots", "schuh", "кроссовк", "обув", "ботин"]],
  ["game-controller", ["joc", "jocuri", "ps5", "ps4", "playstation", "xbox", "nintendo", "switch", "consola", "game", "spiel", "игр", "приставк"]],
  ["headphones", ["casti", "headphone", "earbuds", "airpods", "kopfhorer", "наушник"]],
  ["device-mobile", ["telefon", "iphone", "phone", "smartphone", "handy", "телефон", "смартфон"]],
  ["laptop", ["laptop", "macbook", "notebook", "computer", "calculator", "tableta", "tablet", "ipad", "ноутбук", "компьютер", "планшет"]],
  ["watch", ["ceas", "watch", "uhr", "часы", "smartwatch"]],
  ["diamond", ["inel", "colier", "cercei", "bratara", "bijuteri", "lantisor", "ring", "necklace", "earring", "bracelet", "jewel", "schmuck", "kette", "кольц", "серьг", "браслет", "украшен", "цепочк"]],
  ["flower-tulip", ["flori", "floare", "buchet", "trandafir", "flower", "bouquet", "blume", "strauss", "цвет", "букет"]],
  ["music-notes", ["chitara", "pian", "muzica", "vinil", "vinyl", "guitar", "piano", "music", "gitarre", "musik", "гитар", "музык", "пластинк"]],
  ["ticket", ["bilet", "concert", "spectacol", "ticket", "konzert", "билет", "концерт"]],
  ["airplane-tilt", ["calatori", "vacanta", "excursie", "travel", "trip", "vacation", "reise", "urlaub", "путешеств", "поездк", "отпуск"]],
  ["puzzle-piece", ["puzzle", "lego", "jucari", "toy", "spielzeug", "игрушк", "пазл", "конструктор"]],
  ["baby", ["bebe", "bebelus", "baby", "copil", "малыш", "ребен"]],
  ["paint-brush", ["pictura", "vopsea", "pensul", "culori", "acuarel", "paint", "canvas", "malen", "farbe", "краск", "рисов"]],
  ["barbell", ["fitness", "gantere", "gym", "sport", "yoga", "hantel", "фитнес", "спорт", "гантел"]],
  ["bicycle", ["bicicleta", "trotineta", "bike", "bicycle", "scooter", "fahrrad", "велосипед", "самокат"]],
  ["paw-print", ["caine", "catel", "pisica", "dog", "cat", "puppy", "hund", "katze", "собак", "кошк", "кот"]],
  ["cooking-pot", ["oala", "tigaie", "bucatarie", "mixer", "blender", "kitchen", "frying pan", "kuche", "topf", "кухн", "кастрюл", "сковород"]],
  ["wine", ["vin", "sampanie", "whisky", "wine", "champagne", "wein", "sekt", "вино", "шампанск", "виски"]],
  ["coffee", ["cafea", "espressor", "cana", "ceai", "coffee", "mug", "tea", "kaffee", "tasse", "кофе", "кружк", "чай"]],
  ["camera", ["aparat foto", "camera", "kamera", "фотоаппарат", "камер"]],
  ["television", ["televizor", "tv", "fernseher", "телевизор"]],
  ["handbag", ["geanta", "poseta", "rucsac", "portofel", "bag", "handbag", "backpack", "wallet", "tasche", "rucksack", "сумк", "рюкзак", "кошел"]],
  ["plant", ["planta", "plante", "plant", "pflanze", "растен"]],
];

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

export function giftIcon(title: string | null | undefined): string {
  if (!title) return "gift";
  const text = " " + fold(title).replace(/[^\p{L}\p{N}]+/gu, " ") + " ";
  for (const [icon, words] of WORDS) {
    if (words.some((w) => text.includes(" " + fold(w)))) return icon;
  }
  return "gift";
}

const TINTS = ["bg-accent-50 text-accent-600", "bg-lav text-lav-ink", "bg-sun text-sun-ink", "bg-mint text-mint-ink"];

/** A soft background tint per gift, the same on every page. */
export function giftTint(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

/** Filter groups on /popular, picked from the gift's icon or, failing that, its shop. */
export type GiftCategory = "fashion" | "tech" | "books" | "beauty" | "home" | "kids" | "other";
export const CATEGORIES: Exclude<GiftCategory, "other">[] = ["fashion", "tech", "books", "beauty", "home", "kids"];

const BY_ICON: Record<string, GiftCategory> = {
  "t-shirt": "fashion", dress: "fashion", sneaker: "fashion", handbag: "fashion", diamond: "fashion", watch: "fashion",
  headphones: "tech", "device-mobile": "tech", laptop: "tech", camera: "tech", television: "tech", "game-controller": "tech",
  "book-open-text": "books",
  drop: "beauty",
  "cooking-pot": "home", plant: "home", coffee: "home", wine: "home",
  "puzzle-piece": "kids", baby: "kids",
};
const BY_SHOP: [RegExp, GiftCategory][] = [
  [/zalando|answear|hm\.com|zara|bershka|asos|shein|aboutyou|reserved|nike|adidas|pandora|fashiondays|modivo|temu/, "fashion"],
  [/steampowered|playstation|xbox|nintendo|emag|darwin|altex|flanco|pcgarage|apple|samsung|xiaomi|enter\.online|maximum\.md/, "tech"],
  [/librarius|carturesti|elefant|libris|bookdepository|okian|books|emag\.ro\/carti/, "books"],
  [/notino|sephora|douglas|makeup|vizaje|esteelauder|parfum/, "beauty"],
  [/ikea|jysk|dedeman|leroymerlin|mobexpert|kitchen|home/, "home"],
  [/noriel|smyk|lego|toys|jucarii|babyshop/, "kids"],
];

export function giftCategory(title: string | null | undefined, url: string | null | undefined): GiftCategory {
  const byIcon = BY_ICON[giftIcon(title)];
  if (byIcon) return byIcon;
  let host = "";
  try {
    host = url ? new URL(url).hostname.toLowerCase() + new URL(url).pathname.toLowerCase() : "";
  } catch {}
  for (const [re, cat] of BY_SHOP) if (re.test(host)) return cat;
  return "other";
}
