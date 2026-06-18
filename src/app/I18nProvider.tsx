import { useEffect, useMemo, useState, type ReactNode } from "react";
import { writeStorage } from "../shared/browser/storage";
import {
  getPreferredLocale,
  storageKey,
  translate,
  type Locale,
  type Translate,
} from "./i18n";
import { I18nContext, type I18nContextValue } from "./i18nContext";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getPreferredLocale);

  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );

    document.documentElement.lang = locale;
    document.title = translate(locale, "meta.title");
    description?.setAttribute("content", translate(locale, "meta.description"));
    writeStorage(storageKey, locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t: Translate = (key, values) => translate(locale, key, values);
    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
