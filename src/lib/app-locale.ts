export type AppLocale = "id" | "en";

export const APP_LOCALE_STORAGE_KEY = "bookin-home-locale";
export const DEFAULT_APP_LOCALE: AppLocale = "id";

export const isAppLocale = (value: string | null | undefined): value is AppLocale =>
  value === "id" || value === "en";

export const resolveBrowserLocale = (): AppLocale => {
  if (typeof window === "undefined") return DEFAULT_APP_LOCALE;

  const stored = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  if (isAppLocale(stored)) return stored;

  const browserLanguage = window.navigator.language?.toLowerCase() ?? "";
  if (browserLanguage.startsWith("en")) return "en";
  return DEFAULT_APP_LOCALE;
};

export const applyAppLocale = (locale: AppLocale) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
};

