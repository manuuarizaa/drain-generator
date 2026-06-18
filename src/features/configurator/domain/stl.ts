import earcut from 'earcut'
import type { CavityShape, DrainConfig } from './config'
import { getSafeConfig } from './config'

export type Point2 = readonly [number, number]
export type Point3 = readonly [number, number, number]
export type Triangle = readonly [Point3, Point3, Point3]

export interface StlModel {
  buffer: ArrayBuffer
  triangleCount: number
  fileName: string
}

export function createRoundedOutline(width: number, radius: number, segments = 16): Point2[] {
  const half = width / 2
  const safeRadius = Math.max(0, Math.min(radius, half - 0.01))

  if (safeRadius < 0.01) {
    return [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
    ]
  }

  const points: Point2[] = []
  const corners = [
    [half - safeRadius, half - safeRadius, 0, Math.PI / 2],
    [-half + safeRadius, half - safeRadius, Math.PI / 2, Math.PI],
    [-half + safeRadius, -half + safeRadius, Math.PI, (3 * Math.PI) / 2],
    [half - safeRadius, -half + safeRadius, (3 * Math.PI) / 2, 2 * Math.PI],
  ] as const

  for (const [centerX, centerY, angleStart, angleEnd] of corners) {
    for (let index = 0; index < segments; index += 1) {
      const angle = angleStart + ((angleEnd - angleStart) * index) / segments
      points.push([
        centerX + safeRadius * Math.cos(angle),
        centerY + safeRadius * Math.sin(angle),
      ])
    }
  }

  return points
}

export function createHoleOutline(
  shape: CavityShape,
  centerX: number,
  centerY: number,
  halfSize: number,
): Point2[] {
  if (shape === 'round') {
    const points: Point2[] = []
    for (let index = 20; index > 0; index -= 1) {
      const angle = (2 * Math.PI * index) / 20
      points.push([
        centerX + halfSize * Math.cos(angle),
        centerY + halfSize * Math.sin(angle),
      ])
    }
    return points
  }

  if (shape === 'rounded') {
    const radius = halfSize * 0.35
    const points: Point2[] = []
    const corners = [
      [centerX + halfSize - radius, centerY + halfSize - radius, 0, Math.PI / 2],
      [centerX - halfSize + radius, centerY + halfSize - radius, Math.PI / 2, Math.PI],
      [centerX - halfSize + radius, centerY - halfSize + radius, Math.PI, (3 * Math.PI) / 2],
      [centerX + halfSize - radius, centerY - halfSize + radius, (3 * Math.PI) / 2, 2 * Math.PI],
    ] as const

    for (const [cornerX, cornerY, angleStart, angleEnd] of corners) {
      for (let index = 0; index < 6; index += 1) {
        const angle = angleStart + ((angleEnd - angleStart) * index) / 6
        points.push([
          cornerX + radius * Math.cos(angle),
          cornerY + radius * Math.sin(angle),
        ])
      }
    }
    return points.reverse()
  }

  return [
    [centerX - halfSize, centerY - halfSize],
    [centerX - halfSize, centerY + halfSize],
    [centerX + halfSize, centerY + halfSize],
    [centerX + halfSize, centerY - halfSize],
  ]
}

export function encodeBinaryStl(triangles: readonly Triangle[]) {
  const buffer = new ArrayBuffer(84 + triangles.length * 50)
  const view = new DataView(buffer)
  view.setUint32(80, triangles.length, true)
  let offset = 84

  for (const [vertex0, vertex1, vertex2] of triangles) {
    const ax = vertex1[0] - vertex0[0]
    const ay = vertex1[1] - vertex0[1]
    const az = vertex1[2] - vertex0[2]
    const bx = vertex2[0] - vertex0[0]
    const by = vertex2[1] - vertex0[1]
    const bz = vertex2[2] - vertex0[2]
    let normalX = ay * bz - az * by
    let normalY = az * bx - ax * bz
    let normalZ = ax * by - ay * bx
    const length = Math.hypot(normalX, normalY, normalZ) || 1
    normalX /= length
    normalY /= length
    normalZ /= length

    for (const component of [normalX, normalY, normalZ]) {
      view.setFloat32(offset, component, true)
      offset += 4
    }

    for (const vertex of [vertex0, vertex1, vertex2]) {
      for (const component of vertex) {
        view.setFloat32(offset, component, true)
        offset += 4
      }
    }
    offset += 2
  }

  return buffer
}

export function createStlModel(rawConfig: DrainConfig): StlModel {
  const config = getSafeConfig(rawConfig)
  const innerWidth = config.size - 2 * config.border
  const outer = createRoundedOutline(
    config.size,
    Math.min(config.cornerRadius, config.size / 2 - 0.01),
  )
  const edgeMargin = Math.max(2, innerWidth * 0.012)
  const holeSize = Math.max(
    2,
    (innerWidth - 2 * edgeMargin) / (config.cavities + 0.15 * (config.cavities - 1)),
  )
  const gap = holeSize * 0.15
  const total = config.cavities * holeSize + (config.cavities - 1) * gap
  const origin = -total / 2
  const holes: Point2[][] = []

  for (let row = 0; row < config.cavities; row += 1) {
    for (let column = 0; column < config.cavities; column += 1) {
      holes.push(
        createHoleOutline(
          config.shape,
          origin + column * (holeSize + gap) + holeSize / 2,
          origin + row * (holeSize + gap) + holeSize / 2,
          holeSize / 2,
        ),
      )
    }
  }

  const flat: number[] = []
  const holeIndices: number[] = []
  for (const point of outer) flat.push(point[0], point[1])
  for (const hole of holes) {
    holeIndices.push(flat.length / 2)
    for (const point of hole) flat.push(point[0], point[1])
  }

  const vertices: Point2[] = []
  for (let index = 0; index < flat.length; index += 2) {
    vertices.push([flat[index] ?? 0, flat[index + 1] ?? 0])
  }

  const indices = earcut(flat, holeIndices)
  const triangles: Triangle[] = []
  const vertexAt = (index: number): Point2 => vertices[index] ?? [0, 0]

  for (let index = 0; index < indices.length; index += 3) {
    const pointA = vertexAt(indices[index] ?? 0)
    const pointB = vertexAt(indices[index + 1] ?? 0)
    const pointC = vertexAt(indices[index + 2] ?? 0)
    triangles.push([
      [pointA[0], pointA[1], config.height],
      [pointB[0], pointB[1], config.height],
      [pointC[0], pointC[1], config.height],
    ])
    triangles.push([
      [pointC[0], pointC[1], 0],
      [pointB[0], pointB[1], 0],
      [pointA[0], pointA[1], 0],
    ])
  }

  const addWalls = (outline: readonly Point2[], inward: boolean) => {
    for (let index = 0; index < outline.length; index += 1) {
      const point0 = outline[index] ?? [0, 0]
      const point1 = outline[(index + 1) % outline.length] ?? [0, 0]
      const bottom0: Point3 = [point0[0], point0[1], 0]
      const bottom1: Point3 = [point1[0], point1[1], 0]
      const top0: Point3 = [point0[0], point0[1], config.height]
      const top1: Point3 = [point1[0], point1[1], config.height]

      if (inward) {
        triangles.push([bottom1, bottom0, top0], [bottom1, top0, top1])
      } else {
        triangles.push([bottom0, bottom1, top1], [bottom0, top1, top0])
      }
    }
  }

  addWalls(outer, false)
  for (const hole of holes) addWalls(hole, true)

  return {
    buffer: encodeBinaryStl(triangles),
    triangleCount: triangles.length,
    fileName: `sumidero_${config.size}x${config.size}_h${config.height}mm_${config.shape}.stl`,
  }
}
