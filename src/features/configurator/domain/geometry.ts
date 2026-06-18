import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from "three";
import type { BufferGeometry, Material } from "three";
import type { CavityShape, DrainConfig } from "./config";
import { getSafeConfig } from "./config";

const VISUAL_SCALE = 0.1;
const HEIGHT_EMPHASIS = 1;

function addRoundedRectangle(
  target: Shape | Path,
  width: number,
  radius: number,
) {
  const half = width / 2;
  const safeRadius = Math.max(0, Math.min(radius, half - 0.01));

  if (safeRadius < 0.001) {
    target.moveTo(-half, -half);
    target.lineTo(half, -half);
    target.lineTo(half, half);
    target.lineTo(-half, half);
    target.closePath();
    return;
  }

  target.moveTo(-half + safeRadius, -half);
  target.lineTo(half - safeRadius, -half);
  target.absarc(
    half - safeRadius,
    -half + safeRadius,
    safeRadius,
    -Math.PI / 2,
    0,
  );
  target.lineTo(half, half - safeRadius);
  target.absarc(
    half - safeRadius,
    half - safeRadius,
    safeRadius,
    0,
    Math.PI / 2,
  );
  target.lineTo(-half + safeRadius, half);
  target.absarc(
    -half + safeRadius,
    half - safeRadius,
    safeRadius,
    Math.PI / 2,
    Math.PI,
  );
  target.lineTo(-half, -half + safeRadius);
  target.absarc(
    -half + safeRadius,
    -half + safeRadius,
    safeRadius,
    Math.PI,
    (3 * Math.PI) / 2,
  );
  target.closePath();
}

function createCavityPath(
  shape: CavityShape,
  centerX: number,
  centerY: number,
  halfSize: number,
) {
  const path = new Path();

  if (shape === "round") {
    path.absarc(centerX, centerY, halfSize, 0, Math.PI * 2);
    return path;
  }

  if (shape === "rounded") {
    const radius = halfSize * 0.35;
    path.moveTo(centerX - halfSize + radius, centerY - halfSize);
    path.lineTo(centerX + halfSize - radius, centerY - halfSize);
    path.quadraticCurveTo(
      centerX + halfSize,
      centerY - halfSize,
      centerX + halfSize,
      centerY - halfSize + radius,
    );
    path.lineTo(centerX + halfSize, centerY + halfSize - radius);
    path.quadraticCurveTo(
      centerX + halfSize,
      centerY + halfSize,
      centerX + halfSize - radius,
      centerY + halfSize,
    );
    path.lineTo(centerX - halfSize + radius, centerY + halfSize);
    path.quadraticCurveTo(
      centerX - halfSize,
      centerY + halfSize,
      centerX - halfSize,
      centerY + halfSize - radius,
    );
    path.lineTo(centerX - halfSize, centerY - halfSize + radius);
    path.quadraticCurveTo(
      centerX - halfSize,
      centerY - halfSize,
      centerX - halfSize + radius,
      centerY - halfSize,
    );
    path.closePath();
    return path;
  }

  path.moveTo(centerX - halfSize, centerY - halfSize);
  path.lineTo(centerX + halfSize, centerY - halfSize);
  path.lineTo(centerX + halfSize, centerY + halfSize);
  path.lineTo(centerX - halfSize, centerY + halfSize);
  path.closePath();
  return path;
}

function addMesh(group: Group, geometry: BufferGeometry, material: Material) {
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

export interface DrainModel {
  group: Group;
  cameraDistance: number;
  visualHeight: number;
}

export function createDrainModel(
  rawConfig: DrainConfig,
  topMaterial: MeshStandardMaterial,
  bottomMaterial: MeshStandardMaterial,
): DrainModel {
  const config = getSafeConfig(rawConfig);
  const width = config.size * VISUAL_SCALE;
  const visualHeight = config.height * VISUAL_SCALE * HEIGHT_EMPHASIS;
  const border = config.border * VISUAL_SCALE;
  const cornerRadius = config.cornerRadius * VISUAL_SCALE;
  const innerWidth = width - 2 * border;
  const bevel = Math.min(0.07, visualHeight * 0.08);
  const group = new Group();

  const extrude = (shape: Shape, depth: number, bevelSize: number) =>
    new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevelSize > 0.005,
      bevelSize,
      bevelThickness: bevelSize,
      bevelSegments: 3,
      curveSegments: 20,
    });

  const frame = new Shape();
  addRoundedRectangle(frame, width, cornerRadius);
  const frameOpening = new Path();
  frameOpening.moveTo(-innerWidth / 2, -innerWidth / 2);
  frameOpening.lineTo(innerWidth / 2, -innerWidth / 2);
  frameOpening.lineTo(innerWidth / 2, innerWidth / 2);
  frameOpening.lineTo(-innerWidth / 2, innerWidth / 2);
  frameOpening.closePath();
  frame.holes.push(frameOpening);
  addMesh(group, extrude(frame, visualHeight, bevel), topMaterial);

  const plate = new Shape();
  plate.moveTo(-innerWidth / 2, -innerWidth / 2);
  plate.lineTo(innerWidth / 2, -innerWidth / 2);
  plate.lineTo(innerWidth / 2, innerWidth / 2);
  plate.lineTo(-innerWidth / 2, innerWidth / 2);
  plate.closePath();

  const edgeMargin = Math.max(0.04, innerWidth * 0.012);
  const holeSize = Math.max(
    0.04,
    (innerWidth - 2 * edgeMargin) /
      (config.cavities + 0.15 * (config.cavities - 1)),
  );
  const gap = holeSize * 0.15;
  const total = config.cavities * holeSize + (config.cavities - 1) * gap;
  const origin = -total / 2;

  for (let row = 0; row < config.cavities; row += 1) {
    for (let column = 0; column < config.cavities; column += 1) {
      plate.holes.push(
        createCavityPath(
          config.shape,
          origin + column * (holeSize + gap) + holeSize / 2,
          origin + row * (holeSize + gap) + holeSize / 2,
          holeSize / 2,
        ),
      );
    }
  }

  const curveSegments =
    config.shape === "round"
      ? Math.max(8, Math.min(16, Math.round(120 / config.cavities)))
      : config.shape === "rounded"
        ? 8
        : 4;

  addMesh(
    group,
    new ExtrudeGeometry(plate, {
      depth: visualHeight,
      bevelEnabled: false,
      curveSegments,
    }),
    topMaterial,
  );

  const underside = new Shape();
  addRoundedRectangle(underside, width, cornerRadius);
  addMesh(group, extrude(underside, visualHeight * 0.06, 0), bottomMaterial);
  group.position.y = -visualHeight / 2;

  return {
    group,
    cameraDistance: width * 2.2,
    visualHeight,
  };
}

export function disposeGroup(group: Group) {
  group.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
    }
  });
}
