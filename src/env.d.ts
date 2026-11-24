/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Page language, from the URL prefix (ro has none). */
    lang: import("./lib/i18n").Lang;
    /** The path without the language prefix: "/en/dashboard" → "/dashboard". */
    path: string;
    /** The signed-in user, or null. */
    user: import("./lib/db").User | null;
  }
}

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    SESSION: KVNamespace;
    ASSETS: Fetcher;
    APP_URL: string;
    CF_ACCOUNT_ID: string;
    OWNER_EMAIL: string;
    MAIL_FROM: string;
    REQUIRE_EMAIL_VERIFICATION: string;
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    CF_EMAIL_TOKEN?: string;
  }
}
