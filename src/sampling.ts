import type { Dimension, PointList, Vertex, VertexList } from './utils'

// Shared by curves of the same degree/precision. Bound retained memory even
// when a freehand sketch continually changes the number of control points.
const CACHE_BYTES = 8 * 1024 * 1024
const bases: { count: number; steps: number; weights: Float64Array }[] = []
let cachedBytes = 0

function basisFor(count: number, steps: number): Float64Array {
  for (let i = 0; i < bases.length; i++) {
    const entry = bases[i]
    if (entry.count === count && entry.steps === steps) {
      if (i !== bases.length - 1) {
        bases.splice(i, 1)
        bases.push(entry)
      }
      return entry.weights
    }
  }

  const weights = new Float64Array((steps - 1) * count)
  const degree = count - 1
  const ratios = new Float64Array(degree)
  for (let i = 0; i < degree; i++) ratios[i] = (degree - i) / (i + 1)

  // B_i(t) = B_(degree-i)(1-t): evaluate the first half and mirror its rows.
  // Here t <= 0.5, so the recurrence never divides by a vanishing (1-t).
  // At the supported maximum degree, even the midpoint weight is safe.
  for (let sample = 1; sample * 2 <= steps; sample++) {
    const t = sample / steps
    const ratio = t / (1 - t)
    let weight = (1 - t) ** degree
    let sum = 0
    const offset = (sample - 1) * count
    for (let i = 0; i < count; i++) {
      weights[offset + i] = weight
      sum += weight
      if (i < degree) weight *= ratios[i] * ratio
    }
    // Preserve the partition of unity despite rounding in the recurrence.
    for (let i = 0; i < count; i++) weights[offset + i] /= sum

    const mirrorOffset = (steps - sample - 1) * count
    if (mirrorOffset !== offset) {
      for (let i = 0; i < count; i++) {
        weights[mirrorOffset + degree - i] = weights[offset + i]
      }
    }
  }

  if (weights.byteLength <= CACHE_BYTES) {
    while (cachedBytes + weights.byteLength > CACHE_BYTES) {
      const oldest = bases.shift()
      if (oldest) cachedBytes -= oldest.weights.byteLength
    }
    bases.push({ count, steps, weights })
    cachedBytes += weights.byteLength
  }
  return weights
}

export function _sampleBezier(
  points: PointList,
  dimension: Dimension,
  increment: number,
  vertices: VertexList,
): void {
  if (!Number.isFinite(increment) || increment <= 0) {
    throw new Error(
      '[p5.bezier] The sampling increment must be positive and finite',
    )
  }
  const steps = Math.max(1, Math.round(1 / increment))
  const count = points.length
  const weights = basisFor(count, steps)
  vertices.length = steps + 1

  for (let sample = 0; sample <= steps; sample++) {
    const vertex = vertices[sample] ?? (dimension === 3 ? [0, 0, 0] : [0, 0])
    vertices[sample] = vertex as Vertex
    if (sample === 0 || sample === steps) {
      const point = points[sample === 0 ? 0 : count - 1]
      vertex[0] = point[0]
      vertex[1] = point[1]
      if (dimension === 3) vertex[2] = point[2] as number
      continue
    }
    let x = 0
    let y = 0
    const offset = (sample - 1) * count
    if (dimension === 2) {
      for (let i = 0; i < count; i++) {
        const weight = weights[offset + i]
        const point = points[i]
        x += weight * point[0]
        y += weight * point[1]
      }
    } else {
      let z = 0
      for (let i = 0; i < count; i++) {
        const weight = weights[offset + i]
        const point = points[i]
        x += weight * point[0]
        y += weight * point[1]
        z += weight * (point[2] as number)
      }
      vertex[2] = z
    }
    vertex[0] = x
    vertex[1] = y
  }
}
