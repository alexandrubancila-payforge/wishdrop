import type { Lang } from "@/lib/i18n";

/**
 * Privacy policy and terms, per language. A section has either a paragraph (`p`)
 * or a bullet list (`list`). "{someone@example.com}" in the text renders as a mailto link.
 */
export interface LegalDoc {
  title: string;
  description: string;
  h1: string;
  updated: string;
  intro: string;
  sections: { h: string; p?: string; list?: string[] }[];
}

export const privacy: Record<Lang, LegalDoc> = {
  "ro": {
    "title": "Politica de confidențialitate — WishDrop",
    "description": "WishDrop este un serviciu gratuit prin care îți creezi liste de cadouri și le împarți printr-un link public. Respectăm datele tale și colectăm strict minimul necesar pentru funcționarea serviciului.",
    "h1": "Politica de confidențialitate",
    "updated": "Ultima actualizare: 25 iunie 2026",
    "intro": "WishDrop este un serviciu gratuit prin care îți creezi liste de cadouri și le împarți printr-un link public. Respectăm datele tale și colectăm strict minimul necesar pentru funcționarea serviciului.",
    "sections": [
      {
        "h": "Cine suntem",
        "p": "WishDrop este operat de Ban Studio (banstudio.dev), Republica Moldova. Pentru orice întrebare legată de datele tale, ne poți scrie la {contact@wishdrop.site}."
      },
      {
        "h": "Ce date colectăm",
        "list": [
          "Cont: adresa de email și, opțional, numele tău. Parola este stocată doar sub formă criptată (hash), niciodată în text clar.",
          "Conectare cu Google (opțional): dacă alegi această metodă, primim de la Google numele, adresa de email și poza de profil.",
          "Conținutul listelor: numele listelor, cadourile (preț, link, imagine) și rezervările făcute de vizitatori.",
          "Tehnice: un cookie de sesiune pentru a te menține autentificat și un cookie pentru limba aleasă."
        ]
      },
      {
        "h": "De ce le folosim",
        "p": "Folosim aceste date exclusiv pentru a furniza serviciul: autentificare, afișarea listelor tale, trimiterea emailurilor de confirmare/resetare parolă. Nu vindem și nu închiriem datele tale nimănui."
      },
      {
        "h": "Servicii terțe",
        "list": [
          "Cloudflare — găzduire, bază de date și stocarea imaginilor.",
          "Google — doar dacă folosești „Conectare cu Google”.",
          "Trimitem emailuri tranzacționale (confirmare cont, resetare parolă) de la adresa {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookie-uri",
        "p": "Folosim doar cookie-uri esențiale: unul pentru sesiunea ta de autentificare și unul pentru a reține limba aleasă. Nu folosim cookie-uri de publicitate."
      },
      {
        "h": "Drepturile tale",
        "p": "Poți cere oricând ștergerea contului și a tuturor datelor asociate, scriindu-ne la {contact@wishdrop.site}. Poți șterge singur listele și cadourile din contul tău în orice moment."
      },
      {
        "h": "Modificări",
        "p": "Putem actualiza această politică. Versiunea curentă este mereu disponibilă pe această pagină."
      }
    ]
  },
  "en": {
    "title": "Privacy Policy — WishDrop",
    "description": "WishDrop is a free service for creating gift lists and sharing them via a public link. We respect your data and collect only the minimum needed to run the service.",
    "h1": "Privacy Policy",
    "updated": "Last updated: 25 iunie 2026",
    "intro": "WishDrop is a free service for creating gift lists and sharing them via a public link. We respect your data and collect only the minimum needed to run the service.",
    "sections": [
      {
        "h": "Who we are",
        "p": "WishDrop is operated by Ban Studio (banstudio.dev), Republic of Moldova. For any question about your data, write to us at {contact@wishdrop.site}."
      },
      {
        "h": "What we collect",
        "list": [
          "Account: your email address and, optionally, your name. Your password is stored only in hashed form, never in plain text.",
          "Google sign-in (optional): if you choose it, we receive your name, email and profile picture from Google.",
          "List content: list names, gifts (price, link, image) and reservations made by visitors.",
          "Technical: a session cookie to keep you signed in and a cookie for your chosen language."
        ]
      },
      {
        "h": "Why we use it",
        "p": "We use this data solely to provide the service: authentication, showing your lists, and sending confirmation/password-reset emails. We never sell or rent your data."
      },
      {
        "h": "Third-party services",
        "list": [
          "Cloudflare — hosting, database and image storage.",
          "Google — only if you use “Sign in with Google”.",
          "We send transactional emails (account confirmation, password reset) from {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookies",
        "p": "We use only essential cookies: one for your login session and one to remember your chosen language. We do not use advertising cookies."
      },
      {
        "h": "Your rights",
        "p": "You can request deletion of your account and all associated data at any time by writing to {contact@wishdrop.site}. You can also delete your lists and gifts yourself anytime."
      },
      {
        "h": "Changes",
        "p": "We may update this policy. The current version is always available on this page."
      }
    ]
  },
  "de": {
    "title": "Datenschutzerklärung — WishDrop",
    "description": "WishDrop ist ein kostenloser Dienst, mit dem du Geschenklisten erstellst und über einen öffentlichen Link teilst. Wir respektieren deine Daten und erheben nur das Nötigste für den Betrieb des Dienstes.",
    "h1": "Datenschutzerklärung",
    "updated": "Zuletzt aktualisiert: 25 iunie 2026",
    "intro": "WishDrop ist ein kostenloser Dienst, mit dem du Geschenklisten erstellst und über einen öffentlichen Link teilst. Wir respektieren deine Daten und erheben nur das Nötigste für den Betrieb des Dienstes.",
    "sections": [
      {
        "h": "Wer wir sind",
        "p": "WishDrop wird von Ban Studio (banstudio.dev), Republik Moldau, betrieben. Bei Fragen zu deinen Daten schreibe uns an {contact@wishdrop.site}."
      },
      {
        "h": "Welche Daten wir erheben",
        "list": [
          "Konto: deine E-Mail-Adresse und optional dein Name. Das Passwort wird nur verschlüsselt (Hash) gespeichert, niemals im Klartext.",
          "Google-Anmeldung (optional): Wenn du sie wählst, erhalten wir von Google deinen Namen, deine E-Mail und dein Profilbild.",
          "Listeninhalte: Listennamen, Geschenke (Preis, Link, Bild) und Reservierungen von Besuchern.",
          "Technisch: ein Sitzungs-Cookie, um dich angemeldet zu halten, und ein Cookie für die gewählte Sprache."
        ]
      },
      {
        "h": "Wofür wir sie nutzen",
        "p": "Wir nutzen diese Daten ausschließlich zur Bereitstellung des Dienstes: Anmeldung, Anzeige deiner Listen, Versand von Bestätigungs-/Passwort-Reset-E-Mails. Wir verkaufen oder vermieten deine Daten niemals."
      },
      {
        "h": "Drittanbieter",
        "list": [
          "Cloudflare — Hosting, Datenbank und Bildspeicherung.",
          "Google — nur wenn du „Mit Google anmelden“ nutzt.",
          "Wir senden transaktionale E-Mails (Kontobestätigung, Passwort-Reset) von {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookies",
        "p": "Wir verwenden nur essenzielle Cookies: eines für deine Anmeldesitzung und eines, um deine Sprache zu merken. Keine Werbe-Cookies."
      },
      {
        "h": "Deine Rechte",
        "p": "Du kannst jederzeit die Löschung deines Kontos und aller zugehörigen Daten verlangen, indem du uns an {contact@wishdrop.site} schreibst. Listen und Geschenke kannst du jederzeit selbst löschen."
      },
      {
        "h": "Änderungen",
        "p": "Wir können diese Erklärung aktualisieren. Die aktuelle Version ist stets auf dieser Seite verfügbar."
      }
    ]
  },
  "ru": {
    "title": "Политика конфиденциальности — WishDrop",
    "description": "WishDrop — бесплатный сервис для создания списков подарков и обмена ими по публичной ссылке. Мы уважаем ваши данные и собираем только необходимый минимум для работы сервиса.",
    "h1": "Политика конфиденциальности",
    "updated": "Последнее обновление: 25 iunie 2026",
    "intro": "WishDrop — бесплатный сервис для создания списков подарков и обмена ими по публичной ссылке. Мы уважаем ваши данные и собираем только необходимый минимум для работы сервиса.",
    "sections": [
      {
        "h": "Кто мы",
        "p": "WishDrop управляется Ban Studio (banstudio.dev), Республика Молдова. По любым вопросам о ваших данных пишите на {contact@wishdrop.site}."
      },
      {
        "h": "Какие данные мы собираем",
        "list": [
          "Аккаунт: ваш email и, по желанию, имя. Пароль хранится только в зашифрованном виде (хеш), никогда в открытом виде.",
          "Вход через Google (необязательно): если вы выберете его, мы получаем от Google ваше имя, email и фото профиля.",
          "Содержимое списков: названия списков, подарки (цена, ссылка, изображение) и брони, сделанные гостями.",
          "Технические: cookie сессии, чтобы вы оставались в системе, и cookie выбранного языка."
        ]
      },
      {
        "h": "Зачем мы их используем",
        "p": "Мы используем эти данные исключительно для работы сервиса: аутентификация, показ ваших списков, отправка писем подтверждения/сброса пароля. Мы никогда не продаём и не сдаём ваши данные."
      },
      {
        "h": "Сторонние сервисы",
        "list": [
          "Cloudflare — хостинг, база данных и хранение изображений.",
          "Google — только если вы используете «Вход через Google».",
          "Мы отправляем транзакционные письма (подтверждение аккаунта, сброс пароля) с адреса {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookie-файлы",
        "p": "Мы используем только необходимые cookie: для вашей сессии входа и для запоминания выбранного языка. Рекламных cookie нет."
      },
      {
        "h": "Ваши права",
        "p": "Вы можете в любой момент запросить удаление аккаунта и всех связанных данных, написав на {contact@wishdrop.site}. Списки и подарки вы также можете удалить сами в любое время."
      },
      {
        "h": "Изменения",
        "p": "Мы можем обновлять эту политику. Актуальная версия всегда доступна на этой странице."
      }
    ]
  }
};

export const terms: Record<Lang, LegalDoc> = {
  "ro": {
    "title": "Termeni și condiții — WishDrop",
    "description": "Prin folosirea WishDrop ești de acord cu termenii de mai jos. WishDrop este oferit de Ban Studio (banstudio.dev), Republica Moldova.",
    "h1": "Termeni și condiții",
    "updated": "Ultima actualizare: 25 iunie 2026",
    "intro": "Prin folosirea WishDrop ești de acord cu termenii de mai jos. WishDrop este oferit de Ban Studio (banstudio.dev), Republica Moldova.",
    "sections": [
      {
        "h": "Serviciul",
        "p": "WishDrop este un serviciu gratuit care îți permite să creezi liste de cadouri și să le împarți printr-un link public. Vizitatorii pot rezerva cadouri fără cont."
      },
      {
        "h": "Contul tău",
        "p": "Ești responsabil pentru păstrarea în siguranță a datelor de autentificare și pentru activitatea din contul tău. Folosește o adresă de email reală pentru a putea recupera accesul."
      },
      {
        "h": "Utilizare acceptabilă",
        "p": "Nu folosi WishDrop pentru conținut ilegal, înșelător, ofensator sau care încalcă drepturile altora. Ne rezervăm dreptul de a suspenda conturile care încalcă acești termeni."
      },
      {
        "h": "Conținutul tău",
        "p": "Conținutul listelor îți aparține. Reține că listele partajate printr-un link public sunt vizibile pentru oricine are linkul."
      },
      {
        "h": "Donații",
        "p": "Donațiile prin butonul de susținere sunt complet voluntare și nerambursabile. Serviciul rămâne gratuit indiferent de donații."
      },
      {
        "h": "Fără garanții",
        "p": "Serviciul este oferit „ca atare”, fără garanții. Facem tot posibilul să fie disponibil și sigur, dar nu putem garanta funcționare neîntreruptă sau fără erori."
      },
      {
        "h": "Modificări și contact",
        "p": "Putem actualiza acești termeni; versiunea curentă e mereu pe această pagină. Întrebări: {contact@wishdrop.site}."
      }
    ]
  },
  "en": {
    "title": "Terms of Service — WishDrop",
    "description": "By using WishDrop you agree to the terms below. WishDrop is provided by Ban Studio (banstudio.dev), Republic of Moldova.",
    "h1": "Terms of Service",
    "updated": "Last updated: 25 iunie 2026",
    "intro": "By using WishDrop you agree to the terms below. WishDrop is provided by Ban Studio (banstudio.dev), Republic of Moldova.",
    "sections": [
      {
        "h": "The service",
        "p": "WishDrop is a free service that lets you create gift lists and share them via a public link. Visitors can reserve gifts without an account."
      },
      {
        "h": "Your account",
        "p": "You are responsible for keeping your login credentials safe and for activity on your account. Use a real email address so you can recover access."
      },
      {
        "h": "Acceptable use",
        "p": "Do not use WishDrop for illegal, deceptive, offensive content or content that violates the rights of others. We may suspend accounts that breach these terms."
      },
      {
        "h": "Your content",
        "p": "Your list content belongs to you. Note that lists shared via a public link are visible to anyone who has the link."
      },
      {
        "h": "Donations",
        "p": "Donations made through the support button are entirely voluntary and non-refundable. The service stays free regardless of donations."
      },
      {
        "h": "No warranty",
        "p": "The service is provided “as is”, without warranties. We work to keep it available and secure, but cannot guarantee uninterrupted or error-free operation."
      },
      {
        "h": "Changes and contact",
        "p": "We may update these terms; the current version is always on this page. Questions: {contact@wishdrop.site}."
      }
    ]
  },
  "de": {
    "title": "Nutzungsbedingungen — WishDrop",
    "description": "Mit der Nutzung von WishDrop stimmst du den folgenden Bedingungen zu. WishDrop wird von Ban Studio (banstudio.dev), Republik Moldau, bereitgestellt.",
    "h1": "Nutzungsbedingungen",
    "updated": "Zuletzt aktualisiert: 25 iunie 2026",
    "intro": "Mit der Nutzung von WishDrop stimmst du den folgenden Bedingungen zu. WishDrop wird von Ban Studio (banstudio.dev), Republik Moldau, bereitgestellt.",
    "sections": [
      {
        "h": "Der Dienst",
        "p": "WishDrop ist ein kostenloser Dienst, mit dem du Geschenklisten erstellen und über einen öffentlichen Link teilen kannst. Besucher können Geschenke ohne Konto reservieren."
      },
      {
        "h": "Dein Konto",
        "p": "Du bist für die sichere Aufbewahrung deiner Anmeldedaten und für die Aktivität in deinem Konto verantwortlich. Verwende eine echte E-Mail-Adresse, um den Zugang wiederherstellen zu können."
      },
      {
        "h": "Zulässige Nutzung",
        "p": "Nutze WishDrop nicht für illegale, irreführende, beleidigende Inhalte oder Inhalte, die Rechte anderer verletzen. Wir können Konten sperren, die gegen diese Bedingungen verstoßen."
      },
      {
        "h": "Deine Inhalte",
        "p": "Die Inhalte deiner Listen gehören dir. Beachte, dass über einen öffentlichen Link geteilte Listen für jeden mit dem Link sichtbar sind."
      },
      {
        "h": "Spenden",
        "p": "Spenden über den Unterstützungs-Button sind völlig freiwillig und nicht erstattungsfähig. Der Dienst bleibt unabhängig von Spenden kostenlos."
      },
      {
        "h": "Keine Gewährleistung",
        "p": "Der Dienst wird „wie besehen“ ohne Gewährleistung bereitgestellt. Wir bemühen uns um Verfügbarkeit und Sicherheit, können aber keinen ununterbrochenen oder fehlerfreien Betrieb garantieren."
      },
      {
        "h": "Änderungen und Kontakt",
        "p": "Wir können diese Bedingungen aktualisieren; die aktuelle Version steht stets auf dieser Seite. Fragen: {contact@wishdrop.site}."
      }
    ]
  },
  "ru": {
    "title": "Условия использования — WishDrop",
    "description": "Используя WishDrop, вы соглашаетесь с условиями ниже. WishDrop предоставляется Ban Studio (banstudio.dev), Республика Молдова.",
    "h1": "Условия использования",
    "updated": "Последнее обновление: 25 iunie 2026",
    "intro": "Используя WishDrop, вы соглашаетесь с условиями ниже. WishDrop предоставляется Ban Studio (banstudio.dev), Республика Молдова.",
    "sections": [
      {
        "h": "Сервис",
        "p": "WishDrop — бесплатный сервис, позволяющий создавать списки подарков и делиться ими по публичной ссылке. Гости могут бронировать подарки без аккаунта."
      },
      {
        "h": "Ваш аккаунт",
        "p": "Вы несёте ответственность за сохранность данных для входа и за активность в вашем аккаунте. Используйте реальный email, чтобы иметь возможность восстановить доступ."
      },
      {
        "h": "Допустимое использование",
        "p": "Не используйте WishDrop для незаконного, вводящего в заблуждение, оскорбительного контента или контента, нарушающего права других. Мы можем приостановить аккаунты, нарушающие эти условия."
      },
      {
        "h": "Ваш контент",
        "p": "Содержимое ваших списков принадлежит вам. Учтите, что списки, доступные по публичной ссылке, видны всем, у кого есть ссылка."
      },
      {
        "h": "Пожертвования",
        "p": "Пожертвования через кнопку поддержки полностью добровольны и не подлежат возврату. Сервис остаётся бесплатным независимо от пожертвований."
      },
      {
        "h": "Без гарантий",
        "p": "Сервис предоставляется «как есть», без гарантий. Мы стараемся обеспечить доступность и безопасность, но не можем гарантировать бесперебойную или безошибочную работу."
      },
      {
        "h": "Изменения и контакт",
        "p": "Мы можем обновлять эти условия; актуальная версия всегда на этой странице. Вопросы: {contact@wishdrop.site}."
      }
    ]
  }
};

