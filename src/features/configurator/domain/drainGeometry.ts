import earcut, { deviation as getTriangulationDeviation } from "earcut";
import type { CavityShape, DrainConfig } from "./config";
import { getSafeConfig } from "./config";

export type Point2 = readonly [number, number];
export type Point3 = readonly [number, number, number];
export type Triangle = readonly [Point3, Point3, Point3];

export const GEOMETRY_CONSTANTS = {
  gridGapRatio: 0.15,
  minimumEdgeMarginMm: 2,
  minimumCavitySizeMm: 0.25,
  outerCornerSegments: 16,
  roundedCavityCornerSegments: 6,
  roundCavitySegments: 20,
  roundedCavityRadiusRatio: 0.35,
  triangulationDeviationTolerance: 1e-10,
  areaEpsilon: 1e-9,
} as const;

export interface DrainLayout {
  config: DrainConfig;
  innerWidthMm: number;
  edgeMarginMm: number;
  cavitySizeMm: number;
  gapMm: number;
  gridWidthMm: number;
  outer: readonly Point2[];
  holes: readonly (readonly Point2[])[];
}

export interface DrainGeometry {
  layout: DrainLayout;
  triangles: readonly Triangle[];
  bounds: {
    min: Point3;
    max: Point3;
  };
  volumeMm3: number;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition)
    throw new Error(`Drain geometry invariant failed: ${message}`);
}

function signedArea(outline: readonly Point2[]): number {
  let area = 0;
  for (let index = 0; index < outline.length; index += 1) {
    const current = outline[index];
    const next = outline[(index + 1) % outline.length];
    invariant(current && next, "outline contains a missing point");
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function orient(
  outline: readonly Point2[],
  counterClockwise: boolean,
): Point2[] {
  const isCounterClockwise = signedArea(outline) > 0;
  return isCounterClockwise === counterClockwise
    ? [...outline]
    : [...outline].reverse();
}

export function createRoundedOutline(
  width: number,
  radius: number,
  segments = GEOMETRY_CONSTANTS.outerCornerSegments,
): Point2[] {
  invariant(
    Number.isFinite(width) && width > 0,
    "outline width must be positive",
  );
  invariant(
    Number.isInteger(segments) && segments >= 1,
    "outline segments must be a positive integer",
  );

  const half = width / 2;
  const safeRadius = Math.max(0, Math.min(radius, half));
  if (safeRadius <= GEOMETRY_CONSTANTS.areaEpsilon) {
    return [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
    ];
  }

  const points: Point2[] = [];
  const corners = [
    [half - safeRadius, -half + safeRadius, -Math.PI / 2, 0],
    [half - safeRadius, half - safeRadius, 0, Math.PI / 2],
    [-half + safeRadius, half - safeRadius, Math.PI / 2, Math.PI],
    [-half + safeRadius, -half + safeRadius, Math.PI, (3 * Math.PI) / 2],
  ] as const;

  for (const [centerX, centerY, angleStart, angleEnd] of corners) {
    for (let index = 0; index < segments; index += 1) {
      const angle = angleStart + ((angleEnd - angleStart) * index) / segments;
      points.push([
        centerX + safeRadius * Math.cos(angle),
        centerY + safeRadius * Math.sin(angle),
      ]);
    }
  }
  return orient(points, true);
}

export function createHoleOutline(
  shape: CavityShape,
  centerX: number,
  centerY: number,
  halfSize: number,
): Point2[] {
  invariant(
    Number.isFinite(centerX) &&
      Number.isFinite(centerY) &&
      Number.isFinite(halfSize) &&
      halfSize > 0,
    "cavity dimensions must be finite and positive",
  );

  if (shape === "round") {
    return orient(
      Array.from(
        { length: GEOMETRY_CONSTANTS.roundCavitySegments },
        (_, index): Point2 => {
          const angle =
            (2 * Math.PI * index) / GEOMETRY_CONSTANTS.roundCavitySegments;
          return [
            centerX + halfSize * Math.cos(angle),
            centerY + halfSize * Math.sin(angle),
          ];
        },
      ),
      false,
    );
  }

  if (shape === "rounded") {
    const radius = halfSize * GEOMETRY_CONSTANTS.roundedCavityRadiusRatio;
    const points: Point2[] = [];
    const corners = [
      [
        centerX + halfSize - radius,
        centerY - halfSize + radius,
        -Math.PI / 2,
        0,
      ],
      [
        centerX + halfSize - radius,
        centerY + halfSize - radius,
        0,
        Math.PI / 2,
      ],
      [
        centerX - halfSize + radius,
        centerY + halfSize - radius,
        Math.PI / 2,
        Math.PI,
      ],
      [
        centerX - halfSize + radius,
        centerY - halfSize + radius,
        Math.PI,
        (3 * Math.PI) / 2,
      ],
    ] as const;
    for (const [cornerX, cornerY, angleStart, angleEnd] of corners) {
      for (
        let index = 0;
        index < GEOMETRY_CONSTANTS.roundedCavityCornerSegments;
        index += 1
      ) {
        const angle =
          angleStart +
          ((angleEnd - angleStart) * index) /
            GEOMETRY_CONSTANTS.roundedCavityCornerSegments;
        points.push([
          cornerX + radius * Math.cos(angle),
          cornerY + radius * Math.sin(angle),
        ]);
      }
    }
    return orient(points, false);
  }

  invariant(shape === "square", `unsupported cavity shape: ${String(shape)}`);
  return [
    [centerX - halfSize, centerY - halfSize],
    [centerX - halfSize, centerY + halfSize],
    [centerX + halfSize, centerY + halfSize],
    [centerX + halfSize, centerY - halfSize],
  ];
}

export function createDrainLayout(rawConfig: DrainConfig): DrainLayout {
  const config = getSafeConfig(rawConfig);
  const innerWidthMm = config.size - 2 * config.border;
  const edgeMarginMm = Math.max(
    GEOMETRY_CONSTANTS.minimumEdgeMarginMm,
    innerWidthMm * 0.012,
  );
  const denominator =
    config.cavities + GEOMETRY_CONSTANTS.gridGapRatio * (config.cavities - 1);
  const cavitySizeMm = (innerWidthMm - 2 * edgeMarginMm) / denominator;
  const gapMm = cavitySizeMm * GEOMETRY_CONSTANTS.gridGapRatio;
  const gridWidthMm =
    config.cavities * cavitySizeMm + (config.cavities - 1) * gapMm;

  invariant(innerWidthMm > 0, "inner width must be positive");
  invariant(
    cavitySizeMm >= GEOMETRY_CONSTANTS.minimumCavitySizeMm,
    "normalized cavity grid does not fit the available inner area",
  );
  invariant(
    gridWidthMm + 2 * edgeMarginMm <=
      innerWidthMm + GEOMETRY_CONSTANTS.areaEpsilon,
    "cavity grid exceeds the inner area",
  );

  const origin = -gridWidthMm / 2;
  const holes: Point2[][] = [];
  for (let row = 0; row < config.cavities; row += 1) {
    for (let column = 0; column < config.cavities; column += 1) {
      holes.push(
        createHoleOutline(
          config.shape,
          origin + column * (cavitySizeMm + gapMm) + cavitySizeMm / 2,
          origin + row * (cavitySizeMm + gapMm) + cavitySizeMm / 2,
          cavitySizeMm / 2,
        ),
      );
    }
  }

  return {
    config,
    innerWidthMm,
    edgeMarginMm,
    cavitySizeMm,
    gapMm,
    gridWidthMm,
    outer: createRoundedOutline(config.size, config.cornerRadius),
    holes,
  };
}

function triangleArea(triangle: Triangle): number {
  const [a, b, c] = triangle;
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]] as const;
  return (
    Math.hypot(
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ) / 2
  );
}

function signedVolume(triangles: readonly Triangle[]): number {
  return triangles.reduce((volume, [a, b, c]) => {
    return (
      volume +
      (a[0] * (b[1] * c[2] - b[2] * c[1]) +
        a[1] * (b[2] * c[0] - b[0] * c[2]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
        6
    );
  }, 0);
}

type Triangle2 = readonly [Point2, Point2, Point2];

function conformAxisAlignedEdges(
  triangles: readonly Triangle2[],
  boundaryPoints: readonly Point2[],
): Triangle2[] {
  const pending = [...triangles];
  const result: Triangle2[] = [];

  while (pending.length > 0) {
    const triangle = pending.pop();
    invariant(triangle, "missing cap triangle");
    let split = false;

    for (let edgeIndex = 0; edgeIndex < 3 && !split; edgeIndex += 1) {
      const start = triangle[edgeIndex];
      const end = triangle[(edgeIndex + 1) % 3];
      const opposite = triangle[(edgeIndex + 2) % 3];
      invariant(start && end && opposite, "missing cap vertex");
      const horizontal = start[1] === end[1];
      const vertical = start[0] === end[0];
      if (!horizontal && !vertical) continue;

      const points = boundaryPoints
        .filter((point) => {
          if (horizontal && point[1] === start[1]) {
            return (
              point[0] > Math.min(start[0], end[0]) &&
              point[0] < Math.max(start[0], end[0])
            );
          }
          if (vertical && point[0] === start[0]) {
            return (
              point[1] > Math.min(start[1], end[1]) &&
              point[1] < Math.max(start[1], end[1])
            );
          }
          return false;
        })
        .sort((a, b) =>
          horizontal
            ? (a[0] - start[0]) * Math.sign(end[0] - start[0]) -
              (b[0] - start[0]) * Math.sign(end[0] - start[0])
            : (a[1] - start[1]) * Math.sign(end[1] - start[1]) -
              (b[1] - start[1]) * Math.sign(end[1] - start[1]),
        );

      if (points.length > 0) {
        const chain = [start, ...points, end];
        for (let index = 0; index < chain.length - 1; index += 1) {
          const a = chain[index];
          const b = chain[index + 1];
          invariant(a && b, "invalid conforming edge split");
          pending.push([a, b, opposite]);
        }
        split = true;
      }
    }

    if (!split) result.push(triangle);
  }
  return result;
}

export function createDrainGeometry(rawConfig: DrainConfig): DrainGeometry {
  const layout = createDrainLayout(rawConfig);
  const flat: number[] = [];
  const holeIndices: number[] = [];
  for (const point of layout.outer) flat.push(...point);
  for (const hole of layout.holes) {
    holeIndices.push(flat.length / 2);
    for (const point of hole) flat.push(...point);
  }

  const indices = earcut(flat, holeIndices, 2);
  const deviation = getTriangulationDeviation(flat, holeIndices, 2, indices);
  invariant(
    Number.isFinite(deviation) &&
      deviation <= GEOMETRY_CONSTANTS.triangulationDeviationTolerance,
    `earcut triangulation deviation ${deviation} exceeds tolerance`,
  );

  const points: Point2[] = [];
  for (let index = 0; index < flat.length; index += 2) {
    const x = flat[index];
    const y = flat[index + 1];
    invariant(x !== undefined && y !== undefined, "invalid flattened contour");
    points.push([x, y]);
  }

  const capTriangles: Triangle2[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    const a = points[indices[index] ?? -1];
    const b = points[indices[index + 1] ?? -1];
    const c = points[indices[index + 2] ?? -1];
    invariant(a && b && c, "earcut returned an invalid vertex index");
    const area2 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    capTriangles.push(area2 > 0 ? [a, b, c] : [a, c, b]);
  }

  const conformingCapTriangles =
    layout.config.shape === "square"
      ? conformAxisAlignedEdges(capTriangles, points)
      : capTriangles;
  const triangles: Triangle[] = [];
  const height = layout.config.height;
  for (const [a, b, c] of conformingCapTriangles) {
    const top: Triangle = [
      [a[0], a[1], height],
      [b[0], b[1], height],
      [c[0], c[1], height],
    ];
    triangles.push(top, [
      [top[2][0], top[2][1], 0],
      [top[1][0], top[1][1], 0],
      [top[0][0], top[0][1], 0],
    ]);
  }

  const addWalls = (outline: readonly Point2[]) => {
    for (let index = 0; index < outline.length; index += 1) {
      const point0 = outline[index];
      const point1 = outline[(index + 1) % outline.length];
      invariant(point0 && point1, "wall outline contains a missing point");
      const bottom0: Point3 = [point0[0], point0[1], 0];
      const bottom1: Point3 = [point1[0], point1[1], 0];
      const top0: Point3 = [point0[0], point0[1], height];
      const top1: Point3 = [point1[0], point1[1], height];
      triangles.push([bottom0, bottom1, top1], [bottom0, top1, top0]);
    }
  };
  addWalls(layout.outer);
  for (const hole of layout.holes) addWalls(hole);

  invariant(
    triangles.every(
      (triangle) => triangleArea(triangle) > GEOMETRY_CONSTANTS.areaEpsilon,
    ),
    "mesh contains a degenerate triangle",
  );
  const volumeMm3 = signedVolume(triangles);
  invariant(volumeMm3 > 0, "mesh winding must produce positive volume");

  return {
    layout,
    triangles,
    bounds: {
      min: [-layout.config.size / 2, -layout.config.size / 2, 0],
      max: [
        layout.config.size / 2,
        layout.config.size / 2,
        layout.config.height,
      ],
    },
    volumeMm3,
  };
}
