import { Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../../domain/config";
import { createDrainGeometry } from "../../domain/drainGeometry";
import {
  PREVIEW_SCALE_UNITS_PER_MM,
  createDrainModel,
  disposeGroup,
} from "./drainModel";

describe("Three preview adapter", () => {
  it("renders exactly the shared pass-through mesh without an artificial base", () => {
    const geometry = createDrainGeometry(defaultConfig);
    const material = new MeshStandardMaterial();
    const model = createDrainModel(defaultConfig, material, material);
    const mesh = model.group.children[0];
    expect(mesh).toBeInstanceOf(Mesh);
    if (!(mesh instanceof Mesh)) throw new Error("preview mesh missing");

    expect(mesh.geometry.getAttribute("position").count).toBe(
      geometry.triangles.length * 3,
    );
    expect(mesh.geometry.boundingBox?.min.x).toBeCloseTo(
      geometry.bounds.min[0] * PREVIEW_SCALE_UNITS_PER_MM,
    );
    expect(mesh.geometry.boundingBox?.max.z).toBeCloseTo(
      geometry.bounds.max[2] * PREVIEW_SCALE_UNITS_PER_MM,
    );

    const centralHole =
      geometry.layout.holes[Math.floor(geometry.layout.holes.length / 2)];
    expect(centralHole).toBeDefined();
    const [centerX, centerY] = centralHole!.reduce(
      (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
      [0, 0],
    );
    const divisor = centralHole!.length;
    const hasSolidBottomAcrossHole = geometry.triangles.some(
      (triangle) =>
        triangle.every((point) => point[2] === 0) &&
        triangle.every(
          (point) =>
            Math.hypot(
              point[0] - centerX / divisor,
              point[1] - centerY / divisor,
            ) <
            geometry.layout.cavitySizeMm / 3,
        ),
    );
    expect(hasSolidBottomAcrossHole).toBe(false);

    disposeGroup(model.group);
    material.dispose();
  });
});
