import { use } from "react";
import { getPreferredLocale, translate } from "./i18n";
import { I18nContext } from "./i18nContext";

export function useI18n() {
  const context = use(I18nContext);

  if (!context) {
    throw new Error(
      translate(getPreferredLocale(), "errors.i18nProviderMissing"),
    );
  }

  return context;
}
