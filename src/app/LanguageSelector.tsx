import { supportedLocales } from "./i18n";
import { useI18n } from "./useI18n";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <nav className="language-selector" aria-label={t("language.label")}>
      {supportedLocales.map((option) => (
        <button
          key={option}
          type="button"
          className={locale === option ? "is-active" : undefined}
          aria-label={t(`language.${option}`)}
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
