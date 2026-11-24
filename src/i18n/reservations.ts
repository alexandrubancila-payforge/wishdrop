import type { Bundle } from "@/lib/i18n";

/** /dashboard/reservations — gifts I reserved on other people's lists. */
export default {
  ro: {
    title: "Rezervările mele — WishDrop",
    back: "Înapoi la liste",
    heading: "Cadourile rezervate de tine",
    goToList: "Mergi la listă →",
    emptyTitle: "Încă n-ai rezervat niciun cadou",
    emptyText: "Când rezervi un cadou din lista cuiva fiind autentificat, îl găsești aici.",
    emptyCta: "Caută prieteni",
    reservedByYou: "Rezervat de tine",
  },
  en: {
    title: "My reservations — WishDrop",
    back: "Back to lists",
    heading: "Gifts you've reserved",
    goToList: "Go to list →",
    emptyTitle: "You haven't reserved any gifts yet",
    emptyText: "When you reserve a gift from someone's list while logged in, you'll find it here.",
    emptyCta: "Find friends",
    reservedByYou: "Reserved by you",
  },
  de: {
    title: "Meine Reservierungen — WishDrop",
    back: "Zurück zu den Listen",
    heading: "Von dir reservierte Geschenke",
    goToList: "Zur Liste →",
    emptyTitle: "Du hast noch keine Geschenke reserviert",
    emptyText: "Wenn du angemeldet ein Geschenk aus jemandes Liste reservierst, findest du es hier.",
    emptyCta: "Freunde finden",
    reservedByYou: "Von dir reserviert",
  },
  ru: {
    title: "Мои брони — WishDrop",
    back: "Назад к спискам",
    heading: "Подарки, которые вы забронировали",
    goToList: "Перейти к списку →",
    emptyTitle: "Вы ещё не забронировали ни одного подарка",
    emptyText: "Когда вы бронируете подарок из чужого списка, войдя в аккаунт, он появится здесь.",
    emptyCta: "Найти друзей",
    reservedByYou: "Забронировано вами",
  },
} satisfies Bundle;
