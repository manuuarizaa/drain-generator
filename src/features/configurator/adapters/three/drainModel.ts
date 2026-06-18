import { BufferGeometry, Float32BufferAttribute, Group, Mesh } from "three";
import type { MeshStandardMaterial } from "three";
import type { DrainConfig } from "../../domain/config";
import { createDrainGeometry, type Triangle } from "../../domain/drainGeometry";

export const PREVIEW_SCALE_UNITS_PER_MM = 0.1;

export interface DrainModel {
  group: Group;
  cameraDistance: number;
  visualHeight: number;
}

function triangleNormalZ([a, b, c]: Triangle): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

export function createDrainModel(
  rawConfig: DrainConfig,
  topMaterial: MeshStandardMaterial,
  bottomMaterial: MeshStandardMaterial,
): DrainModel {
  const model = createDrainGeometry(rawConfig);
  const positions: number[] = [];
  const topAndWallTriangles: Triangle[] = [];
  const bottomTriangles: Triangle[] = [];

  for (const triangle of model.triangles) {
    const target =
      triangle.every((point) => point[2] === 0) && triangleNormalZ(triangle) < 0
        ? bottomTriangles
        : topAndWallTriangles;
    target.push(triangle);
  }

  for (const triangle of [...topAndWallTriangles, ...bottomTriangles]) {
    for (const point of triangle) {
      positions.push(
        point[0] * PREVIEW_SCALE_UNITS_PER_MM,
        point[1] * PREVIEW_SCALE_UNITS_PER_MM,
        point[2] * PREVIEW_SCALE_UNITS_PER_MM,
      );
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.addGroup(0, topAndWallTriangles.length * 3, 0);
  geometry.addGroup(
    topAndWallTriangles.length * 3,
    bottomTriangles.length * 3,
    1,
  );
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const mesh = new Mesh(geometry, [topMaterial, bottomMaterial]);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new Group();
  group.add(mesh);
  const visualHeight = model.layout.config.height * PREVIEW_SCALE_UNITS_PER_MM;
  group.position.y = -visualHeight / 2;

  return {
    group,
    cameraDistance: model.layout.config.size * PREVIEW_SCALE_UNITS_PER_MM * 2.2,
    visualHeight,
  };
}

export function disposeGroup(group: Group): void {
  group.traverse((object) => {
    if (object instanceof Mesh) object.geometry.dispose();
  });
}
