import type { DrainConfig } from "./config";
import {
  createDrainGeometry,
  createHoleOutline,
  createRoundedOutline,
} from "./drainGeometry";
import {
  BINARY_STL_CONSTANTS,
  BINARY_STL_PREFIX_BYTES,
  encodeBinaryStl,
} from "../adapters/stl/binaryStl";

export type { Point2, Point3, Triangle } from "./drainGeometry";
export {
  createHoleOutline,
  createRoundedOutline,
  encodeBinaryStl,
  BINARY_STL_CONSTANTS,
  BINARY_STL_PREFIX_BYTES,
};

export interface StlModel {
  buffer: ArrayBuffer;
  triangleCount: number;
  fileName: string;
}

export function createStlModel(rawConfig: DrainConfig): StlModel {
  const geometry = createDrainGeometry(rawConfig);
  const { config } = geometry.layout;
  return {
    buffer: encodeBinaryStl(geometry.triangles),
    triangleCount: geometry.triangles.length,
    fileName: `sumidero_${config.size}x${config.size}_h${config.height}mm_${config.shape}.stl`,
  };
}
