import { describe, expect, it } from "vitest";
import { defaultConfig, getMaxCornerRadius, getSafeConfig } from "./config";

describe("drain configuration limits", () => {
  it("limits the corner radius to the border width", () => {
    expect(getMaxCornerRadius(105, 5)).toBe(5);
    expect(
      getSafeConfig({
        ...defaultConfig,
        border: 5,
        cornerRadius: 30,
      }).cornerRadius,
    ).toBe(5);
  });

  it("reduces the corner radius when the border becomes narrower", () => {
    const config = getSafeConfig({
      ...defaultConfig,
      border: 2,
      cornerRadius: 8,
    });

    expect(config.border).toBe(2);
    expect(config.cornerRadius).toBe(2);
  });

  it("calculates the radius from the already-normalized border", () => {
    const config = getSafeConfig({
      ...defaultConfig,
      size: 60,
      border: 100,
      cornerRadius: 100,
    });

    expect(config.border).toBe(29);
    expect(config.cornerRadius).toBe(29);
  });
});
