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

export const CONFIG_LIMITS = {
  size: { min: 60, max: 200 },
  height: { min: 1, max: 25 },
  cornerRadius: { min: 0, max: 30 },
  border: { min: 2, max: 20 },
  cavities: { min: 2, max: 36 },
} as const;

const MIN_INNER_WIDTH_MM = 2;

export const defaultConfig: DrainConfig = {
  size: 105,
  height: 3,
  cornerRadius: 5,
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
    ...CONFIG_LIMITS.size,
    step: 5,
    format: (value) => `${value} mm`,
  },
  {
    key: "height",
    ...CONFIG_LIMITS.height,
    step: 1,
    format: (value) => `${value} mm`,
  },
  {
    key: "cornerRadius",
    ...CONFIG_LIMITS.cornerRadius,
    step: 1,
    format: (value) => `${value} mm`,
  },
  {
    key: "border",
    ...CONFIG_LIMITS.border,
    step: 1,
    format: (value) => `${value} mm`,
  },
];

export const cavityControl: ControlDefinition = {
  key: "cavities",
  ...CONFIG_LIMITS.cavities,
  step: 1,
  format: (value) => `${value} × ${value}`,
};

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getMaxCornerRadius(size: number, border: number): number {
  const safeSize = clamp(
    finiteOr(size, defaultConfig.size),
    CONFIG_LIMITS.size.min,
    CONFIG_LIMITS.size.max,
  );
  const safeBorder = clamp(
    finiteOr(border, defaultConfig.border),
    CONFIG_LIMITS.border.min,
    Math.min(CONFIG_LIMITS.border.max, (safeSize - MIN_INNER_WIDTH_MM) / 2),
  );

  return Math.min(CONFIG_LIMITS.cornerRadius.max, safeBorder);
}

export function getSafeConfig(config: DrainConfig): DrainConfig {
  const size = clamp(
    finiteOr(config.size, defaultConfig.size),
    CONFIG_LIMITS.size.min,
    CONFIG_LIMITS.size.max,
  );
  const height = clamp(
    finiteOr(config.height, defaultConfig.height),
    CONFIG_LIMITS.height.min,
    CONFIG_LIMITS.height.max,
  );
  const maxBorder = Math.min(
    CONFIG_LIMITS.border.max,
    (size - MIN_INNER_WIDTH_MM) / 2,
  );
  const border = clamp(
    finiteOr(config.border, defaultConfig.border),
    CONFIG_LIMITS.border.min,
    maxBorder,
  );
  const cornerRadius = clamp(
    finiteOr(config.cornerRadius, defaultConfig.cornerRadius),
    CONFIG_LIMITS.cornerRadius.min,
    getMaxCornerRadius(size, border),
  );
  const cavities = clamp(
    Math.round(finiteOr(config.cavities, defaultConfig.cavities)),
    CONFIG_LIMITS.cavities.min,
    CONFIG_LIMITS.cavities.max,
  );
  const shape = cavityShapes.includes(config.shape)
    ? config.shape
    : defaultConfig.shape;

  return { size, height, cornerRadius, border, cavities, shape };
}
