import type { TranslationKey } from "../../../app/i18n";
import { useI18n } from "../../../app/useI18n";
import {
  dimensionControls,
  getMaxCornerRadius,
  type DrainConfig,
  type NumericConfigKey,
} from "../domain/config";
import { RangeControl } from "./RangeControl";

interface DimensionsSectionProps {
  config: DrainConfig;
  onDimensionChange: (key: NumericConfigKey, value: number) => void;
}

export function DimensionsSection({
  config,
  onDimensionChange,
}: DimensionsSectionProps) {
  const { t } = useI18n();

  return (
    <section className="control-section" aria-labelledby="dimensions-title">
      <div className="section-heading">
        <h2 id="dimensions-title">{t("section.dimensions")}</h2>
      </div>
      {dimensionControls.map((control) => {
        const effectiveControl =
          control.key === "cornerRadius"
            ? {
                ...control,
                max: getMaxCornerRadius(config.size, config.border),
              }
            : control;

        return (
          <RangeControl
            key={control.key}
            control={effectiveControl}
            label={t(`controls.${control.key}` as TranslationKey)}
            value={config[control.key]}
            onChange={(value) => onDimensionChange(control.key, value)}
          />
        );
      })}
    </section>
  );
}
