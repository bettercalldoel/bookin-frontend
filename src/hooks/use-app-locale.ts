"use client";

import { useEffect, useState } from "react";
import {
  applyAppLocale,
  DEFAULT_APP_LOCALE,
  resolveBrowserLocale,
  type AppLocale,
} from "@/lib/app-locale";

export const useAppLocale = () => {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_APP_LOCALE);

  useEffect(() => {
    setLocaleState(resolveBrowserLocale());
  }, []);

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    applyAppLocale(nextLocale);
  };

  return { locale, setLocale };
};

export const useAppLocaleValue = () => {
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_APP_LOCALE);

  useEffect(() => {
    setLocale(resolveBrowserLocale());
  }, []);

  return locale;
};

