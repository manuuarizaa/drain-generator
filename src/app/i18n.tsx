import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const supportedLocales = ["es", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

const es = {
  "meta.title": "Sumidero — Configurador",
  "meta.description":
    "Configurador de sumideros con previsualización 3D y exportación STL.",
  "language.label": "Idioma",
  "language.es": "Español",
  "language.en": "Inglés",
  "panel.ariaLabel": "Parámetros del sumidero",
  "panel.title": "Generador de sumidero",
  "section.dimensions": "Dimensiones",
  "section.pattern": "Patrón",
  "controls.size": "Tamaño",
  "controls.height": "Altura",
  "controls.cornerRadius": "Radio de esquina",
  "controls.border": "Marco",
  "controls.cavities": "Cavidades",
  "shape.legend": "Forma de cavidades",
  "shape.square": "Cuadrada",
  "shape.rounded": "Suavizada",
  "shape.round": "Redonda",
  "export.generating": "Generando…",
  "export.download": "Descargar STL",
  "viewport.ariaLabel":
    "Vista 3D de un sumidero de {size} por {size} milímetros",
  "viewport.drag": "Arrastrar",
  "viewport.rotate": "para rotar",
  "viewport.scroll": "Scroll",
  "viewport.zoom": "para ampliar",
  "errors.rootNotFound": "No se encontró el elemento raíz de la aplicación.",
  "errors.i18nProviderMissing":
    "useI18n debe utilizarse dentro de I18nProvider.",
} as const;

export type TranslationKey = keyof typeof es;

const en: Record<TranslationKey, string> = {
  "meta.title": "Drain — Parametric configurator",
  "meta.description":
    "Parametric drain configurator with 3D preview and STL export.",
  "language.label": "Language",
  "language.es": "Spanish",
  "language.en": "English",
  "panel.ariaLabel": "Drain parameters",
  "panel.title": "Drain generator",
  "section.dimensions": "Dimensions",
  "section.pattern": "Pattern",
  "controls.size": "Size",
  "controls.height": "Height",
  "controls.cornerRadius": "Corner radius",
  "controls.border": "Border",
  "controls.cavities": "Openings",
  "shape.legend": "Opening shape",
  "shape.square": "Square",
  "shape.rounded": "Rounded",
  "shape.round": "Round",
  "export.generating": "Generating…",
  "export.download": "Download STL",
  "viewport.ariaLabel": "3D view of a {size} by {size} millimeter drain",
  "viewport.drag": "Drag",
  "viewport.rotate": "to rotate",
  "viewport.scroll": "Scroll",
  "viewport.zoom": "to zoom",
  "errors.rootNotFound": "The application root element was not found.",
  "errors.i18nProviderMissing": "useI18n must be used inside I18nProvider.",
};

const messages: Record<Locale, Record<TranslationKey, string>> = { es, en };
const storageKey = "sumidero-locale";

type InterpolationValues = Record<string, string | number>;
type Translate = (key: TranslationKey, values?: InterpolationValues) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function getPreferredLocale(): Locale {
  const savedLocale = window.localStorage.getItem(storageKey);

  if (savedLocale === "es" || savedLocale === "en") {
    return savedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  values?: InterpolationValues,
) {
  const message = messages[locale][key];

  if (!values) return message;

  return Object.entries(values).reduce(
    (result, [name, replacement]) =>
      result.replaceAll(`{${name}}`, String(replacement)),
    message,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getPreferredLocale);

  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );

    document.documentElement.lang = locale;
    document.title = translate(locale, "meta.title");
    description?.setAttribute("content", translate(locale, "meta.description"));
    window.localStorage.setItem(storageKey, locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t: Translate = (key, values) => translate(locale, key, values);

    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error(
      translate(getPreferredLocale(), "errors.i18nProviderMissing"),
    );
  }

  return context;
}
