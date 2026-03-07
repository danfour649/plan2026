export const LOCALE_COOKIE = "PLAN2026_LOCALE";

export const LOCALES = ["en", "fr", "pidgin"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  pidgin: "Nigerian Pidgin",
};

type Messages = typeof messages.en;

const messages = {
  en: {
    nav: { plans: "Plans", tasks: "Tasks", settings: "Settings" },
    settings: {
      title: "Settings",
      language: "Language",
      languageDescription: "Choose your preferred language for the interface.",
      googleCalendar: "Google Calendar",
      connected: "Connected",
      disconnected: "Disconnected",
      calendarConnected: "Your account can currently create Google Calendar events from tasks.",
      calendarDisconnected:
        "Google Calendar access has been disconnected. Reconnect with Google to grant Calendar permissions again.",
    },
    tasksPage: { title: "Tasks", addTask: "Add task", allClear: "All clear!", noTasks: "You're all caught up. Add a new task when you're ready." },
    plansPage: { title: "Plans", addPlan: "Add plan", noPlans: "No plans yet", createPlan: "Create a plan to group tasks and track progress.", sharedWithMe: "Shared with me", edit: "Edit", view: "View" },
  },
  fr: {
    nav: { plans: "Plans", tasks: "Tâches", settings: "Paramètres" },
    settings: {
      title: "Paramètres",
      language: "Langue",
      languageDescription: "Choisissez votre langue préférée pour l'interface.",
      googleCalendar: "Google Calendar",
      connected: "Connecté",
      disconnected: "Déconnecté",
      calendarConnected: "Votre compte peut actuellement créer des événements Google Calendar à partir des tâches.",
      calendarDisconnected:
        "L'accès à Google Calendar a été déconnecté. Reconnectez-vous avec Google pour accorder à nouveau les autorisations Calendar.",
    },
    tasksPage: { title: "Tâches", addTask: "Ajouter une tâche", allClear: "Tout est clair !", noTasks: "Vous êtes à jour. Ajoutez une nouvelle tâche quand vous serez prêt." },
    plansPage: { title: "Plans", addPlan: "Ajouter un plan", noPlans: "Pas encore de plans", createPlan: "Créez un plan pour regrouper les tâches et suivre la progression.", sharedWithMe: "Partagé avec moi", edit: "Modifier", view: "Voir" },
  },
  pidgin: {
    nav: { plans: "Plans", tasks: "Tasks", settings: "Settings" },
    settings: {
      title: "Settings",
      language: "Language",
      languageDescription: "Choose di language wey you want for di interface.",
      googleCalendar: "Google Calendar",
      connected: "Don connect",
      disconnected: "Don disconnect",
      calendarConnected: "Your account fit create Google Calendar events from tasks now.",
      calendarDisconnected:
        "Google Calendar access don disconnect. Reconnect with Google to give Calendar permissions again.",
    },
    tasksPage: { title: "Tasks", addTask: "Add task", allClear: "All clear!", noTasks: "You don catch up. Add new task when you ready." },
    plansPage: { title: "Plans", addPlan: "Add plan", noPlans: "No plans yet", createPlan: "Create plan to group tasks and track progress.", sharedWithMe: "Share give me", edit: "Edit", view: "View" },
  },
} satisfies Record<Locale, Record<string, unknown>>;

export function getTranslations(locale: Locale): Messages {
  const loc = LOCALES.includes(locale as Locale) ? (locale as Locale) : DEFAULT_LOCALE;
  return messages[loc] as Messages;
}

export function getLocaleFromCookie(cookieValue: string | undefined): Locale {
  if (cookieValue && LOCALES.includes(cookieValue as Locale)) return cookieValue as Locale;
  return DEFAULT_LOCALE;
}
