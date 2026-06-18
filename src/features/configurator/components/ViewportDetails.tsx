import { useI18n } from "../../../app/useI18n";
import type { DrainConfig } from "../domain/config";

export function ViewportDetails({ config }: { config: DrainConfig }) {
  const { t } = useI18n();

  return (
    <>
      <div className="viewport-meta">
        <p className="dimension-display">
          {config.size} <span>×</span> {config.size}
          <small>mm</small>
        </p>
        <p className="model-detail">
          H {config.height} mm · {config.cavities} × {config.cavities} ·{" "}
          {t(`shape.${config.shape}`)}
        </p>
      </div>

      <div className="orientation-mark" aria-hidden="true">
        <span className="axis axis-x">X</span>
        <span className="axis axis-y">Y</span>
        <span className="axis axis-z">Z</span>
      </div>
    </>
  );
}
