import type { Dispatch, SetStateAction } from "react";
import { LanguageSelector } from "../../../app/LanguageSelector";
import { useI18n, type TranslationKey } from "../../../app/i18n";
import {
  cavityControl,
  cavityShapes,
  dimensionControls,
} from "../domain/config";
import type {
  CavityShape,
  DrainConfig,
  NumericConfigKey,
} from "../domain/config";
import { RangeControl } from "./RangeControl";

const shapeIcons: Record<CavityShape, string> = {
  square: "□",
  rounded: "▢",
  round: "○",
};

interface ControlPanelProps {
  config: DrainConfig;
  setConfig: Dispatch<SetStateAction<DrainConfig>>;
  isExporting: boolean;
  onExport: () => void;
}

export function ControlPanel({
  config,
  setConfig,
  isExporting,
  onExport,
}: ControlPanelProps) {
  const { t } = useI18n();

  const updateNumber = (key: NumericConfigKey, value: number) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const updateShape = (shape: CavityShape) => {
    setConfig((current) => ({ ...current, shape }));
  };

  return (
    <aside className="control-panel" aria-label={t("panel.ariaLabel")}>
      <header className="panel-header">
        <div>
          <h1>{t("panel.title")}</h1>
        </div>
        <LanguageSelector />
      </header>

      <section className="control-section" aria-labelledby="dimensions-title">
        <div className="section-heading">
          <h2 id="dimensions-title">{t("section.dimensions")}</h2>
        </div>
        {dimensionControls.map((control) => (
          <RangeControl
            key={control.key}
            control={control}
            label={t(`controls.${control.key}` as TranslationKey)}
            value={config[control.key]}
            onChange={(value) => updateNumber(control.key, value)}
          />
        ))}
      </section>

      <section className="control-section" aria-labelledby="pattern-title">
        <div className="section-heading">
          <h2 id="pattern-title">{t("section.pattern")}</h2>
        </div>
        <RangeControl
          control={cavityControl}
          label={t("controls.cavities")}
          value={config.cavities}
          onChange={(value) => updateNumber("cavities", value)}
        />
        <fieldset className="shape-fieldset">
          <legend>{t("shape.legend")}</legend>
          <div className="shape-options">
            {cavityShapes.map((shape) => (
              <button
                key={shape}
                type="button"
                className={
                  config.shape === shape
                    ? "shape-button is-active"
                    : "shape-button"
                }
                aria-pressed={config.shape === shape}
                onClick={() => updateShape(shape)}
              >
                <span aria-hidden="true">{shapeIcons[shape]}</span>
                {t(`shape.${shape}`)}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <footer className="panel-footer">
        <button
          className="export-button"
          type="button"
          disabled={isExporting}
          onClick={onExport}
        >
          <span>
            {isExporting ? t("export.generating") : t("export.download")}
          </span>
          <span aria-hidden="true">↘</span>
        </button>
      </footer>
    </aside>
  );
}
