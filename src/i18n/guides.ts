/**
 * Gift guides: SEO landing pages with gift ideas per occasion.
 * One entry per occasion and language, plus the hub page texts.
 */
import type { Lang } from "@/lib/i18n";

export type GuideKey = "christmas" | "wedding" | "birthday" | "baby";

export interface GuideDoc {
  key: GuideKey;
  /** URL slug for this language: lowercase ASCII, words joined by "-", no diacritics. */
  slug: string;
  /** <title>, max 60 characters, ends with " — WishDrop". */
  title: string;
  /** Meta description, 120–155 characters. */
  description: string;
  h1: string;
  /** 2–3 sentences. */
  intro: string;
  sections: { h: string; p?: string; ideas?: { name: string; text: string }[] }[];
  faq: { q: string; a: string }[];
  /** Call-to-action button text, e.g. "Creează lista de Crăciun". */
  cta: string;
}

export const guides: Record<Lang, GuideDoc[]> = {
  /* ───────────────────────────── Română ───────────────────────────── */
  ro: [
    {
      key: "christmas",
      slug: "idei-cadouri-craciun",
      title: "Idei de cadouri de Crăciun și listă online — WishDrop",
      description:
        "Idei de cadouri de Crăciun pentru toată familia și o listă online gratuită: prietenii rezervă darurile, ca nimeni să nu cumpere același lucru.",
      h1: "Idei de cadouri de Crăciun și lista ta de dorințe",
      intro:
        "De Crăciun toată lumea întreabă același lucru: „Ce să-ți iau?”. O listă de dorințe răspunde o singură dată, pentru toți. Mai jos găsești idei pe categorii și cum îți faci lista în câteva minute.",
      sections: [
        {
          h: "Idei de cadouri pentru ea și pentru el",
          ideas: [
            { name: "Pijamale sau halat călduros", text: "Un cadou de iarnă sigur, mai ales dacă notezi mărimea exactă în listă." },
            { name: "Parfum sau set de îngrijire", text: "Pune linkul spre varianta exactă, ca să nu primești o aromă care nu-ți place." },
            { name: "Căști wireless", text: "Utile zilnic, la drum, la sală sau la birou." },
            { name: "Carte sau abonament la e-book", text: "Scrie titlul sau autorul preferat, ca darul să fie pe gustul tău." },
            { name: "Mănuși și fular din lână", text: "Practice în ianuarie și ușor de ales dacă precizezi culoarea." },
            { name: "Portofel sau curea din piele", text: "Un cadou clasic care durează ani de zile." },
            { name: "Bilet la concert sau teatru", text: "O experiență în locul unui obiect, numai bună pentru o seară în doi." },
            { name: "Ceas sau brățară smart", text: "Un cadou mai scump, potrivit pentru un cadou de grup." },
          ],
        },
        {
          h: "Cadouri sub 100 de lei",
          ideas: [
            { name: "Cană personalizată", text: "Un dar mic, dar personal, pentru colegi sau prieteni." },
            { name: "Lumânare parfumată", text: "Face casa mai caldă în serile lungi de iarnă." },
            { name: "Joc de cărți sau puzzle", text: "Bun pentru serile în familie dintre Crăciun și Revelion." },
            { name: "Șosete amuzante de iarnă", text: "Un cadou mic care se poartă cu plăcere." },
            { name: "Ceai sau cafea de specialitate", text: "Notează ce aromă preferi, boabe sau măcinată." },
            { name: "Agendă pentru noul an", text: "Practică pentru oricine își face planuri în ianuarie." },
            { name: "Ornament de brad handmade", text: "O amintire pe care o scoți din cutie în fiecare decembrie." },
          ],
        },
        {
          h: "Pentru casă și pentru copii",
          ideas: [
            { name: "Pătură moale", text: "Cadoul perfect pentru filmele de Crăciun pe canapea." },
            { name: "Set de vin fiert sau ceainic", text: "Pentru serile cu prieteni și mirosul de scorțișoară." },
            { name: "Formă de cozonac sau tavă de prăjituri", text: "Pentru cei care fac cozonacul în casă." },
            { name: "Set LEGO sau joc de construcție", text: "Scrie numărul setului, ca Moș Crăciun să nu greșească." },
            { name: "Sanie sau patine", text: "Un cadou mai mare, potrivit de luat împreună de mai multe rude." },
            { name: "Cărți ilustrate pentru copii", text: "Notează vârsta copilului și ce cărți are deja." },
          ],
        },
        {
          h: "Cum faci lista de Crăciun cu WishDrop",
          p: "1. Creează o listă gratuită și pune data de 25 decembrie, ca invitații să vadă numărătoarea inversă. 2. Adaugă cadourile cu poză, preț aproximativ și link spre magazin; marchează-le pe cele mai dorite. 3. Trimite un singur link pe WhatsApp sau în grupul familiei. 4. Rudele rezervă ce vor să cumpere, iar ceilalți văd imediat ce a fost deja ales.",
        },
        {
          h: "Sfaturi pentru o listă de Crăciun reușită",
          p: "Pune cadouri la prețuri diferite, ca fiecare să găsească ceva pe buzunarul lui. Activează modul surpriză dacă vrei să nu știi cine ce ți-a luat. Pentru un cadou scump, folosește cadoul de grup: mai mulți prieteni se înscriu și îl iau împreună, iar banii îi strângeți între voi. Fă câte o listă și pentru copii, ca bunicii și nașii să nu cumpere aceeași jucărie.",
        },
      ],
      faq: [
        {
          q: "Cum fac o listă de Crăciun online?",
          a: "Îți faci cont gratuit pe WishDrop, creezi o listă, adaugi cadourile cu poză și link, apoi trimiți linkul familiei și prietenilor.",
        },
        {
          q: "Este gratuit?",
          a: "Da. Crearea listelor și rezervarea cadourilor sunt gratuite, iar cei care rezervă nu au nevoie de cont.",
        },
        {
          q: "Pot vedea cine a rezervat un cadou?",
          a: "Depinde de tine. În modul surpriză nu vezi cine a rezervat ce, ca să rămână o surpriză până deschizi cadourile.",
        },
        {
          q: "Pot face o listă separată pentru copii?",
          a: "Da, poți avea mai multe liste, de exemplu câte una pentru fiecare copil, fiecare cu linkul ei.",
        },
      ],
      cta: "Creează lista de Crăciun",
    },
    {
      key: "wedding",
      slug: "lista-de-nunta-online",
      title: "Listă de nuntă online gratuită — WishDrop",
      description:
        "Fă o listă de nuntă online gratuită: adaugi cadourile dorite, trimiți un singur link, iar invitații rezervă darurile fără dubluri.",
      h1: "Lista de nuntă online, simplu și fără dubluri",
      intro:
        "O listă de nuntă îi scapă pe invitați de ghicit și pe voi de trei prăjitoare de pâine. Puneți ce vă trebuie cu adevărat pentru casa nouă, trimiteți un link și gata. Invitații rezervă darul cu un cont gratuit, în câteva secunde.",
      sections: [
        {
          h: "Idei pentru casa nouă",
          ideas: [
            { name: "Set de vase și tigăi", text: "Baza unei bucătării noi, de ales după tipul de plită." },
            { name: "Robot de bucătărie", text: "Un cadou mare, potrivit pentru un cadou de grup între prieteni." },
            { name: "Espressor sau cafetieră", text: "Pentru cafeaua de dimineață în doi, zi de zi." },
            { name: "Lenjerii de pat de calitate", text: "Notați mărimea patului, ca să nu fie nevoie de schimb." },
            { name: "Set de pahare și farfurii", text: "Util pentru primele mese cu prietenii în casa nouă." },
            { name: "Aspirator robot", text: "Un ajutor real în casă și un cadou pe care îl folosiți zilnic." },
            { name: "Set de prosoape", text: "Practic și ușor de ales dacă precizați culoarea dorită." },
            { name: "Plante și ghivece", text: "Fac casa să pară locuită din prima săptămână." },
          ],
        },
        {
          h: "Experiențe și cadouri mai mari",
          ideas: [
            { name: "Contribuție la luna de miere", text: "Treceți-o ca un cadou de grup: prietenii se înscriu, iar banii îi strâng între ei." },
            { name: "Cină într-un restaurant bun", text: "O seară doar pentru voi după agitația nunții." },
            { name: "Weekend la munte sau la mare", text: "Un cadou de amintire, frumos de oferit de nași sau de colegi." },
            { name: "Ședință foto după nuntă", text: "Pentru cei care vor poze relaxate, fără program strâns." },
            { name: "Curs de gătit în doi", text: "O experiență distractivă și utilă pentru primul an împreună." },
            { name: "Bilete la un festival", text: "Pentru cuplurile care vor să sărbătorească și în vara următoare." },
          ],
        },
        {
          h: "Cum faceți lista de nuntă cu WishDrop",
          p: "1. Creați lista și puneți data nunții, ca invitații să vadă câte zile au rămas. 2. Adăugați cadourile cu poză, preț aproximativ și link spre magazin. 3. Marcați ca „cel mai dorit” ce contează cel mai mult și transformați obiectele scumpe în cadouri de grup. 4. Trimiteți linkul sau puneți codul QR pe invitația tipărită.",
        },
        {
          h: "Cum trimiteți lista fără să păreți insistenți",
          p: "La noi, darul de nuntă e de multe ori în plic, și e în regulă. Lista e pentru cei care preferă să aleagă un obiect: invitați la cununia civilă, colegi, prieteni care nu ajung la petrecere. Nu scrieți pe invitație „vrem doar cadouri de pe listă”. Mai bine un rând scurt, de tipul „Dacă vreți să ne faceți un cadou, aici găsiți câteva idei”, cu codul QR alături. Puneți cadouri la mai multe prețuri, ca nimeni să nu se simtă presat.",
        },
      ],
      faq: [
        {
          q: "Cum fac o listă de nuntă online?",
          a: "Creați o listă gratuită pe WishDrop, adăugați cadourile cu poză și link, apoi trimiteți linkul invitaților sau tipăriți codul QR pe invitații.",
        },
        {
          q: "Este gratuit?",
          a: "Da, WishDrop e gratuit pentru voi și pentru invitați. Lista o poate vedea oricine, iar pentru rezervare invitații își fac un cont gratuit.",
        },
        {
          q: "Putem vedea cine a rezervat fiecare cadou?",
          a: "În modul surpriză nu vedeți cine a rezervat ce. Vedeți doar că un cadou a fost ales, ca să nu-l mai cumpere altcineva.",
        },
        {
          q: "Se mai face listă de nuntă dacă invitații dau bani?",
          a: "Da, ca o opțiune în plus. Unii invitați preferă un obiect, iar lista îi ajută să aleagă ceva util și să nu se dubleze.",
        },
      ],
      cta: "Creează lista de nuntă",
    },
    {
      key: "birthday",
      slug: "lista-cadouri-zi-de-nastere",
      title: "Listă de cadouri pentru ziua de naștere — WishDrop",
      description:
        "Fă-ți lista de cadouri pentru ziua de naștere: idei pentru copii și adulți, un singur link de trimis, iar prietenii rezervă fără să se dubleze.",
      h1: "Lista de cadouri pentru ziua de naștere",
      intro:
        "Ziua ta, cadourile tale. Cu o listă de dorințe, prietenii nu mai ghicesc, iar tu nu mai primești două boxe identice. Găsești mai jos idei pentru copii și adulți și cum faci lista.",
      sections: [
        {
          h: "Idei pentru adulți",
          ideas: [
            { name: "Cărți din lista ta „de citit”", text: "Scrie titlurile exacte, ca să nu primești ce ai deja." },
            { name: "Boxă portabilă", text: "Pentru grătare, drumeții și seri pe balcon." },
            { name: "Abonament la sală sau la yoga", text: "Un cadou care te ajută să-ți ții promisiunile." },
            { name: "Rucsac de oraș sau de drumeție", text: "Pune linkul spre modelul și culoarea dorite." },
            { name: "Voucher la un spa", text: "O zi de relaxare, potrivită pentru un cadou de grup." },
            { name: "Set de pictură sau hobby nou", text: "Pentru cine vrea să încerce ceva diferit anul acesta." },
            { name: "Cameră instant", text: "Pozele printate pe loc fac orice petrecere mai veselă." },
          ],
        },
        {
          h: "Idei pentru copii",
          ideas: [
            { name: "Set de construcție", text: "Notează vârsta și seria preferată a copilului." },
            { name: "Bicicletă sau trotinetă", text: "Un cadou mare, bun de luat împreună de mai mulți părinți." },
            { name: "Joc de societate pentru copii", text: "Pentru serile în familie, fără ecrane." },
            { name: "Kit de experimente", text: "Pentru copiii curioși care vor să știe cum funcționează lucrurile." },
            { name: "Cărți pe vârsta lui", text: "Scrie ce cărți are deja, ca să nu se repete." },
            { name: "Costum de super-erou sau prințesă", text: "Precizează mărimea, copiii cresc repede." },
            { name: "Set de desen și pictură", text: "Un cadou sub 100 de lei pe care copiii îl folosesc des." },
          ],
        },
        {
          h: "Cum faci lista cu WishDrop",
          p: "1. Creează o listă gratuită și setează data zilei de naștere, cu numărătoare inversă. 2. Adaugă cadourile cu poză, preț și link spre magazin. 3. Marchează ce îți dorești cel mai mult. 4. Trimite linkul pe WhatsApp sau pune imaginea de partajare în Instagram Stories.",
        },
        {
          h: "Sfaturi pentru petrecerile copiilor",
          p: "La aniversările copiilor vin des colegi de grădiniță sau de școală, iar părinții nu se cunosc între ei. Un link trimis în grupul clasei rezolvă totul: fiecare rezervă un cadou și ceilalți văd ce a rămas. Pune idei mici și câteva mai mari ca cadouri de grup. Nu e nevoie de cont pentru cei care rezervă, deci nimeni nu trebuie să instaleze nimic.",
        },
      ],
      faq: [
        {
          q: "Cum fac o listă de dorințe pentru ziua mea?",
          a: "Creezi o listă pe WishDrop, adaugi cadourile cu poză și link, apoi trimiți linkul prietenilor.",
        },
        {
          q: "Este gratuit?",
          a: "Da, crearea listei și rezervarea cadourilor sunt gratuite.",
        },
        {
          q: "Pot vedea cine a rezervat un cadou?",
          a: "Dacă activezi modul surpriză, nu vezi cine ce a rezervat. Prietenii văd însă ce e deja luat, ca să nu se dubleze.",
        },
        {
          q: "Trebuie prietenii să-și facă cont?",
          a: "Ca să vadă lista, nu. Ca să rezerve un cadou, da: un cont gratuit, făcut într-un minut. Așa știi sigur cine ce a rezervat.",
        },
      ],
      cta: "Creează lista de ziua ta",
    },
    {
      key: "baby",
      slug: "lista-cadouri-botez",
      title: "Listă de cadouri pentru botez și bebeluș — WishDrop",
      description:
        "Listă de cadouri pentru botez și pentru bebeluș: idei utile pentru primele luni, un singur link pentru nași și rude, fără cadouri duble.",
      h1: "Lista de cadouri pentru botez și pentru bebeluș",
      intro:
        "Când vine un bebeluș, toată lumea vrea să ajute, dar puțini știu ce vă trebuie de fapt. O listă de cadouri vă scutește de zece zornăitoare și vă aduce ce folosiți zilnic. Iată idei verificate de părinți și cum faceți lista.",
      sections: [
        {
          h: "Esențiale pentru primele luni",
          ideas: [
            { name: "Body-uri în mărimi mai mari", text: "Cereți 3–6 sau 6–12 luni, cele pentru nou-născut rămân mici repede." },
            { name: "Scutece și șervețele umede", text: "Se termină mereu, deci nu greșește nimeni cu ele." },
            { name: "Sac de dormit pentru bebeluși", text: "Mai sigur decât pătura și ușor de folosit noaptea." },
            { name: "Cada de baie și prosoape cu glugă", text: "Utile din prima săptămână acasă." },
            { name: "Monitor pentru bebeluși", text: "Vă lasă să dormiți liniștiți în camera de alături." },
            { name: "Sistem de purtare (marsupiu sau wrap)", text: "Mâini libere și un bebeluș liniștit lângă voi." },
            { name: "Sterilizator și biberoane", text: "Notați marca preferată, ca tetinele să se potrivească." },
          ],
        },
        {
          h: "Cadouri mari, de luat împreună",
          ideas: [
            { name: "Cărucior", text: "Cel mai scump obiect de pe listă, ideal ca un cadou de grup." },
            { name: "Scaun auto", text: "Obligatoriu la ieșirea din maternitate, deci bun de primit din timp." },
            { name: "Pătuț sau pătuț co-sleeper", text: "Puneți linkul spre modelul ales, ca să se potrivească în cameră." },
            { name: "Scaun de masă", text: "Va fi nevoie de el pe la șase luni, la diversificare." },
            { name: "Comodă cu masă de înfășat", text: "Vă scutește spatele la zecile de schimbări pe zi." },
            { name: "Album sau ramă pentru amintiri", text: "Un cadou de suflet pentru nași sau bunici." },
          ],
        },
        {
          h: "Cum faceți lista cu WishDrop",
          p: "1. Creați lista și puneți data botezului sau data estimată a nașterii. 2. Adăugați produsele cu poză, preț și link spre magazin. 3. Marcați lucrurile mari ca cadouri de grup, ca rudele să se înscrie împreună. 4. Trimiteți linkul sau tipăriți codul QR pe invitația de botez.",
        },
        {
          h: "Ce le trebuie de fapt părinților",
          p: "Nașii se ocupă de obicei de trusoul de botez și de lumânare, deci lista poate acoperi restul. Hainele mici sunt drăguțe, dar bebelușul le poartă doar câteva săptămâni. Mai utile sunt consumabilele, obiectele mari și lucrurile care vă ușurează nopțile. Scrieți pe listă și lucruri pentru mamă, de exemplu o pernă de alăptare sau o cină gătită de prieteni. Iar dacă vreți să nu știți cine a luat ce, activați modul surpriză.",
        },
      ],
      faq: [
        {
          q: "Cum fac o listă de cadouri pentru botez?",
          a: "Creați o listă gratuită pe WishDrop, adăugați produsele de care aveți nevoie și trimiteți linkul nașilor, rudelor și prietenilor.",
        },
        {
          q: "Este gratuit?",
          a: "Da. Lista e gratuită, iar invitații rezervă cadourile cu un cont gratuit.",
        },
        {
          q: "Pot vedea cine a rezervat?",
          a: "În modul surpriză nu vedeți cine a rezervat ce. Fără modul surpriză, vedeți rezervările pe listă.",
        },
        {
          q: "Ce cadou se face la botez?",
          a: "Nașii aduc de obicei trusoul și lumânarea, iar ceilalți invitați dau bani sau un cadou util. O listă îi ajută să aleagă ce vă trebuie.",
        },
      ],
      cta: "Creează lista pentru bebeluș",
    },
  ],

  /* ───────────────────────────── English ───────────────────────────── */
  en: [
    {
      key: "christmas",
      slug: "christmas-gift-ideas",
      title: "Christmas Gift Ideas and Wish List — WishDrop",
      description:
        "Christmas gift ideas for the whole family, plus a free online wish list. Friends reserve gifts with one link, so nobody buys the same thing twice.",
      h1: "Christmas gift ideas and a wish list that works",
      intro:
        "Every December the same question comes up: “What do you want for Christmas?” A wish list answers it once, for everyone. Here are ideas by category and how to set up your list in a few minutes.",
      sections: [
        {
          h: "Gift ideas for her and for him",
          ideas: [
            { name: "Cozy pajamas or a robe", text: "A safe winter pick, especially if your list says the exact size." },
            { name: "Perfume or a skincare set", text: "Link the exact one so you don't end up with a scent you won't wear." },
            { name: "Wireless headphones", text: "Used every day, on the commute, at the gym or at work." },
            { name: "A book from your reading list", text: "Add the title or the author, so the gift is really yours." },
            { name: "Wool gloves and scarf", text: "Practical in January and easy to get right if you name the color." },
            { name: "Leather wallet or belt", text: "A classic that lasts for years." },
            { name: "Concert or theater tickets", text: "An experience instead of another thing on the shelf." },
            { name: "Smartwatch", text: "A bigger gift that works well as a group gift." },
          ],
        },
        {
          h: "Affordable gifts and stocking stuffers",
          ideas: [
            { name: "Personalized mug", text: "Small but personal, great for coworkers and friends." },
            { name: "Scented candle", text: "Makes long winter evenings feel warmer." },
            { name: "Card game or puzzle", text: "Perfect for the slow days between Christmas and New Year." },
            { name: "Fun winter socks", text: "A tiny gift people actually wear." },
            { name: "Specialty tea or coffee", text: "Say whether you want beans or ground." },
            { name: "Planner for the new year", text: "Handy for anyone who starts January with big plans." },
            { name: "Handmade tree ornament", text: "A keepsake you unpack every December." },
          ],
        },
        {
          h: "For the home and for kids",
          ideas: [
            { name: "Soft throw blanket", text: "Made for Christmas movies on the couch." },
            { name: "Mulled wine set or teapot", text: "For evenings with friends and a house that smells of cinnamon." },
            { name: "Baking pans and cookie cutters", text: "For the ones who bake every holiday." },
            { name: "LEGO or building set", text: "Add the set number so Santa doesn't get it wrong." },
            { name: "Sled or ice skates", text: "A bigger gift that relatives can share." },
            { name: "Picture books", text: "Note the child's age and which books they already have." },
          ],
        },
        {
          h: "How to make your Christmas list on WishDrop",
          p: "1. Create a free list and set the date to December 25 so everyone sees the countdown. 2. Add gifts with a photo, an approximate price and a link to the shop, and mark your favorites as most wanted. 3. Share one link in the family group chat. 4. Relatives reserve what they plan to buy, and everyone else sees it's taken.",
        },
        {
          h: "Tips for a good Christmas list",
          p: "Mix price ranges so everyone finds something that fits their budget. Turn on surprise mode if you'd rather not know who's getting you what. For a pricey item, use a group gift: friends join and split the cost among themselves. Make a separate list for each kid so grandparents don't buy the same toy.",
        },
      ],
      faq: [
        {
          q: "How do I make a Christmas wish list online?",
          a: "Sign up for free on WishDrop, create a list, add gifts with photos and links, then share the link with family and friends.",
        },
        {
          q: "Is it free?",
          a: "Yes. Creating lists and reserving gifts is free, and people who reserve don't need an account.",
        },
        {
          q: "Can I see who reserved a gift?",
          a: "That's up to you. In surprise mode you won't see who reserved what, so the gifts stay a surprise until you open them.",
        },
        {
          q: "Can I make separate lists for my kids?",
          a: "Yes, you can have several lists, for example one per child, each with its own link.",
        },
      ],
      cta: "Create your Christmas list",
    },
    {
      key: "wedding",
      slug: "wedding-registry-online",
      title: "Free Online Wedding Registry — WishDrop",
      description:
        "Make a free online wedding registry: add the gifts you want from any shop, share one link, and guests reserve gifts with no duplicates.",
      h1: "A free online wedding registry, from any shop",
      intro:
        "A wedding registry saves your guests from guessing and saves you from three identical toasters. Add what you actually need for your new home, from any shop, and share one link. Guests reserve a gift with a free account in seconds.",
      sections: [
        {
          h: "Ideas for your new home",
          ideas: [
            { name: "Cookware set", text: "The base of a new kitchen; pick one that suits your stove." },
            { name: "Stand mixer or food processor", text: "A big-ticket item that friends can share as a group gift." },
            { name: "Espresso machine", text: "For coffee together every morning." },
            { name: "Good bed linen", text: "Add the bed size so nothing needs exchanging." },
            { name: "Dinnerware and glasses", text: "Ready for the first dinners with friends at your place." },
            { name: "Robot vacuum", text: "A real help at home that you'll use every day." },
            { name: "Towel set", text: "Practical and easy to get right if you name the color." },
            { name: "Plants and planters", text: "Make a new place feel like home in the first week." },
          ],
        },
        {
          h: "Experiences and bigger gifts",
          ideas: [
            { name: "Honeymoon fund", text: "Add it as a group gift: friends join, and they sort the money out between themselves." },
            { name: "Dinner at a great restaurant", text: "An evening just for you two after the wedding rush." },
            { name: "Weekend getaway", text: "A memory to keep, nice from a group of colleagues." },
            { name: "Post-wedding photo shoot", text: "For couples who want relaxed photos without a tight schedule." },
            { name: "Cooking class for two", text: "Fun and useful for your first year together." },
            { name: "Festival tickets", text: "For couples who want to keep celebrating next summer." },
          ],
        },
        {
          h: "How to set up your registry on WishDrop",
          p: "1. Create a list and add your wedding date so guests see the countdown. 2. Add gifts with a photo, an approximate price and a link to any shop. 3. Mark what matters most as most wanted, and turn expensive items into group gifts. 4. Share the link, or print the QR code on your invitations.",
        },
        {
          h: "How to share your registry without sounding pushy",
          p: "Don't put “gifts from the registry only” on the invitation. A short line works better: “If you'd like to give us something, here are a few ideas,” with the QR code next to it. Many guests will ask you directly, so keep the link handy. Include gifts at different prices so no one feels pressured, and remember that some guests will prefer to give money, which is fine too.",
        },
      ],
      faq: [
        {
          q: "How do I make a wedding registry online?",
          a: "Create a free list on WishDrop, add gifts with photos and links from any shop, then share the link or print the QR code on your invitations.",
        },
        {
          q: "Is it free?",
          a: "Yes, WishDrop is free for you and your guests. Anyone can view the list, and guests reserve with a free account.",
        },
        {
          q: "Can we see who reserved each gift?",
          a: "In surprise mode you won't see who reserved what. You only see that a gift is taken, so nobody buys it twice.",
        },
        {
          q: "Does WishDrop handle payments or shipping?",
          a: "No. Guests buy the gift wherever they like. WishDrop keeps track of who reserved what, and who joined a group gift.",
        },
      ],
      cta: "Create your wedding registry",
    },
    {
      key: "birthday",
      slug: "birthday-wish-list",
      title: "Birthday Wish List and Gift Ideas — WishDrop",
      description:
        "Make a birthday wish list in minutes: gift ideas for kids and adults, one link to share, and friends reserve gifts so nobody brings the same thing.",
      h1: "Your birthday wish list",
      intro:
        "Your birthday, your gifts. With a wish list, friends stop guessing and you stop getting two of the same speaker. Below are ideas for kids and adults and a quick way to set up your list.",
      sections: [
        {
          h: "Ideas for adults",
          ideas: [
            { name: "Books from your to-read pile", text: "List the exact titles so you don't get ones you already own." },
            { name: "Portable speaker", text: "For barbecues, hikes and evenings on the balcony." },
            { name: "Gym or yoga membership", text: "A gift that helps you keep your resolutions." },
            { name: "Everyday or hiking backpack", text: "Link the model and color you want." },
            { name: "Spa voucher", text: "A day off for real, ideal as a group gift." },
            { name: "Starter kit for a new hobby", text: "For anyone who wants to try something new this year." },
            { name: "Instant camera", text: "Printed photos on the spot make any party better." },
          ],
        },
        {
          h: "Ideas for kids",
          ideas: [
            { name: "Building set", text: "Note the child's age and favorite series." },
            { name: "Bike or scooter", text: "A big gift that several parents can share." },
            { name: "Kids' board game", text: "For screen-free family evenings." },
            { name: "Science kit", text: "For curious kids who want to know how things work." },
            { name: "Age-appropriate books", text: "Write down what they already have to avoid repeats." },
            { name: "Dress-up costume", text: "Add the size, kids grow fast." },
            { name: "Art and craft set", text: "An affordable gift that gets used a lot." },
          ],
        },
        {
          h: "How to make your list on WishDrop",
          p: "1. Create a free list and set your birthday as the event date to get a countdown. 2. Add gifts with a photo, a price and a link to the shop. 3. Mark what you want most. 4. Share the link in a chat, or post the share image to your Instagram Stories.",
        },
        {
          h: "Tips for kids' birthday parties",
          p: "Kids' parties often bring together classmates whose parents don't know each other. One link in the class group chat fixes that: each parent reserves a gift and everyone sees what's left. Add a few small ideas and one or two bigger ones as group gifts. Nobody needs an account to reserve, so no one has to install anything.",
        },
      ],
      faq: [
        {
          q: "How do I make a birthday wish list?",
          a: "Create a list on WishDrop, add gifts with photos and links, then send the link to your friends.",
        },
        {
          q: "Is it free?",
          a: "Yes, creating a list and reserving gifts is free.",
        },
        {
          q: "Can I see who reserved a gift?",
          a: "With surprise mode on, you won't see who reserved what. Your friends still see what's taken, so there are no duplicates.",
        },
        {
          q: "Do my friends need an account?",
          a: "To view the list, no. To reserve a gift, yes: a free account that takes a minute. This way you know exactly who reserved what.",
        },
      ],
      cta: "Create your birthday list",
    },
    {
      key: "baby",
      slug: "baby-shower-registry",
      title: "Baby Shower Registry and Gift Ideas — WishDrop",
      description:
        "Create a free baby shower registry: useful gift ideas for the first months, one link for family and friends, and no duplicate gifts.",
      h1: "A baby shower registry with what you really need",
      intro:
        "When a baby is on the way, everyone wants to help, but few people know what you actually need. A registry spares you ten rattles and brings the things you'll use every day. Here are parent-tested ideas and how to set up your list.",
      sections: [
        {
          h: "Essentials for the first months",
          ideas: [
            { name: "Bodysuits in bigger sizes", text: "Ask for 3–6 or 6–12 months; newborn sizes are outgrown fast." },
            { name: "Diapers and wipes", text: "You'll always run out, so nobody gets these wrong." },
            { name: "Baby sleeping bag", text: "Safer than a loose blanket and easy at night." },
            { name: "Baby bath and hooded towels", text: "Useful from the first week home." },
            { name: "Baby monitor", text: "Lets you rest in the next room with peace of mind." },
            { name: "Baby carrier or wrap", text: "Hands free, with a calm baby close to you." },
            { name: "Bottles and a sterilizer", text: "Name your preferred brand so the nipples fit." },
          ],
        },
        {
          h: "Big items to give together",
          ideas: [
            { name: "Stroller", text: "Usually the priciest item on the list, perfect as a group gift." },
            { name: "Car seat", text: "Needed for the ride home from the hospital, so it's good to have early." },
            { name: "Crib or bedside sleeper", text: "Link the exact model so it fits the room." },
            { name: "High chair", text: "You'll need it around six months, when solids start." },
            { name: "Dresser with changing top", text: "Saves your back during dozens of changes a day." },
            { name: "Memory book or photo frame", text: "A heartfelt gift from grandparents." },
          ],
        },
        {
          h: "How to make your registry on WishDrop",
          p: "1. Create a list and add the shower date or the due date. 2. Add items with a photo, a price and a link to the shop. 3. Mark big items as group gifts so relatives can chip in together. 4. Share the link, or print the QR code on your shower invitations.",
        },
        {
          h: "What new parents really need",
          p: "Tiny outfits are cute, but a baby wears them for a few weeks. Consumables, big items and things that make nights easier are more useful. Add something for the parents too, like a nursing pillow or a few home-cooked meals from friends. And if you'd rather not know who's bringing what, turn on surprise mode.",
        },
      ],
      faq: [
        {
          q: "How do I make a baby shower registry?",
          a: "Create a free list on WishDrop, add the items you need from any shop, and share the link with family and friends.",
        },
        {
          q: "Is it free?",
          a: "Yes. The list is free, and guests reserve gifts with a free account.",
        },
        {
          q: "Can I see who reserved what?",
          a: "In surprise mode you won't see who reserved what. Without it, you can see the reservations on your list.",
        },
        {
          q: "When should I share the registry?",
          a: "Usually a few weeks before the shower, together with the invitation. Guests then have time to choose and order.",
        },
      ],
      cta: "Create your baby registry",
    },
  ],

  /* ───────────────────────────── Deutsch ───────────────────────────── */
  de: [
    {
      key: "christmas",
      slug: "geschenkideen-weihnachten",
      title: "Geschenkideen Weihnachten und Wunschliste — WishDrop",
      description:
        "Geschenkideen zu Weihnachten für die ganze Familie und eine kostenlose Wunschliste: Freunde reservieren Geschenke, damit nichts doppelt kommt.",
      h1: "Geschenkideen zu Weihnachten und deine Wunschliste",
      intro:
        "Jedes Jahr dieselbe Frage: „Was wünschst du dir zu Weihnachten?“ Eine Wunschliste beantwortet sie einmal, für alle. Hier findest du Ideen nach Kategorien und wie du deine Liste in wenigen Minuten anlegst.",
      sections: [
        {
          h: "Geschenkideen für sie und für ihn",
          ideas: [
            { name: "Kuscheliger Schlafanzug oder Bademantel", text: "Ein sicheres Wintergeschenk, wenn die Größe auf der Liste steht." },
            { name: "Parfum oder Pflegeset", text: "Verlinke genau das richtige, damit kein falscher Duft kommt." },
            { name: "Kabellose Kopfhörer", text: "Täglich im Einsatz, unterwegs, beim Sport oder im Büro." },
            { name: "Buch von der Leseliste", text: "Titel oder Lieblingsautor notieren, dann passt es." },
            { name: "Handschuhe und Schal aus Wolle", text: "Praktisch im Januar und leicht zu treffen, wenn die Farbe dabeisteht." },
            { name: "Lederportemonnaie oder Gürtel", text: "Ein Klassiker, der Jahre hält." },
            { name: "Konzert- oder Theaterkarten", text: "Ein Erlebnis statt noch eines Gegenstands im Regal." },
            { name: "Smartwatch", text: "Ein größeres Geschenk, gut geeignet als Gruppengeschenk." },
          ],
        },
        {
          h: "Kleine Geschenke unter 20 Euro",
          ideas: [
            { name: "Persönliche Tasse", text: "Klein, aber persönlich, ideal für Kollegen und Freunde." },
            { name: "Duftkerze", text: "Macht lange Winterabende gemütlicher." },
            { name: "Kartenspiel oder Puzzle", text: "Perfekt für die ruhigen Tage zwischen den Jahren." },
            { name: "Lustige Wintersocken", text: "Ein kleines Geschenk, das wirklich getragen wird." },
            { name: "Besonderer Tee oder Kaffee", text: "Dazuschreiben, ob Bohnen oder gemahlen." },
            { name: "Kalender für das neue Jahr", text: "Praktisch für alle, die im Januar Pläne schmieden." },
            { name: "Handgemachter Christbaumschmuck", text: "Eine Erinnerung, die jedes Jahr wieder an den Baum kommt." },
          ],
        },
        {
          h: "Für Zuhause und für Kinder",
          ideas: [
            { name: "Weiche Kuscheldecke", text: "Wie gemacht für Weihnachtsfilme auf dem Sofa." },
            { name: "Glühwein-Set oder Teekanne", text: "Für Abende mit Freunden und Zimtduft in der Wohnung." },
            { name: "Backformen und Ausstecher", text: "Für alle, die jedes Jahr Plätzchen backen." },
            { name: "LEGO oder Bauset", text: "Setnummer notieren, damit das Christkind nicht danebenliegt." },
            { name: "Schlitten oder Schlittschuhe", text: "Ein größeres Geschenk, das sich mehrere Verwandte teilen können." },
            { name: "Bilderbücher", text: "Alter des Kindes und vorhandene Bücher dazuschreiben." },
          ],
        },
        {
          h: "So erstellst du deine Weihnachtsliste mit WishDrop",
          p: "1. Lege eine kostenlose Liste an und trage den 24. Dezember als Datum ein, dann sehen alle den Countdown. 2. Füge Geschenke mit Foto, ungefährem Preis und Link zum Shop hinzu und markiere deine Favoriten als besonders gewünscht. 3. Teile einen einzigen Link in der Familiengruppe. 4. Verwandte reservieren, was sie kaufen wollen, und alle anderen sehen, was schon vergeben ist.",
        },
        {
          h: "Tipps für eine gute Weihnachtsliste",
          p: "Mische verschiedene Preisklassen, damit jeder etwas Passendes findet. Schalte den Überraschungsmodus ein, wenn du nicht wissen willst, wer dir was schenkt. Für teure Wünsche gibt es das Gruppengeschenk: Freunde tragen sich ein und teilen die Kosten untereinander. Lege für jedes Kind eine eigene Liste an, damit Oma und Opa nicht dasselbe Spielzeug kaufen.",
        },
      ],
      faq: [
        {
          q: "Wie erstelle ich eine Wunschliste für Weihnachten online?",
          a: "Registriere dich kostenlos bei WishDrop, lege eine Liste an, füge Geschenke mit Foto und Link hinzu und teile den Link mit Familie und Freunden.",
        },
        {
          q: "Ist WishDrop kostenlos?",
          a: "Ja. Listen erstellen und Geschenke reservieren kostet nichts, und wer reserviert, braucht kein Konto.",
        },
        {
          q: "Kann ich sehen, wer ein Geschenk reserviert hat?",
          a: "Das entscheidest du. Im Überraschungsmodus siehst du nicht, wer was reserviert hat, damit es bis zur Bescherung spannend bleibt.",
        },
        {
          q: "Kann ich für meine Kinder eigene Listen anlegen?",
          a: "Ja, du kannst mehrere Listen haben, zum Beispiel eine pro Kind, jede mit eigenem Link.",
        },
      ],
      cta: "Weihnachtsliste erstellen",
    },
    {
      key: "wedding",
      slug: "hochzeitsliste-online",
      title: "Hochzeitsliste online kostenlos — WishDrop",
      description:
        "Hochzeitsliste online und kostenlos: Wunschgeschenke aus jedem Shop eintragen, einen Link teilen, Gäste reservieren ohne Dopplungen.",
      h1: "Die Hochzeitsliste online, aus jedem Shop",
      intro:
        "Eine Hochzeitsliste erspart euren Gästen das Raten und euch drei gleiche Toaster. Tragt ein, was ihr für euer gemeinsames Zuhause wirklich braucht, und teilt einen Link. Gäste reservieren ihr Geschenk mit einem kostenlosen Konto in Sekunden.",
      sections: [
        {
          h: "Ideen für das gemeinsame Zuhause",
          ideas: [
            { name: "Topf- und Pfannenset", text: "Die Grundausstattung jeder Küche, passend zum Herd auswählen." },
            { name: "Küchenmaschine", text: "Ein größerer Wunsch, ideal als Gruppengeschenk unter Freunden." },
            { name: "Siebträger- oder Kaffeemaschine", text: "Für den gemeinsamen Kaffee jeden Morgen." },
            { name: "Gute Bettwäsche", text: "Bettgröße angeben, dann muss nichts umgetauscht werden." },
            { name: "Geschirr und Gläser", text: "Bereit für die ersten Abendessen mit Freunden." },
            { name: "Saugroboter", text: "Eine echte Hilfe im Alltag, die täglich läuft." },
            { name: "Handtuchset", text: "Praktisch und leicht zu treffen, wenn die Farbe dabeisteht." },
            { name: "Pflanzen und Übertöpfe", text: "Damit sich die Wohnung schnell nach Zuhause anfühlt." },
          ],
        },
        {
          h: "Erlebnisse und größere Geschenke",
          ideas: [
            { name: "Zuschuss zu den Flitterwochen", text: "Als Gruppengeschenk anlegen: Freunde tragen sich ein und regeln das Geld untereinander." },
            { name: "Abendessen in einem guten Restaurant", text: "Ein Abend nur für euch nach dem Hochzeitstrubel." },
            { name: "Wochenendtrip", text: "Eine bleibende Erinnerung, schön als Geschenk von Kollegen." },
            { name: "Fotoshooting nach der Hochzeit", text: "Für entspannte Bilder ohne Zeitdruck." },
            { name: "Kochkurs zu zweit", text: "Macht Spaß und ist nützlich fürs erste Ehejahr." },
            { name: "Festivaltickets", text: "Für Paare, die im nächsten Sommer weiterfeiern wollen." },
          ],
        },
        {
          h: "So legt ihr die Hochzeitsliste bei WishDrop an",
          p: "1. Erstellt eine Liste und tragt euer Hochzeitsdatum ein, dann sehen die Gäste den Countdown. 2. Fügt Geschenke mit Foto, ungefährem Preis und Link zu einem beliebigen Shop hinzu. 3. Markiert, was euch am wichtigsten ist, und macht teure Wünsche zu Gruppengeschenken. 4. Teilt den Link oder druckt den QR-Code auf die Einladungskarten.",
        },
        {
          h: "Die Liste teilen, ohne aufdringlich zu wirken",
          p: "Schreibt nicht „Bitte nur Geschenke von der Liste“ auf die Einladung. Besser ist ein kurzer Satz wie „Wer uns etwas schenken möchte, findet hier ein paar Ideen“, daneben der QR-Code. Viele Gäste fragen ohnehin direkt nach, also haltet den Link bereit. Plant Geschenke in verschiedenen Preisklassen ein, und denkt daran: Manche Gäste schenken lieber Geld, und das ist völlig in Ordnung.",
        },
      ],
      faq: [
        {
          q: "Wie erstelle ich eine Hochzeitsliste online?",
          a: "Legt bei WishDrop kostenlos eine Liste an, fügt Geschenke mit Foto und Link aus jedem Shop hinzu und teilt den Link oder den QR-Code auf der Einladung.",
        },
        {
          q: "Ist das kostenlos?",
          a: "Ja, WishDrop ist für euch und eure Gäste kostenlos. Die Liste kann jeder sehen, zum Reservieren legen Gäste ein kostenloses Konto an.",
        },
        {
          q: "Sehen wir, wer welches Geschenk reserviert hat?",
          a: "Im Überraschungsmodus nicht. Ihr seht nur, dass ein Geschenk vergeben ist, damit es niemand doppelt kauft.",
        },
        {
          q: "Übernimmt WishDrop Bezahlung oder Versand?",
          a: "Nein. Gäste kaufen das Geschenk, wo sie möchten. WishDrop zeigt nur, wer was reserviert hat und wer bei einem Gruppengeschenk mitmacht.",
        },
      ],
      cta: "Hochzeitsliste erstellen",
    },
    {
      key: "birthday",
      slug: "wunschliste-geburtstag",
      title: "Wunschliste zum Geburtstag erstellen — WishDrop",
      description:
        "Erstelle deine Wunschliste zum Geburtstag: Ideen für Kinder und Erwachsene, ein Link zum Teilen, und Freunde reservieren, damit nichts doppelt kommt.",
      h1: "Deine Wunschliste zum Geburtstag",
      intro:
        "Dein Geburtstag, deine Wünsche. Mit einer Wunschliste müssen Freunde nicht raten, und du bekommst nicht zweimal denselben Lautsprecher. Hier findest du Ideen für Kinder und Erwachsene und wie die Liste schnell steht.",
      sections: [
        {
          h: "Ideen für Erwachsene",
          ideas: [
            { name: "Bücher von deiner Leseliste", text: "Genaue Titel eintragen, damit nichts Vorhandenes kommt." },
            { name: "Bluetooth-Lautsprecher", text: "Für Grillabende, Ausflüge und den Balkon." },
            { name: "Fitnessstudio- oder Yoga-Abo", text: "Ein Geschenk, das beim Durchhalten hilft." },
            { name: "Rucksack für Stadt oder Wanderung", text: "Modell und Farbe verlinken." },
            { name: "Wellness-Gutschein", text: "Ein Tag zum Abschalten, ideal als Gruppengeschenk." },
            { name: "Starterset für ein neues Hobby", text: "Für alle, die dieses Jahr etwas Neues ausprobieren wollen." },
            { name: "Sofortbildkamera", text: "Ausgedruckte Fotos direkt auf der Party." },
          ],
        },
        {
          h: "Ideen für Kinder",
          ideas: [
            { name: "Bauset", text: "Alter und Lieblingsserie des Kindes notieren." },
            { name: "Fahrrad oder Roller", text: "Ein großes Geschenk, das sich mehrere Eltern teilen können." },
            { name: "Kinder-Brettspiel", text: "Für Familienabende ohne Bildschirm." },
            { name: "Experimentierkasten", text: "Für neugierige Kinder, die wissen wollen, wie alles funktioniert." },
            { name: "Bücher passend zum Alter", text: "Aufschreiben, was schon im Regal steht." },
            { name: "Verkleidungskostüm", text: "Größe angeben, Kinder wachsen schnell." },
            { name: "Mal- und Bastelset unter 20 Euro", text: "Günstig und wird oft benutzt." },
          ],
        },
        {
          h: "So erstellst du die Liste mit WishDrop",
          p: "1. Lege eine kostenlose Liste an und trage deinen Geburtstag als Datum ein, dann läuft ein Countdown. 2. Füge Geschenke mit Foto, Preis und Link zum Shop hinzu. 3. Markiere, was du dir am meisten wünschst. 4. Teile den Link im Chat oder poste das Teilen-Bild in deiner Instagram-Story.",
        },
        {
          h: "Tipps für den Kindergeburtstag",
          p: "Zum Kindergeburtstag kommen oft Kinder aus Kita oder Klasse, deren Eltern sich kaum kennen. Ein Link in der Elterngruppe löst das: Jeder reserviert ein Geschenk, und alle sehen, was noch frei ist. Trage ein paar kleine Ideen und ein, zwei größere als Gruppengeschenk ein. Zum Reservieren braucht niemand ein Konto oder eine App.",
        },
      ],
      faq: [
        {
          q: "Wie erstelle ich eine Wunschliste zum Geburtstag?",
          a: "Lege bei WishDrop eine Liste an, füge Geschenke mit Foto und Link hinzu und schicke den Link an deine Freunde.",
        },
        {
          q: "Ist das kostenlos?",
          a: "Ja, Liste erstellen und Geschenke reservieren ist kostenlos.",
        },
        {
          q: "Kann ich sehen, wer ein Geschenk reserviert hat?",
          a: "Mit Überraschungsmodus nicht. Deine Freunde sehen aber, was schon vergeben ist, also gibt es keine Dopplungen.",
        },
        {
          q: "Brauchen meine Freunde ein Konto?",
          a: "Zum Ansehen der Liste nicht. Zum Reservieren ja: ein kostenloses Konto, in einer Minute erstellt. So weißt du genau, wer was reserviert hat.",
        },
      ],
      cta: "Geburtstagsliste erstellen",
    },
    {
      key: "baby",
      slug: "wunschliste-baby-taufe",
      title: "Wunschliste für Baby und Taufe — WishDrop",
      description:
        "Wunschliste für Babyparty und Taufe: nützliche Geschenkideen für die ersten Monate, ein Link für Familie und Paten, keine doppelten Geschenke.",
      h1: "Die Wunschliste für Babyparty und Taufe",
      intro:
        "Wenn ein Baby kommt, wollen alle helfen, aber kaum jemand weiß, was ihr wirklich braucht. Eine Wunschliste erspart euch zehn Rasseln und bringt Dinge, die ihr täglich nutzt. Hier sind erprobte Ideen und so legt ihr die Liste an.",
      sections: [
        {
          h: "Das Wichtigste für die ersten Monate",
          ideas: [
            { name: "Bodys in größeren Größen", text: "Lieber 68 bis 80 wünschen, Größe 50 ist schnell zu klein." },
            { name: "Windeln und Feuchttücher", text: "Gehen immer aus, damit liegt niemand falsch." },
            { name: "Babyschlafsack", text: "Sicherer als eine lose Decke und nachts einfach." },
            { name: "Babybadewanne und Kapuzenhandtücher", text: "Ab der ersten Woche zu Hause im Einsatz." },
            { name: "Babyphone", text: "Damit ihr im Nebenzimmer ruhig schlafen könnt." },
            { name: "Babytrage oder Tragetuch", text: "Hände frei und das Baby ganz nah." },
            { name: "Fläschchen und Sterilisator", text: "Lieblingsmarke angeben, damit die Sauger passen." },
          ],
        },
        {
          h: "Große Wünsche zum gemeinsamen Schenken",
          ideas: [
            { name: "Kinderwagen", text: "Meist der teuerste Wunsch, ideal als Gruppengeschenk." },
            { name: "Babyschale fürs Auto", text: "Schon für die Heimfahrt aus der Klinik nötig." },
            { name: "Babybett oder Beistellbett", text: "Genaues Modell verlinken, damit es ins Zimmer passt." },
            { name: "Hochstuhl", text: "Wird ab etwa sechs Monaten gebraucht, wenn der Brei kommt." },
            { name: "Wickelkommode", text: "Schont den Rücken bei vielen Wickelrunden am Tag." },
            { name: "Taufkerze oder Erinnerungsalbum", text: "Ein persönliches Geschenk von Paten oder Großeltern." },
          ],
        },
        {
          h: "So legt ihr die Liste bei WishDrop an",
          p: "1. Erstellt eine Liste und tragt das Datum der Taufe, der Babyparty oder den Geburtstermin ein. 2. Fügt Produkte mit Foto, Preis und Link zum Shop hinzu. 3. Macht große Wünsche zu Gruppengeschenken, damit sich Verwandte zusammentun können. 4. Teilt den Link oder druckt den QR-Code auf die Einladung.",
        },
        {
          h: "Was Eltern wirklich brauchen",
          p: "Winzige Outfits sind süß, aber das Baby trägt sie nur ein paar Wochen. Nützlicher sind Verbrauchsartikel, große Anschaffungen und alles, was die Nächte leichter macht. Denkt auch an euch: ein Stillkissen oder ein paar vorgekochte Mahlzeiten von Freunden sind Gold wert. Wenn ihr nicht wissen wollt, wer was mitbringt, schaltet den Überraschungsmodus ein.",
        },
      ],
      faq: [
        {
          q: "Wie erstelle ich eine Wunschliste zur Taufe?",
          a: "Legt bei WishDrop kostenlos eine Liste an, fügt die gewünschten Produkte aus beliebigen Shops hinzu und teilt den Link mit Paten, Familie und Freunden.",
        },
        {
          q: "Ist das kostenlos?",
          a: "Ja. Die Liste ist kostenlos, und Gäste reservieren mit einem kostenlosen Konto.",
        },
        {
          q: "Sehen wir, wer was reserviert hat?",
          a: "Im Überraschungsmodus nicht. Ohne ihn seht ihr die Reservierungen auf eurer Liste.",
        },
        {
          q: "Was schenkt man zur Taufe?",
          a: "Paten schenken oft die Taufkerze oder etwas Bleibendes, andere Gäste Geld oder etwas Praktisches. Eine Liste zeigt, was wirklich gebraucht wird.",
        },
      ],
      cta: "Babyliste erstellen",
    },
  ],

  /* ───────────────────────────── Русский ───────────────────────────── */
  ru: [
    {
      key: "christmas",
      slug: "idei-podarkov-na-novyy-god",
      title: "Идеи подарков на Новый год и вишлист — WishDrop",
      description:
        "Идеи подарков на Новый год и Рождество для всей семьи и бесплатный вишлист: друзья бронируют подарки по одной ссылке, и никто не купит одно и то же.",
      h1: "Идеи подарков на Новый год и ваш список желаний",
      intro:
        "Каждый декабрь один и тот же вопрос: «Что тебе подарить?» Список желаний отвечает на него один раз и для всех. Ниже — идеи по категориям и как собрать свой вишлист за пару минут.",
      sections: [
        {
          h: "Идеи подарков для неё и для него",
          ideas: [
            { name: "Тёплая пижама или халат", text: "Надёжный зимний подарок, если в списке указан размер." },
            { name: "Парфюм или уходовый набор", text: "Добавьте ссылку на нужный, чтобы не получить чужой аромат." },
            { name: "Беспроводные наушники", text: "Пригодятся каждый день: в дороге, в зале, на работе." },
            { name: "Книга из списка «прочитать»", text: "Укажите название или автора, и подарок точно попадёт." },
            { name: "Шерстяные перчатки и шарф", text: "Практично в январе и легко угадать, если указан цвет." },
            { name: "Кожаный кошелёк или ремень", text: "Классика, которая служит годами." },
            { name: "Билеты на концерт или в театр", text: "Впечатление вместо ещё одной вещи на полке." },
            { name: "Умные часы", text: "Подарок посерьёзнее, удобно дарить вскладчину." },
          ],
        },
        {
          h: "Недорогие подарки",
          ideas: [
            { name: "Кружка с надписью", text: "Мелочь, но личная — для коллег и друзей." },
            { name: "Ароматическая свеча", text: "Делает длинные зимние вечера уютнее." },
            { name: "Настольная игра или пазл", text: "Как раз для новогодних каникул с семьёй." },
            { name: "Смешные зимние носки", text: "Маленький подарок, который правда носят." },
            { name: "Хороший чай или кофе", text: "Напишите, в зёрнах или молотый." },
            { name: "Ежедневник на новый год", text: "Для тех, кто в январе строит планы." },
            { name: "Ёлочная игрушка ручной работы", text: "Память, которую достают каждый декабрь." },
          ],
        },
        {
          h: "Для дома и для детей",
          ideas: [
            { name: "Мягкий плед", text: "Для новогодних фильмов на диване." },
            { name: "Набор для глинтвейна или заварочный чайник", text: "Для вечеров с друзьями и запаха корицы в доме." },
            { name: "Формы для выпечки", text: "Для тех, кто печёт к каждому празднику." },
            { name: "Конструктор LEGO", text: "Укажите номер набора, чтобы Дед Мороз не ошибся." },
            { name: "Санки или коньки", text: "Большой подарок, который родственники могут подарить вместе." },
            { name: "Детские книги с картинками", text: "Напишите возраст ребёнка и какие книги уже есть." },
          ],
        },
        {
          h: "Как сделать новогодний список в WishDrop",
          p: "1. Создайте бесплатный список и поставьте дату 31 декабря — гости увидят обратный отсчёт. 2. Добавьте подарки с фото, примерной ценой и ссылкой на магазин, отметьте самые желанные. 3. Отправьте одну ссылку в семейный чат. 4. Родные бронируют подарки, а остальные сразу видят, что уже занято.",
        },
        {
          h: "Советы для удачного вишлиста",
          p: "Добавьте подарки разной стоимости, чтобы каждый нашёл что-то по карману. Включите режим сюрприза, если не хотите знать, кто что подарит. Для дорогой вещи есть общий подарок: друзья записываются и скидываются между собой. Сделайте отдельный список для каждого ребёнка, чтобы бабушки не купили одну и ту же игрушку.",
        },
      ],
      faq: [
        {
          q: "Как составить список желаний на Новый год онлайн?",
          a: "Зарегистрируйтесь в WishDrop бесплатно, создайте список, добавьте подарки с фото и ссылками и отправьте ссылку родным и друзьям.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. Создавать списки и бронировать подарки можно бесплатно, а тем, кто бронирует, аккаунт не нужен.",
        },
        {
          q: "Можно увидеть, кто забронировал подарок?",
          a: "Решаете вы. В режиме сюрприза вы не видите, кто что забронировал, — так интрига сохранится до праздника.",
        },
        {
          q: "Можно сделать отдельные списки для детей?",
          a: "Да, списков может быть несколько, например по одному на каждого ребёнка, у каждого своя ссылка.",
        },
      ],
      cta: "Создать новогодний список",
    },
    {
      key: "wedding",
      slug: "spisok-podarkov-na-svadbu",
      title: "Список подарков на свадьбу онлайн — WishDrop",
      description:
        "Бесплатный список подарков на свадьбу: добавьте желания из любых магазинов, отправьте одну ссылку, а гости бронируют без повторов.",
      h1: "Свадебный список подарков онлайн",
      intro:
        "Список подарков избавит гостей от догадок, а вас — от трёх одинаковых тостеров. Добавьте то, что действительно нужно для общего дома, и отправьте одну ссылку. Гости бронируют подарок с бесплатным аккаунтом за пару секунд.",
      sections: [
        {
          h: "Идеи для общего дома",
          ideas: [
            { name: "Набор кастрюль и сковородок", text: "Основа новой кухни; выбирайте под свою плиту." },
            { name: "Кухонный комбайн", text: "Крупная покупка, удобно дарить вскладчину." },
            { name: "Кофемашина", text: "Для утреннего кофе вдвоём каждый день." },
            { name: "Хорошее постельное бельё", text: "Укажите размер кровати, чтобы не пришлось менять." },
            { name: "Посуда и бокалы", text: "Для первых ужинов с друзьями в новом доме." },
            { name: "Робот-пылесос", text: "Реальная помощь по дому, которая работает каждый день." },
            { name: "Набор полотенец", text: "Практично и легко угадать, если указан цвет." },
            { name: "Комнатные растения и кашпо", text: "С ними квартира быстро становится домом." },
          ],
        },
        {
          h: "Впечатления и крупные подарки",
          ideas: [
            { name: "На медовый месяц", text: "Оформите как общий подарок: друзья записываются, а деньги собирают между собой." },
            { name: "Ужин в хорошем ресторане", text: "Вечер только для вас после свадебной суеты." },
            { name: "Поездка на выходные", text: "Память на годы, красивый подарок от коллег." },
            { name: "Фотосессия после свадьбы", text: "Для спокойных снимков без жёсткого графика." },
            { name: "Кулинарный мастер-класс для двоих", text: "Весело и полезно в первый год вместе." },
            { name: "Билеты на фестиваль", text: "Для пар, которые хотят праздновать и следующим летом." },
          ],
        },
        {
          h: "Как сделать свадебный список в WishDrop",
          p: "1. Создайте список и укажите дату свадьбы — гости увидят обратный отсчёт. 2. Добавьте подарки с фото, примерной ценой и ссылкой на любой магазин. 3. Отметьте самое желанное, а дорогие вещи сделайте общими подарками. 4. Отправьте ссылку или напечатайте QR-код на приглашениях.",
        },
        {
          h: "Как отправить список и не показаться навязчивыми",
          p: "На свадьбу часто дарят деньги в конверте, и это нормально. Список — для тех, кто хочет подарить вещь: коллег, дальних родственников, друзей, которые не смогут прийти. Не пишите в приглашении «дарите только из списка». Лучше короткая фраза: «Если захотите нас порадовать, вот несколько идей», а рядом QR-код. Добавьте подарки разной стоимости, чтобы никто не чувствовал давления.",
        },
      ],
      faq: [
        {
          q: "Как сделать список подарков на свадьбу онлайн?",
          a: "Создайте бесплатный список в WishDrop, добавьте подарки с фото и ссылками, затем отправьте ссылку гостям или напечатайте QR-код на приглашениях.",
        },
        {
          q: "Это бесплатно?",
          a: "Да, WishDrop бесплатен и для вас, и для гостей. Список может открыть любой, а для брони гости создают бесплатный аккаунт.",
        },
        {
          q: "Мы увидим, кто какой подарок забронировал?",
          a: "В режиме сюрприза — нет. Вы видите только, что подарок занят, чтобы его не купили дважды.",
        },
        {
          q: "WishDrop принимает оплату или доставляет подарки?",
          a: "Нет. Гости покупают подарок где угодно. WishDrop только отмечает, кто что забронировал и кто участвует в общем подарке.",
        },
      ],
      cta: "Создать свадебный список",
    },
    {
      key: "birthday",
      slug: "spisok-zhelaniy-na-den-rozhdeniya",
      title: "Список желаний на день рождения — WishDrop",
      description:
        "Составьте список желаний на день рождения: идеи для детей и взрослых, одна ссылка для друзей, а бронь подарков защищает от одинаковых подарков.",
      h1: "Список желаний на день рождения",
      intro:
        "Ваш праздник — ваши желания. Со списком друзьям не нужно гадать, а вам не подарят две одинаковые колонки. Ниже — идеи для детей и взрослых и как быстро собрать вишлист.",
      sections: [
        {
          h: "Идеи для взрослых",
          ideas: [
            { name: "Книги из вашего списка", text: "Укажите точные названия, чтобы не получить то, что уже есть." },
            { name: "Портативная колонка", text: "Для пикников, походов и вечеров на балконе." },
            { name: "Абонемент в зал или на йогу", text: "Подарок, который помогает держать обещания себе." },
            { name: "Городской или походный рюкзак", text: "Дайте ссылку на нужную модель и цвет." },
            { name: "Сертификат в спа", text: "День отдыха, удобно дарить вскладчину." },
            { name: "Набор для нового хобби", text: "Для тех, кто хочет попробовать что-то новое." },
            { name: "Камера моментальной печати", text: "Снимки прямо на празднике." },
          ],
        },
        {
          h: "Идеи для детей",
          ideas: [
            { name: "Конструктор", text: "Укажите возраст и любимую серию ребёнка." },
            { name: "Велосипед или самокат", text: "Большой подарок, который могут подарить несколько семей вместе." },
            { name: "Детская настольная игра", text: "Для семейных вечеров без экранов." },
            { name: "Набор для опытов", text: "Для любознательных детей, которым интересно, как всё устроено." },
            { name: "Книги по возрасту", text: "Напишите, какие уже есть, чтобы не было повторов." },
            { name: "Карнавальный костюм", text: "Укажите размер — дети быстро растут." },
            { name: "Недорогой набор для рисования", text: "Простой подарок, которым пользуются постоянно." },
          ],
        },
        {
          h: "Как сделать список в WishDrop",
          p: "1. Создайте бесплатный список и укажите дату дня рождения — появится обратный отсчёт. 2. Добавьте подарки с фото, ценой и ссылкой на магазин. 3. Отметьте, чего хочется больше всего. 4. Отправьте ссылку в чат или опубликуйте картинку списка в Instagram Stories.",
        },
        {
          h: "Советы для детского дня рождения",
          p: "На детский праздник часто приходят одноклассники, чьи родители почти не знакомы. Одна ссылка в родительском чате решает вопрос: каждый бронирует подарок, и все видят, что осталось. Добавьте несколько недорогих идей и одну-две крупные как общий подарок. Для брони не нужен ни аккаунт, ни приложение.",
        },
      ],
      faq: [
        {
          q: "Как составить вишлист на день рождения?",
          a: "Создайте список в WishDrop, добавьте подарки с фото и ссылками и отправьте ссылку друзьям.",
        },
        {
          q: "Это бесплатно?",
          a: "Да, создать список и забронировать подарок можно бесплатно.",
        },
        {
          q: "Можно увидеть, кто забронировал подарок?",
          a: "В режиме сюрприза — нет. Но друзья видят, что уже занято, поэтому повторов не будет.",
        },
        {
          q: "Друзьям нужно регистрироваться?",
          a: "Чтобы посмотреть список — нет. Чтобы забронировать подарок — да: бесплатный аккаунт, создаётся за минуту. Так вы точно знаете, кто что забронировал.",
        },
      ],
      cta: "Создать список на день рождения",
    },
    {
      key: "baby",
      slug: "spisok-podarkov-dlya-malysha",
      title: "Список подарков для малыша и на крестины — WishDrop",
      description:
        "Список подарков на рождение малыша и крестины: полезные идеи на первые месяцы, одна ссылка для родных и крёстных, без одинаковых подарков.",
      h1: "Список подарков для малыша и на крестины",
      intro:
        "Когда появляется малыш, помочь хотят все, но мало кто знает, что действительно нужно. Список избавит вас от десятка погремушек и принесёт то, чем вы пользуетесь каждый день. Вот проверенные идеи и как собрать список.",
      sections: [
        {
          h: "Самое нужное на первые месяцы",
          ideas: [
            { name: "Боди на вырост", text: "Просите размеры на 3–6 и 6–12 месяцев, вещи для новорождённых быстро малы." },
            { name: "Подгузники и влажные салфетки", text: "Заканчиваются всегда, с ними не ошибёшься." },
            { name: "Спальный мешок для малыша", text: "Безопаснее одеяла и удобно ночью." },
            { name: "Ванночка и полотенца с капюшоном", text: "Пригодятся с первой недели дома." },
            { name: "Радионяня", text: "Чтобы спокойно отдыхать в соседней комнате." },
            { name: "Слинг или эргорюкзак", text: "Свободные руки и спокойный малыш рядом." },
            { name: "Бутылочки и стерилизатор", text: "Укажите любимую марку, чтобы подходили соски." },
          ],
        },
        {
          h: "Крупные подарки вскладчину",
          ideas: [
            { name: "Коляска", text: "Обычно самая дорогая покупка — идеальный общий подарок." },
            { name: "Автокресло", text: "Нужно уже на выписке из роддома, лучше получить заранее." },
            { name: "Кроватка или приставная люлька", text: "Дайте ссылку на модель, чтобы она поместилась в комнате." },
            { name: "Стульчик для кормления", text: "Понадобится примерно к шести месяцам, с прикормом." },
            { name: "Комод с пеленальным столиком", text: "Бережёт спину при десятках переодеваний в день." },
            { name: "Альбом для первых фото", text: "Тёплый подарок от бабушек, дедушек или крёстных." },
          ],
        },
        {
          h: "Как сделать список в WishDrop",
          p: "1. Создайте список и укажите дату крестин или предполагаемую дату родов. 2. Добавьте вещи с фото, ценой и ссылкой на магазин. 3. Крупные покупки отметьте как общий подарок, чтобы родные могли скинуться. 4. Отправьте ссылку или напечатайте QR-код на приглашении.",
        },
        {
          h: "Что на самом деле нужно родителям",
          p: "По традиции крёстные часто берут на себя крестильный набор и крестик, так что список может закрыть остальное. Крошечные наряды милые, но малыш носит их пару недель. Полезнее расходники, крупные вещи и всё, что облегчает ночи. Добавьте что-то и для мамы: подушку для кормления или домашнюю еду от друзей. А если не хотите знать, кто что подарит, включите режим сюрприза.",
        },
      ],
      faq: [
        {
          q: "Как сделать список подарков на крестины?",
          a: "Создайте бесплатный список в WishDrop, добавьте нужные вещи из любых магазинов и отправьте ссылку крёстным, родным и друзьям.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. Список бесплатный, а гости бронируют подарки с бесплатным аккаунтом.",
        },
        {
          q: "Можно увидеть, кто что забронировал?",
          a: "В режиме сюрприза — нет. Без него вы видите брони в своём списке.",
        },
        {
          q: "Что подарить на рождение малыша?",
          a: "Лучше всего то, что действительно нужно родителям: расходники, коляску, автокресло. Список показывает, что ещё не куплено.",
        },
      ],
      cta: "Создать список для малыша",
    },
  ],
};

/** Hub page texts (the list of all guides). */
export const guidesHub: Record<
  Lang,
  { slug: string; title: string; description: string; h1: string; intro: string }
> = {
  ro: {
    slug: "idei",
    title: "Idei de cadouri și liste pentru orice ocazie — WishDrop",
    description:
      "Idei de cadouri pentru Crăciun, nuntă, zi de naștere și botez, plus sfaturi pentru o listă de dorințe online gratuită, fără cadouri duble.",
    h1: "Idei de cadouri pentru fiecare ocazie",
    intro:
      "Alege ocazia și găsești idei concrete de cadouri, sfaturi și pașii pentru o listă de dorințe. Trimiți un singur link, iar prietenii rezervă darurile fără să se dubleze.",
  },
  en: {
    slug: "ideas",
    title: "Gift Ideas and Wish Lists for Every Occasion — WishDrop",
    description:
      "Gift ideas for Christmas, weddings, birthdays and baby showers, plus tips for a free online wish list where friends reserve gifts without duplicates.",
    h1: "Gift ideas for every occasion",
    intro:
      "Pick an occasion to find concrete gift ideas, practical tips and the steps to set up a wish list. Share one link, and friends reserve gifts without doubling up.",
  },
  de: {
    slug: "ideen",
    title: "Geschenkideen und Wunschlisten für jeden Anlass — WishDrop",
    description:
      "Geschenkideen für Weihnachten, Hochzeit, Geburtstag, Taufe und Babyparty, dazu Tipps für eine kostenlose Wunschliste ohne doppelte Geschenke.",
    h1: "Geschenkideen für jeden Anlass",
    intro:
      "Wähle einen Anlass und finde konkrete Geschenkideen, Tipps und die Schritte zur eigenen Wunschliste. Ein Link genügt, und Freunde reservieren, ohne dass etwas doppelt kommt.",
  },
  ru: {
    slug: "idei",
    title: "Идеи подарков и списки желаний на любой повод — WishDrop",
    description:
      "Идеи подарков на Новый год, свадьбу, день рождения и крестины, а также советы, как составить бесплатный вишлист без повторяющихся подарков.",
    h1: "Идеи подарков на любой повод",
    intro:
      "Выберите повод и найдите конкретные идеи подарков, советы и шаги, чтобы собрать список желаний. Одна ссылка — и друзья бронируют подарки без повторов.",
  },
};
