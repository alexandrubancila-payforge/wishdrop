/**
 * Google Tag Manager for measuring Google Ads, loaded only after the visitor
 * accepts the cookie banner (components/CookieBanner.astro, Layout.astro).
 *
 * A new account sets the short-lived `wd_signup` cookie; the next page reads
 * it and sends a `sign_up` event to the dataLayer (if cookies were accepted),
 * which GTM can use as the Google Ads conversion.
 */
import type { AstroCookies } from "astro";

export const GTM_ID = "GTM-MRB2CCLG";
export const SIGNUP_COOKIE = "wd_signup";

export function markSignup(cookies: AstroCookies, method: "email" | "google", secure: boolean) {
  cookies.set(SIGNUP_COOKIE, method, { path: "/", maxAge: 86_400, sameSite: "lax", secure, httpOnly: false });
}
