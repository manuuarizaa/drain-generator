export const cavityShapes = ["square", "rounded", "round"] as const;

export type CavityShape = (typeof cavityShapes)[number];

export interface DrainConfig {
  size: number;
  height: number;
  cornerRadius: number;
  border: number;
  cavities: number;
  shape: CavityShape;
}

export type NumericConfigKey = Exclude<keyof DrainConfig, "shape">;

export const defaultConfig: DrainConfig = {
  size: 105,
  height: 3,
  cornerRadius: 8,
  border: 5,
  cavities: 7,
  shape: "square",
};

export interface ControlDefinition {
  key: NumericConfigKey;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}

export const dimensionControls: readonly ControlDefinition[] = [
  {
    key: "size",
    min: 60,
    max: 200,
    step: 5,
    format: (value) => `${value} mm`,
  },
  {
    key: "height",
    min: 1,
    max: 25,
    step: 1,
    format: (value) => `${value} mm`,
  },
  {
    key: "cornerRadius",
    min: 0,
    max: 30,
    step: 1,
    format: (value) => `${value} mm`,
  },
  {
    key: "border",
    min: 2,
    max: 20,
    step: 1,
    format: (value) => `${value} mm`,
  },
];

export const cavityControl: ControlDefinition = {
  key: "cavities",
  min: 2,
  max: 36,
  step: 1,
  format: (value) => `${value} × ${value}`,
};

export function getSafeConfig(config: DrainConfig): DrainConfig {
  const maxBorder = Math.max(2, config.size / 2 - 1);
  const maxRadius = Math.max(0, config.size / 2 - 0.1);

  return {
    ...config,
    border: Math.min(config.border, maxBorder),
    cornerRadius: Math.min(config.cornerRadius, maxRadius),
  };
}
