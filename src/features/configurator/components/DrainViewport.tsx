import type { DrainConfig } from "../domain/config";
import { useI18n } from "../../../app/i18n";
import { useDrainScene } from "../hooks/useDrainScene";

interface DrainViewportProps {
  config: DrainConfig;
}

export function DrainViewport({ config }: DrainViewportProps) {
  const controls = useDrainScene(config);
  const { t } = useI18n();

  return (
    <main className="viewport">
      <canvas
        ref={controls.canvasRef}
        aria-label={t("viewport.ariaLabel", { size: config.size })}
        onPointerDown={controls.onPointerDown}
        onPointerMove={controls.onPointerMove}
        onPointerUp={controls.onPointerUp}
        onPointerCancel={controls.onPointerUp}
        onWheel={controls.onWheel}
      />

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

      <p className="interaction-hint">
        <span>{t("viewport.drag")}</span> {t("viewport.rotate")}
        <i />
        <span>{t("viewport.scroll")}</span> {t("viewport.zoom")}
      </p>
    </main>
  );
}
