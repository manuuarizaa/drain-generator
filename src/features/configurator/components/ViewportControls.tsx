import { useI18n } from "../../../app/useI18n";

interface ViewportControlsProps {
  isAutoRotating: boolean;
  onRotate: (horizontal: number, vertical?: number) => void;
  onZoom: (factor: number) => void;
  onReset: () => void;
  onTogglePause: () => void;
}

export function ViewportControls({
  isAutoRotating,
  onRotate,
  onZoom,
  onReset,
  onTogglePause,
}: ViewportControlsProps) {
  const { t } = useI18n();

  return (
    <nav
      className="language-selector viewport-controls"
      aria-label={t("viewport.controls")}
    >
      <button
        type="button"
        aria-label={t("viewport.rotateLeft")}
        title={t("viewport.rotateLeft")}
        onClick={() => onRotate(-0.22)}
      >
        ←
      </button>
      <button
        type="button"
        aria-label={t("viewport.rotateRight")}
        title={t("viewport.rotateRight")}
        onClick={() => onRotate(0.22)}
      >
        →
      </button>
      <button
        type="button"
        aria-label={t("viewport.zoomOut")}
        title={t("viewport.zoomOut")}
        onClick={() => onZoom(0.86)}
      >
        −
      </button>
      <button
        type="button"
        aria-label={t("viewport.zoomIn")}
        title={t("viewport.zoomIn")}
        onClick={() => onZoom(1.14)}
      >
        +
      </button>
      <button
        type="button"
        aria-label={t("viewport.reset")}
        title={t("viewport.reset")}
        onClick={onReset}
      >
        ⌂
      </button>
      <button
        type="button"
        className={isAutoRotating ? "is-active" : undefined}
        aria-label={isAutoRotating ? t("viewport.pause") : t("viewport.resume")}
        title={isAutoRotating ? t("viewport.pause") : t("viewport.resume")}
        aria-pressed={!isAutoRotating}
        onClick={onTogglePause}
      >
        {isAutoRotating ? "Ⅱ" : "▶"}
      </button>
    </nav>
  );
}
