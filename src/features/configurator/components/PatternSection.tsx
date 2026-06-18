import { useI18n } from "../../../app/useI18n";
import {
  cavityControl,
  cavityShapes,
  type CavityShape,
  type DrainConfig,
} from "../domain/config";
import { RangeControl } from "./RangeControl";

const shapeIcons: Record<CavityShape, string> = {
  square: "□",
  rounded: "▢",
  round: "○",
};

interface PatternSectionProps {
  config: DrainConfig;
  onCavitiesChange: (value: number) => void;
  onShapeChange: (shape: CavityShape) => void;
}

export function PatternSection({
  config,
  onCavitiesChange,
  onShapeChange,
}: PatternSectionProps) {
  const { t } = useI18n();

  return (
    <section className="control-section" aria-labelledby="pattern-title">
      <div className="section-heading">
        <h2 id="pattern-title">{t("section.pattern")}</h2>
      </div>
      <RangeControl
        control={cavityControl}
        label={t("controls.cavities")}
        value={config.cavities}
        onChange={onCavitiesChange}
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
              onClick={() => onShapeChange(shape)}
            >
              <span aria-hidden="true">{shapeIcons[shape]}</span>
              {t(`shape.${shape}`)}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
