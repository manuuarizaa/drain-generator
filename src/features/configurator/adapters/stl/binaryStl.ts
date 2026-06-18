import type { Triangle } from "../../domain/drainGeometry";

export const BINARY_STL_CONSTANTS = {
  headerBytes: 80,
  triangleCountBytes: 4,
  normalBytes: 12,
  vertexBytes: 12,
  verticesPerTriangle: 3,
  attributeBytes: 2,
  bytesPerTriangle: 50,
} as const;

export const BINARY_STL_PREFIX_BYTES =
  BINARY_STL_CONSTANTS.headerBytes + BINARY_STL_CONSTANTS.triangleCountBytes;

function writeVector(
  view: DataView,
  offset: number,
  vector: readonly [number, number, number],
): number {
  for (const component of vector) {
    if (!Number.isFinite(component)) {
      throw new Error("Binary STL cannot encode a non-finite component");
    }
    view.setFloat32(offset, component, true);
    offset += Float32Array.BYTES_PER_ELEMENT;
  }
  return offset;
}

export function encodeBinaryStl(triangles: readonly Triangle[]): ArrayBuffer {
  if (triangles.length > 0xffffffff) {
    throw new Error("Binary STL triangle count exceeds uint32 capacity");
  }

  const buffer = new ArrayBuffer(
    BINARY_STL_PREFIX_BYTES +
      triangles.length * BINARY_STL_CONSTANTS.bytesPerTriangle,
  );
  const view = new DataView(buffer);
  view.setUint32(BINARY_STL_CONSTANTS.headerBytes, triangles.length, true);
  let offset = BINARY_STL_PREFIX_BYTES;

  for (const [vertex0, vertex1, vertex2] of triangles) {
    const ax = vertex1[0] - vertex0[0];
    const ay = vertex1[1] - vertex0[1];
    const az = vertex1[2] - vertex0[2];
    const bx = vertex2[0] - vertex0[0];
    const by = vertex2[1] - vertex0[1];
    const bz = vertex2[2] - vertex0[2];
    const cross = [
      ay * bz - az * by,
      az * bx - ax * bz,
      ax * by - ay * bx,
    ] as const;
    const length = Math.hypot(...cross);
    if (!Number.isFinite(length) || length === 0) {
      throw new Error("Binary STL cannot encode a degenerate triangle");
    }
    offset = writeVector(view, offset, [
      cross[0] / length,
      cross[1] / length,
      cross[2] / length,
    ]);
    offset = writeVector(view, offset, vertex0);
    offset = writeVector(view, offset, vertex1);
    offset = writeVector(view, offset, vertex2);
    view.setUint16(offset, 0, true);
    offset += BINARY_STL_CONSTANTS.attributeBytes;
  }

  return buffer;
}
