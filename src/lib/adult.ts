/**
 * Gifts for adults only (sex shops, toys, erotic books): other people see them
 * blurred with an "18+" badge until they confirm they're over 18
 * (components/gifts/AdultCover.astro), and they never appear on /popular.
 * The owner always sees their own gifts plainly.
 */
const ADULT_SHOP = /sex|xshop|adult|erotic|porn|intim|lovense|beate-uhse|orion\.de/i;
const ADULT_WORDS =
  /\b(sex\w*|penis\w*|vibrat(or|oare|ion)\w*|dildo\w*|erot\w*|bdsm|fetish\w*|lubrifiant\w*|lubricant\w*|masturb\w*|strap-?on|butt ?plug|cock ?ring|вибратор\w*|секс\w*|эротик\w*)\b/i;

export function isAdultGift(gift: { product_url?: string | null; title?: string | null }) {
  let host = "";
  try {
    host = gift.product_url ? new URL(gift.product_url).hostname : "";
  } catch {}
  return ADULT_SHOP.test(host) || ADULT_WORDS.test(gift.title ?? "");
}
