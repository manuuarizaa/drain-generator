import { lazy, Suspense } from "react";
import { ControlPanel } from "./ControlPanel";
import { useDrainConfigurator } from "../hooks/useDrainConfigurator";
import { useStlExport } from "../hooks/useStlExport";

const DrainViewport = lazy(() =>
  import("./DrainViewport").then((module) => ({
    default: module.DrainViewport,
  })),
);

export function Configurator() {
  const { config, actions } = useDrainConfigurator();
  const { exportStl, isExporting, error } = useStlExport(config);

  return (
    <div className="app-shell">
      <ControlPanel
        config={config}
        actions={actions}
        isExporting={isExporting}
        exportError={error}
        onExport={() => {
          void exportStl();
        }}
      />
      <Suspense fallback={<main className="viewport" aria-busy="true" />}>
        <DrainViewport config={config} />
      </Suspense>
    </div>
  );
}
