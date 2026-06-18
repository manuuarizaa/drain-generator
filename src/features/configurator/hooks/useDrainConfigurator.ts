import { useCallback, useState } from "react";
import {
  defaultConfig,
  getSafeConfig,
  type CavityShape,
  type DrainConfig,
  type NumericConfigKey,
} from "../domain/config";

export interface DrainConfiguratorActions {
  changeDimension: (key: NumericConfigKey, value: number) => void;
  changeShape: (shape: CavityShape) => void;
  resetConfiguration: () => void;
}

export function useDrainConfigurator() {
  const [config, setConfig] = useState<DrainConfig>(defaultConfig);

  const changeDimension = useCallback(
    (key: NumericConfigKey, value: number) => {
      setConfig((current) => getSafeConfig({ ...current, [key]: value }));
    },
    [],
  );

  const changeShape = useCallback((shape: CavityShape) => {
    setConfig((current) => ({ ...current, shape }));
  }, []);

  const resetConfiguration = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return {
    config,
    actions: {
      changeDimension,
      changeShape,
      resetConfiguration,
    },
  };
}
