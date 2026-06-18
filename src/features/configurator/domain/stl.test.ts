import { describe, expect, it } from 'vitest'
import { defaultConfig } from './config'
import {
  createHoleOutline,
  createRoundedOutline,
  createStlModel,
  encodeBinaryStl,
} from './stl'

describe('STL geometry', () => {
  it('creates the expected outline detail', () => {
    expect(createRoundedOutline(100, 0)).toHaveLength(4)
    expect(createRoundedOutline(100, 8, 16)).toHaveLength(64)
    expect(createHoleOutline('square', 0, 0, 2)).toHaveLength(4)
    expect(createHoleOutline('rounded', 0, 0, 2)).toHaveLength(24)
    expect(createHoleOutline('round', 0, 0, 2)).toHaveLength(20)
  })

  it('writes a valid binary STL header and triangle count', () => {
    const buffer = encodeBinaryStl([
      [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    ])
    const view = new DataView(buffer)

    expect(buffer.byteLength).toBe(134)
    expect(view.getUint32(80, true)).toBe(1)
  })

  it('exports a non-empty manifold model with a descriptive filename', () => {
    const model = createStlModel(defaultConfig)
    const view = new DataView(model.buffer)

    expect(model.triangleCount).toBeGreaterThan(100)
    expect(view.getUint32(80, true)).toBe(model.triangleCount)
    expect(model.buffer.byteLength).toBe(84 + model.triangleCount * 50)
    expect(model.fileName).toBe('sumidero_105x105_h3mm_square.stl')
  })
})
