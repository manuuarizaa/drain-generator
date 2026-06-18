import type { DrainConfig } from "../domain/config";
import { useI18n } from "../../../app/useI18n";
import { useDrainScene } from "../hooks/useDrainScene";
import { ViewportControls } from "./ViewportControls";
import { ViewportDetails } from "./ViewportDetails";

interface DrainViewportProps {
  config: DrainConfig;
}

export function DrainViewport({ config }: DrainViewportProps) {
  const controls = useDrainScene(config);
  const { t } = useI18n();
  const descriptionId = "viewport-keyboard-help";

  return (
    <main className="viewport">
      <canvas
        ref={controls.canvasRef}
        aria-label={t("viewport.ariaLabel", { size: config.size })}
        aria-describedby={`${descriptionId} viewport-interaction-help`}
        tabIndex={0}
        onPointerDown={controls.onPointerDown}
        onPointerMove={controls.onPointerMove}
        onPointerUp={controls.onPointerUp}
        onPointerCancel={controls.onPointerUp}
        onLostPointerCapture={controls.onLostPointerCapture}
        onWheel={controls.onWheel}
        onKeyDown={controls.onKeyDown}
      />

      <ViewportDetails config={config} />
      <ViewportControls
        isAutoRotating={controls.isAutoRotating}
        onRotate={controls.rotate}
        onZoom={controls.zoomBy}
        onReset={controls.resetView}
        onTogglePause={controls.toggleAutoRotate}
      />

      <p className="interaction-hint" id="viewport-interaction-help">
        <span>{t("viewport.drag")}</span> {t("viewport.rotate")}
        <i />
        <span>{t("viewport.scroll")}</span> {t("viewport.zoom")}
      </p>

      <span id={descriptionId} className="visually-hidden">
        {t("viewport.keyboard")}
      </span>

      {controls.hasWebGlError ? (
        <p role="alert" className="webgl-fallback">
          {t("viewport.webglError")}
        </p>
      ) : null}
    </main>
  );
}
