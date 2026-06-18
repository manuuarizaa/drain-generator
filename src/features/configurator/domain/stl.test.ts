import { describe, expect, it } from "vitest";
import { defaultConfig } from "./config";
import {
  BINARY_STL_CONSTANTS,
  BINARY_STL_PREFIX_BYTES,
  createHoleOutline,
  createRoundedOutline,
  createStlModel,
  encodeBinaryStl,
} from "./stl";

describe("STL geometry and encoding", () => {
  it("keeps the compatibility contour APIs", () => {
    expect(createRoundedOutline(100, 0)).toHaveLength(4);
    expect(createRoundedOutline(100, 8, 16)).toHaveLength(64);
    expect(createHoleOutline("square", 0, 0, 2)).toHaveLength(4);
    expect(createHoleOutline("rounded", 0, 0, 2)).toHaveLength(24);
    expect(createHoleOutline("round", 0, 0, 2)).toHaveLength(20);
  });

  it("writes little-endian count, unit normal, vertices, and zero attributes", () => {
    const buffer = encodeBinaryStl([
      [
        [1, 2, 3],
        [2, 2, 3],
        [1, 3, 3],
      ],
    ]);
    const view = new DataView(buffer);

    expect(buffer.byteLength).toBe(
      BINARY_STL_PREFIX_BYTES + BINARY_STL_CONSTANTS.bytesPerTriangle,
    );
    expect(view.getUint32(BINARY_STL_CONSTANTS.headerBytes, true)).toBe(1);
    expect([
      view.getFloat32(BINARY_STL_PREFIX_BYTES, true),
      view.getFloat32(BINARY_STL_PREFIX_BYTES + 4, true),
      view.getFloat32(BINARY_STL_PREFIX_BYTES + 8, true),
    ]).toEqual([0, 0, 1]);
    expect(view.getFloat32(BINARY_STL_PREFIX_BYTES + 12, true)).toBe(1);
    expect(view.getFloat32(BINARY_STL_PREFIX_BYTES + 16, true)).toBe(2);
    expect(view.getFloat32(BINARY_STL_PREFIX_BYTES + 20, true)).toBe(3);
    expect(
      view.getUint16(
        buffer.byteLength - BINARY_STL_CONSTANTS.attributeBytes,
        true,
      ),
    ).toBe(0);
  });

  it("rejects degenerate and non-finite triangles explicitly", () => {
    expect(() =>
      encodeBinaryStl([
        [
          [0, 0, 0],
          [1, 0, 0],
          [2, 0, 0],
        ],
      ]),
    ).toThrow(/degenerate/);
    expect(() =>
      encodeBinaryStl([
        [
          [0, 0, 0],
          [1, 0, 0],
          [0, Number.NaN, 0],
        ],
      ]),
    ).toThrow(/degenerate|non-finite/);
  });

  it("exports the shared mesh with a descriptive normalized filename", () => {
    const model = createStlModel({
      ...defaultConfig,
      cavities: 7.4,
      shape: "round",
    });
    const view = new DataView(model.buffer);

    expect(model.triangleCount).toBeGreaterThan(100);
    expect(view.getUint32(BINARY_STL_CONSTANTS.headerBytes, true)).toBe(
      model.triangleCount,
    );
    expect(model.buffer.byteLength).toBe(
      BINARY_STL_PREFIX_BYTES +
        model.triangleCount * BINARY_STL_CONSTANTS.bytesPerTriangle,
    );
    expect(model.fileName).toBe("sumidero_105x105_h3mm_round.stl");
  });
});
