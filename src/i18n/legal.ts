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
    "updated": "Ultima actualizare: 24 noiembrie 2026",
    "intro": "WishDrop este un serviciu gratuit prin care îți creezi liste de cadouri și le împarți printr-un link public. Respectăm datele tale și colectăm strict minimul necesar pentru funcționarea serviciului.",
    "sections": [
      {
        "h": "Cine suntem",
        "p": "WishDrop este operat de Ban Studio (banstudio.dev), Republica Moldova. Pentru orice întrebare legată de datele tale, ne poți scrie la {contact@wishdrop.site}."
      },
      {
        "h": "Ce date colectăm",
        "list": [
          "Cont: adresa de email și, opțional, numele, numele de utilizator, descrierea, ziua de naștere și poza de profil. Parola este stocată doar criptată (hash), niciodată în text clar.",
          "Conectare cu Google (opțional): primim de la Google numele, adresa de email și poza de profil.",
          "Conținutul listelor: numele listelor, cadourile (preț, link, imagine, prioritate), rezervările, persoanele care se alătură unui cadou de grup și numele pe care aleg să-l afișeze.",
          "Activitate socială: pe cine urmărești și cine te urmărește, reacțiile (❤️, „Și eu vreau”), conturile blocate și notificările.",
          "Notificări pe telefon (opțional): dacă le pornești, păstrăm adresa tehnică oferită de browser pentru a-ți trimite notificări.",
          "Rapoarte: mesajele trimise prin „Raportează o problemă” sau „Raportează”, cu pagina, browserul și, opțional, o captură de ecran.",
          "Tehnice: un cookie de sesiune, un cookie pentru limbă și adresa IP, folosită pe moment pentru protecție împotriva abuzurilor (limitarea încercărilor) și în jurnalele de erori."
        ]
      },
      {
        "h": "Ce văd ceilalți",
        "p": "Profilul tău (nume, nume de utilizator, poză, descriere, ziua de naștere dacă o completezi) e public. Listele apar pe profil după cum alegi: pentru toți, doar pentru urmăritori sau doar prin link. Oricine are linkul unei liste o poate deschide. Proprietarul unei liste vede câte reacții au primit cadourile și, în afara modului surpriză, cine a rezervat sau s-a alăturat cu nume."
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
          "Serviciile de notificări ale browserului (Google, Apple, Mozilla) — doar dacă pornești notificările pe telefon; primesc mesajul criptat.",
          "Trimitem emailuri tranzacționale (confirmare cont, resetare parolă) de la adresa {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookie-uri",
        "p": "Folosim doar cookie-uri esențiale: unul pentru sesiunea ta de autentificare și unul pentru a reține limba aleasă. Nu folosim cookie-uri de publicitate."
      },
      {
        "h": "Cât timp păstrăm datele",
        "list": [
          "Contul, listele și activitatea: până ștergi contul.",
          "Notificările: 90 de zile.",
          "Pozele: o copie de siguranță zilnică, păstrată separat, ca să nu se piardă din greșeală.",
          "Baza de date: copii automate de siguranță pe 30 de zile (Cloudflare).",
          "Rapoartele: cât e nevoie pentru a le rezolva."
        ]
      },
      {
        "h": "Drepturile tale",
        "p": "Poți descărca oricând toate datele tale din Setări → Cont → „Descarcă datele mele” și poți șterge singur contul de acolo, împreună cu tot ce ține de el. Poți corecta datele din Setări. Pentru orice altă cerere, scrie-ne la {contact@wishdrop.site}."
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
    "updated": "Last updated: 24 November 2026",
    "intro": "WishDrop is a free service for creating gift lists and sharing them via a public link. We respect your data and collect only the minimum needed to run the service.",
    "sections": [
      {
        "h": "Who we are",
        "p": "WishDrop is operated by Ban Studio (banstudio.dev), Republic of Moldova. For any question about your data, write to us at {contact@wishdrop.site}."
      },
      {
        "h": "What we collect",
        "list": [
          "Account: your email and, optionally, your name, username, bio, birthday and profile photo. Your password is stored only hashed, never in plain text.",
          "Google sign-in (optional): we receive your name, email and profile picture from Google.",
          "List content: list names, gifts (price, link, image, priority), reservations, the people who join a group gift and the name they choose to show.",
          "Social activity: who you follow and who follows you, reactions (❤️, “I want it too”), blocked accounts and notifications.",
          "Phone notifications (optional): if you turn them on, we keep the technical address your browser gives us to send them.",
          "Reports: messages sent through “Report a problem” or “Report”, with the page, the browser and, optionally, a screenshot.",
          "Technical: a session cookie, a language cookie and your IP address, used briefly to protect against abuse (limiting attempts) and in error logs."
        ]
      },
      {
        "h": "What others see",
        "p": "Your profile (name, username, photo, bio, birthday if you add it) is public. Lists appear on your profile as you choose: for everyone, followers only, or by link only. Anyone with a list's link can open it. A list's owner sees how many reactions the gifts got and, outside surprise mode, who reserved or joined with a name."
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
          "Your browser's push services (Google, Apple, Mozilla) — only if you turn on phone notifications; they receive the message encrypted.",
          "We send transactional emails (account confirmation, password reset) from {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookies",
        "p": "We use only essential cookies: one for your login session and one to remember your chosen language. We do not use advertising cookies."
      },
      {
        "h": "How long we keep data",
        "list": [
          "Account, lists and activity: until you delete your account.",
          "Notifications: 90 days.",
          "Photos: a daily backup copy kept separately, so nothing is lost by mistake.",
          "Database: automatic backups for 30 days (Cloudflare).",
          "Reports: as long as needed to handle them."
        ]
      },
      {
        "h": "Your rights",
        "p": "You can download all your data any time from Settings → Account → “Download my data”, and delete your account there yourself, together with everything in it. You can correct your data in Settings. For any other request, write to {contact@wishdrop.site}."
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
    "updated": "Zuletzt aktualisiert: 24. November 2026",
    "intro": "WishDrop ist ein kostenloser Dienst, mit dem du Geschenklisten erstellst und über einen öffentlichen Link teilst. Wir respektieren deine Daten und erheben nur das Nötigste für den Betrieb des Dienstes.",
    "sections": [
      {
        "h": "Wer wir sind",
        "p": "WishDrop wird von Ban Studio (banstudio.dev), Republik Moldau, betrieben. Bei Fragen zu deinen Daten schreibe uns an {contact@wishdrop.site}."
      },
      {
        "h": "Welche Daten wir erheben",
        "list": [
          "Konto: deine E-Mail und optional Name, Benutzername, Bio, Geburtstag und Profilbild. Dein Passwort wird nur als Hash gespeichert, nie im Klartext.",
          "Anmeldung mit Google (optional): Wir erhalten Name, E-Mail und Profilbild von Google.",
          "Listeninhalte: Listennamen, Geschenke (Preis, Link, Bild, Priorität), Reservierungen, wer bei einem Gruppengeschenk mitmacht und der Name, den diese Personen zeigen.",
          "Soziale Aktivität: wem du folgst und wer dir folgt, Reaktionen (❤️, „Will ich auch“), blockierte Konten und Benachrichtigungen.",
          "Handy-Benachrichtigungen (optional): Wenn du sie einschaltest, speichern wir die technische Adresse, die dein Browser dafür liefert.",
          "Meldungen: Nachrichten über „Problem melden“ oder „Melden“, mit Seite, Browser und optional einem Screenshot.",
          "Technisch: ein Sitzungs-Cookie, ein Sprach-Cookie und deine IP-Adresse, kurzzeitig zum Schutz vor Missbrauch (Begrenzung von Versuchen) und in Fehlerprotokollen."
        ]
      },
      {
        "h": "Was andere sehen",
        "p": "Dein Profil (Name, Benutzername, Foto, Bio, Geburtstag, falls angegeben) ist öffentlich. Listen erscheinen auf deinem Profil wie von dir gewählt: für alle, nur für Follower oder nur per Link. Wer den Link einer Liste hat, kann sie öffnen. Der Besitzer einer Liste sieht, wie viele Reaktionen die Geschenke bekommen haben, und außerhalb des Überraschungsmodus, wer mit Namen reserviert oder mitgemacht hat."
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
          "Die Push-Dienste deines Browsers (Google, Apple, Mozilla) — nur wenn du Handy-Benachrichtigungen einschaltest; sie erhalten die Nachricht verschlüsselt.",
          "Wir senden transaktionale E-Mails (Kontobestätigung, Passwort-Reset) von {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookies",
        "p": "Wir verwenden nur essenzielle Cookies: eines für deine Anmeldesitzung und eines, um deine Sprache zu merken. Keine Werbe-Cookies."
      },
      {
        "h": "Wie lange wir Daten speichern",
        "list": [
          "Konto, Listen und Aktivität: bis du dein Konto löschst.",
          "Benachrichtigungen: 90 Tage.",
          "Fotos: eine tägliche Sicherungskopie, getrennt gespeichert, damit nichts versehentlich verloren geht.",
          "Datenbank: automatische Sicherungen für 30 Tage (Cloudflare).",
          "Meldungen: so lange, wie es zur Bearbeitung nötig ist."
        ]
      },
      {
        "h": "Deine Rechte",
        "p": "Du kannst jederzeit alle deine Daten unter Einstellungen → Konto → „Meine Daten herunterladen“ laden und dein Konto dort selbst löschen, samt allem, was dazugehört. Korrigieren kannst du deine Daten in den Einstellungen. Für alle anderen Anliegen schreib an {contact@wishdrop.site}."
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
    "updated": "Последнее обновление: 24 ноября 2026",
    "intro": "WishDrop — бесплатный сервис для создания списков подарков и обмена ими по публичной ссылке. Мы уважаем ваши данные и собираем только необходимый минимум для работы сервиса.",
    "sections": [
      {
        "h": "Кто мы",
        "p": "WishDrop управляется Ban Studio (banstudio.dev), Республика Молдова. По любым вопросам о ваших данных пишите на {contact@wishdrop.site}."
      },
      {
        "h": "Какие данные мы собираем",
        "list": [
          "Аккаунт: ваш email и, по желанию, имя, имя пользователя, описание, день рождения и фото профиля. Пароль хранится только в виде хеша, никогда в открытом виде.",
          "Вход через Google (необязательно): мы получаем от Google имя, email и фото профиля.",
          "Содержимое списков: названия списков, подарки (цена, ссылка, изображение, приоритет), брони, участники групповых подарков и имя, которое они решили показать.",
          "Социальная активность: на кого вы подписаны и кто подписан на вас, реакции (❤️, «Я тоже хочу»), заблокированные аккаунты и уведомления.",
          "Уведомления на телефоне (необязательно): если вы их включите, мы храним технический адрес, который выдаёт браузер для их отправки.",
          "Жалобы: сообщения через «Сообщить о проблеме» или «Пожаловаться», со страницей, браузером и, по желанию, скриншотом.",
          "Технические: cookie сессии, cookie языка и IP-адрес — кратковременно для защиты от злоупотреблений (ограничение попыток) и в журналах ошибок."
        ]
      },
      {
        "h": "Что видят другие",
        "p": "Ваш профиль (имя, имя пользователя, фото, описание, день рождения, если указан) публичен. Списки появляются в профиле так, как вы выберете: для всех, только для подписчиков или только по ссылке. Любой, у кого есть ссылка на список, может его открыть. Владелец списка видит число реакций на подарки и, вне режима сюрприза, кто забронировал или присоединился под своим именем."
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
          "Push-сервисы вашего браузера (Google, Apple, Mozilla) — только если вы включите уведомления на телефоне; они получают сообщение в зашифрованном виде.",
          "Мы отправляем транзакционные письма (подтверждение аккаунта, сброс пароля) с адреса {noreply@wishdrop.site}."
        ]
      },
      {
        "h": "Cookie-файлы",
        "p": "Мы используем только необходимые cookie: для вашей сессии входа и для запоминания выбранного языка. Рекламных cookie нет."
      },
      {
        "h": "Сколько мы храним данные",
        "list": [
          "Аккаунт, списки и активность: пока вы не удалите аккаунт.",
          "Уведомления: 90 дней.",
          "Фото: ежедневная резервная копия, хранится отдельно, чтобы ничего не потерялось по ошибке.",
          "База данных: автоматические резервные копии на 30 дней (Cloudflare).",
          "Жалобы: столько, сколько нужно для их рассмотрения."
        ]
      },
      {
        "h": "Ваши права",
        "p": "Вы можете в любой момент скачать все свои данные в Настройки → Аккаунт → «Скачать мои данные» и там же сами удалить аккаунт со всем содержимым. Исправить данные можно в настройках. По любым другим вопросам пишите на {contact@wishdrop.site}."
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
    "updated": "Ultima actualizare: 24 noiembrie 2026",
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
        "h": "Profiluri, urmăriri și reacții",
        "p": "Ai un profil public cu numele de utilizator ales. Oricine te poate urmări (sau îți poate cere asta, dacă profilul e privat) și poate reacționa la cadourile tale. Poți bloca oricând pe cineva din profilul lui."
      },
      {
        "h": "Cadouri de grup",
        "p": "La un cadou de grup, WishDrop doar ține evidența cine s-a alăturat. Nu procesăm plăți: banii și cumpărarea cadoului se stabilesc între participanți, iar WishDrop nu răspunde de aceste înțelegeri."
      },
      {
        "h": "Raportări și moderare",
        "p": "Poți raporta un profil, o listă sau o problemă. Putem ascunde liste și suspenda conturi care încalcă acești termeni, de obicei după o raportare. Dacă crezi că e o greșeală, scrie-ne la {contact@wishdrop.site}."
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
    "updated": "Last updated: 24 November 2026",
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
        "h": "Profiles, follows and reactions",
        "p": "You have a public profile with the username you choose. Anyone can follow you (or ask to, if your profile is private) and react to your gifts. You can block anyone from their profile at any time."
      },
      {
        "h": "Group gifts",
        "p": "For a group gift, WishDrop only keeps track of who joined. We don't process payments: money and buying the gift are agreed between the participants, and WishDrop isn't responsible for those arrangements."
      },
      {
        "h": "Reports and moderation",
        "p": "You can report a profile, a list or a problem. We may hide lists and suspend accounts that break these terms, usually after a report. If you think it's a mistake, write to {contact@wishdrop.site}."
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
    "updated": "Zuletzt aktualisiert: 24. November 2026",
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
        "h": "Profile, Follows und Reaktionen",
        "p": "Du hast ein öffentliches Profil mit dem Benutzernamen deiner Wahl. Jeder kann dir folgen (oder bei privatem Profil anfragen) und auf deine Geschenke reagieren. Du kannst jederzeit jemanden in seinem Profil blockieren."
      },
      {
        "h": "Gruppengeschenke",
        "p": "Bei einem Gruppengeschenk merkt sich WishDrop nur, wer mitmacht. Wir wickeln keine Zahlungen ab: Geld und Kauf des Geschenks regeln die Beteiligten untereinander, WishDrop haftet nicht für diese Absprachen."
      },
      {
        "h": "Meldungen und Moderation",
        "p": "Du kannst ein Profil, eine Liste oder ein Problem melden. Wir können Listen ausblenden und Konten sperren, die gegen diese Bedingungen verstoßen, meist nach einer Meldung. Hältst du das für einen Fehler, schreib an {contact@wishdrop.site}."
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
    "updated": "Последнее обновление: 24 ноября 2026",
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
        "h": "Профили, подписки и реакции",
        "p": "У вас есть публичный профиль с выбранным именем пользователя. Любой может подписаться на вас (или отправить запрос, если профиль закрыт) и реагировать на ваши подарки. Вы можете в любой момент заблокировать человека в его профиле."
      },
      {
        "h": "Групповые подарки",
        "p": "В групповом подарке WishDrop лишь отмечает, кто присоединился. Мы не обрабатываем платежи: деньги и покупку подарка участники согласовывают между собой, и WishDrop не отвечает за эти договорённости."
      },
      {
        "h": "Жалобы и модерация",
        "p": "Вы можете пожаловаться на профиль, список или сообщить о проблеме. Мы можем скрывать списки и блокировать аккаунты, нарушающие эти условия, обычно после жалобы. Если считаете это ошибкой, напишите на {contact@wishdrop.site}."
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

