import { LanguageSelector } from "../../../app/LanguageSelector";
import { useI18n } from "../../../app/useI18n";
import type { DrainConfig } from "../domain/config";
import type { DrainConfiguratorActions } from "../hooks/useDrainConfigurator";
import { DimensionsSection } from "./DimensionsSection";
import { PatternSection } from "./PatternSection";

interface ControlPanelProps {
  config: DrainConfig;
  actions: DrainConfiguratorActions;
  isExporting: boolean;
  exportError: unknown;
  onExport: () => void;
}

export function ControlPanel({
  config,
  actions,
  isExporting,
  exportError,
  onExport,
}: ControlPanelProps) {
  const { t } = useI18n();

  return (
    <aside className="control-panel" aria-label={t("panel.ariaLabel")}>
      <header className="panel-header">
        <div>
          <h1>{t("panel.title")}</h1>
        </div>
        <LanguageSelector />
      </header>

      <DimensionsSection
        config={config}
        onDimensionChange={actions.changeDimension}
      />
      <PatternSection
        config={config}
        onCavitiesChange={(value) => actions.changeDimension("cavities", value)}
        onShapeChange={actions.changeShape}
      />

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
        {exportError ? (
          <p role="alert">{t("export.error")}</p>
        ) : (
          <p aria-live="polite">
            {isExporting ? t("export.generatingStatus") : ""}
          </p>
        )}
      </footer>
    </aside>
  );
}
