import { readStorage } from "../shared/browser/storage";

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
  "export.generatingStatus": "Preparando el archivo STL.",
  "export.download": "Descargar STL",
  "export.error": "No se pudo generar el STL. Inténtalo de nuevo.",
  "viewport.ariaLabel":
    "Vista 3D de un sumidero de {size} por {size} milímetros",
  "viewport.drag": "Arrastrar",
  "viewport.rotate": "para rotar",
  "viewport.scroll": "Scroll",
  "viewport.zoom": "para ampliar",
  "viewport.controls": "Controles de la vista 3D",
  "viewport.rotateLeft": "Rotar a la izquierda",
  "viewport.rotateRight": "Rotar a la derecha",
  "viewport.zoomIn": "Acercar",
  "viewport.zoomOut": "Alejar",
  "viewport.reset": "Restablecer vista",
  "viewport.pause": "Pausar rotación",
  "viewport.resume": "Reanudar rotación",
  "viewport.keyboard":
    "Usa las flechas para rotar, más y menos para ampliar, inicio para restablecer y espacio para pausar.",
  "viewport.webglError":
    "La vista 3D no está disponible porque el navegador no pudo iniciar WebGL.",
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
  "export.generatingStatus": "Preparing the STL file.",
  "export.download": "Download STL",
  "export.error": "The STL could not be generated. Please try again.",
  "viewport.ariaLabel": "3D view of a {size} by {size} millimeter drain",
  "viewport.drag": "Drag",
  "viewport.rotate": "to rotate",
  "viewport.scroll": "Scroll",
  "viewport.zoom": "to zoom",
  "viewport.controls": "3D view controls",
  "viewport.rotateLeft": "Rotate left",
  "viewport.rotateRight": "Rotate right",
  "viewport.zoomIn": "Zoom in",
  "viewport.zoomOut": "Zoom out",
  "viewport.reset": "Reset view",
  "viewport.pause": "Pause rotation",
  "viewport.resume": "Resume rotation",
  "viewport.keyboard":
    "Use arrow keys to rotate, plus and minus to zoom, Home to reset, and Space to pause.",
  "viewport.webglError":
    "The 3D preview is unavailable because the browser could not start WebGL.",
  "errors.rootNotFound": "The application root element was not found.",
  "errors.i18nProviderMissing": "useI18n must be used inside I18nProvider.",
};

const messages: Record<Locale, Record<TranslationKey, string>> = { es, en };
const storageKey = "sumidero-locale";

type InterpolationValues = Record<string, string | number>;
export type Translate = (
  key: TranslationKey,
  values?: InterpolationValues,
) => string;

export function getPreferredLocale(): Locale {
  const savedLocale = readStorage(storageKey);

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

export { storageKey };
