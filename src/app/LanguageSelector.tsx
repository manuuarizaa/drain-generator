import { supportedLocales, useI18n } from './i18n'

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      className="language-selector"
      role="group"
      aria-label={t('language.label')}
    >
      {supportedLocales.map((option) => (
        <button
          key={option}
          type="button"
          className={locale === option ? 'is-active' : undefined}
          aria-label={t(`language.${option}`)}
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
