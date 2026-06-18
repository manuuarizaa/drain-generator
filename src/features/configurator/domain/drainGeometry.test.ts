import { describe, expect, it } from "vitest";
import { CONFIG_LIMITS, defaultConfig } from "./config";
import type { Point2, Point3, Triangle } from "./drainGeometry";
import {
  GEOMETRY_CONSTANTS,
  createDrainGeometry,
  createDrainLayout,
} from "./drainGeometry";

function polygonArea(points: readonly Point2[]): number {
  return Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      if (!next) throw new Error("missing polygon point");
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2,
  );
}

function triangleArea([a, b, c]: Triangle): number {
  const ab: Point3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac: Point3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return (
    Math.hypot(
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ) / 2
  );
}

function vertexKey(point: Point3): string {
  return point.map((coordinate) => coordinate.toPrecision(15)).join(",");
}

function edgeKey(a: Point3, b: Point3): string {
  return [vertexKey(a), vertexKey(b)].sort().join("|");
}

describe("shared drain geometry", () => {
  it.each(["square", "rounded", "round"] as const)(
    "builds a closed, outward-wound %s mesh",
    (shape) => {
      const geometry = createDrainGeometry({ ...defaultConfig, shape });
      const incidence = new Map<string, number>();

      for (const triangle of geometry.triangles) {
        expect(triangleArea(triangle)).toBeGreaterThan(
          GEOMETRY_CONSTANTS.areaEpsilon,
        );
        for (let index = 0; index < 3; index += 1) {
          const a = triangle[index];
          const b = triangle[(index + 1) % 3];
          if (!a || !b) throw new Error("missing triangle vertex");
          const key = edgeKey(a, b);
          incidence.set(key, (incidence.get(key) ?? 0) + 1);
        }
      }

      const invalidIncidence = [...incidence.entries()].filter(
        ([, count]) => count !== 2,
      );
      expect(
        invalidIncidence,
        JSON.stringify(invalidIncidence.slice(0, 5)),
      ).toEqual([]);
      expect(geometry.volumeMm3).toBeGreaterThan(0);
      const expectedVolume =
        (polygonArea(geometry.layout.outer) -
          geometry.layout.holes.reduce(
            (sum, hole) => sum + polygonArea(hole),
            0,
          )) *
        geometry.layout.config.height;
      expect(geometry.volumeMm3).toBeCloseTo(expectedVolume, 7);
    },
  );

  it("keeps the maximum normalized grid inside the inner opening", () => {
    const layout = createDrainLayout({
      ...defaultConfig,
      size: CONFIG_LIMITS.size.min,
      border: CONFIG_LIMITS.border.max,
      cavities: CONFIG_LIMITS.cavities.max,
    });

    expect(layout.holes).toHaveLength(CONFIG_LIMITS.cavities.max ** 2);
    expect(layout.cavitySizeMm).toBeGreaterThanOrEqual(
      GEOMETRY_CONSTANTS.minimumCavitySizeMm,
    );
    expect(layout.gridWidthMm + 2 * layout.edgeMarginMm).toBeCloseTo(
      layout.innerWidthMm,
      10,
    );
  });

  it("has exact millimetre bounds after normalizing hostile input", () => {
    const geometry = createDrainGeometry({
      ...defaultConfig,
      size: 999,
      height: -2,
      cavities: 2.2,
    });
    expect(geometry.bounds).toEqual({
      min: [-CONFIG_LIMITS.size.max / 2, -CONFIG_LIMITS.size.max / 2, 0],
      max: [
        CONFIG_LIMITS.size.max / 2,
        CONFIG_LIMITS.size.max / 2,
        CONFIG_LIMITS.height.min,
      ],
    });
    expect(geometry.layout.holes).toHaveLength(4);
  });
});
