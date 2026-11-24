# Mutarea wishdrop.site pe versiunea nouă

Site-ul vechi e proiectul **Pages** `wishdrop`. Cel nou e un **Worker** `wishdrop`, legat la aceleași date: baza `wishdrop-db`, pozele din `wishdrop-images` și sesiunile `SESSION`. Nimic nu se copiază și nimic nu se pierde. La mutare se schimbă doar cine răspunde pe domeniu.

## 1. Backup și migrarea bazei de date (o fac eu, după acordul tău)

```bash
npx wrangler d1 export wishdrop-db --remote --output _recovered/backup-before-0010.sql
npx wrangler d1 migrations apply wishdrop-db --remote
```

Migrarea `0010_social.sql` doar **adaugă** câmpuri (cu valori implicite) și tabelul `follows`. Site-ul vechi merge mai departe fără probleme. D1 are și Time Travel: baza se poate readuce oricând la orice minut din ultimele 30 de zile.

## 2. Worker-ul de test pe workers.dev (îl fac eu, după acordul tău)

```bash
npm run deploy
```

Worker-ul apare la `https://wishdrop.<subdomeniul-tău>.workers.dev`, iar wishdrop.site rămâne neatins. Pe adresa de test, login-ul cu Google nu merge (Google acceptă doar wishdrop.site), dar login-ul cu e-mail da.

## 3. Cheile secrete (le pui tu, în terminal; valorile nu trec prin chat)

```bash
openssl rand -hex 32 | npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put CF_EMAIL_TOKEN
```

- **GOOGLE_CLIENT_ID**: `624138791159-05c54af9uml8p8bj6von03caue5hodu3.apps.googleusercontent.com`. E public, apare în linkul de login de pe site.
- **GOOGLE_CLIENT_SECRET**: Google Cloud Console → APIs & Services → Credentials → clientul OAuth „Web” → **Add secret**. Pe cel vechi Google nu îl mai afișează; cel nou merge în paralel cu el. *Authorized redirect URI* rămâne `https://wishdrop.site/api/auth/google/callback`, nu se schimbă nimic.
- **CF_EMAIL_TOKEN**: dash.cloudflare.com → My Profile → API Tokens → Create Token → Custom, cu permisiunea **Account → Email Sending → Send**, doar pentru contul tău.

## 4. Testul pe workers.dev (îl fac eu)

Rulez aceleași teste ca local (110 verificări), cu conturi de test pe care le șterg la final. Verific și trimiterea unui e-mail (resetare parolă) și consumul de CPU la login (bcrypt).

## 5. Mutarea domeniului (2–3 minute de întrerupere)

1. **Tu**, în dashboard: Workers & Pages → **wishdrop** (Pages) → Custom domains → `wishdrop.site` → **Remove**.
2. **Eu**: adaug în `wrangler.jsonc` `"routes": [{ "pattern": "wishdrop.site", "custom_domain": true }]` și rulez `npm run deploy`.
3. **Eu**: verific prima pagină, logarea, o listă publică și o rezervare.

Toată lumea trebuie să se logheze o dată din nou, pentru că sesiunea are alt format. Parolele rămân valabile.

## Dacă ceva nu merge: revenire

1. Se scoate ruta din `wrangler.jsonc` și se rulează `npm run deploy`. Asta eliberează domeniul.
2. Workers & Pages → wishdrop (Pages) → Custom domains → se adaugă din nou `wishdrop.site`.

Site-ul vechi revine exact cum era. Datele sunt comune, deci nimic din ce s-a făcut între timp nu se pierde. Doar câmpurile noi (profiluri, urmăriri) nu sunt folosite de versiunea veche.
