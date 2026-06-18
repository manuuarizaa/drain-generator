import { describe, expect, it } from "vitest";
import {
  CONFIG_LIMITS,
  cavityControl,
  defaultConfig,
  dimensionControls,
  getMaxCornerRadius,
  getSafeConfig,
} from "./config";

describe("drain configuration normalization", () => {
  it("clamps every numeric field and normalizes the cavity count to an integer", () => {
    expect(
      getSafeConfig({
        size: -Infinity,
        height: 1_000,
        border: -10,
        cornerRadius: 1_000,
        cavities: 7.6,
        shape: "round",
      }),
    ).toEqual({
      size: defaultConfig.size,
      height: CONFIG_LIMITS.height.max,
      border: CONFIG_LIMITS.border.min,
      cornerRadius: CONFIG_LIMITS.border.min,
      cavities: 8,
      shape: "round",
    });
  });

  it("uses defaults for non-finite numbers and an unsupported runtime shape", () => {
    const unsafe = {
      size: Number.NaN,
      height: Infinity,
      border: Number.NaN,
      cornerRadius: -Infinity,
      cavities: Number.NaN,
      shape: "triangle",
    };

    expect(getSafeConfig(unsafe as never)).toEqual(defaultConfig);
  });

  it("limits border and corner radius using the normalized size", () => {
    const config = getSafeConfig({
      ...defaultConfig,
      size: 60,
      border: 100,
      cornerRadius: 100,
    });

    expect(config.border).toBe(CONFIG_LIMITS.border.max);
    expect(config.cornerRadius).toBe(CONFIG_LIMITS.border.max);
    expect(getMaxCornerRadius(60, 100)).toBe(CONFIG_LIMITS.border.max);
  });

  it("does not mutate its input", () => {
    const input = { ...defaultConfig, cavities: 3.7 };
    const result = getSafeConfig(input);
    expect(result).not.toBe(input);
    expect(input.cavities).toBe(3.7);
  });

  it("formats control values using the shared control schema", () => {
    expect(dimensionControls.map((control) => control.format(12))).toEqual([
      "12 mm",
      "12 mm",
      "12 mm",
      "12 mm",
    ]);
    expect(cavityControl.format(7)).toBe("7 × 7");
  });
});
