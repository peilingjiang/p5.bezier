/* p5.bezier library by Peiling Jiang */

import { type Smoothness, _smoothness } from './coefficients'
import { _sampleBezier } from './sampling'
import {
  type BezierCanvas,
  type CloseType,
  type Dimension,
  type PointList,
  type Vertex,
  type VertexList,
  _concentrate,
  _copy,
  _getCanvasUtils,
  _getCloseCurvePoints,
  _samePoints,
  _validateSmoothness,
} from './utils'

function _preparePoints(points: PointList, closeType: CloseType): PointList {
  if (points.length < 2) {
    throw new Error('[p5.bezier] At least 2 points are needed to draw a curve')
  }
  const prepared = _concentrate(points, closeType === 'CLOSE')
  if (closeType === 'CLOSE') prepared.push(..._getCloseCurvePoints(prepared))
  return prepared
}

function _drawVertices(
  canvas: BezierCanvas,
  vertices: VertexList,
  closeType: CloseType,
): void {
  canvas.beginPath()
  const first = vertices[0]
  canvas.moveTo(first[0], first[1], first[2])
  for (let i = 1; i < vertices.length; i++) {
    const vertex = vertices[i]
    canvas.lineTo(vertex[0], vertex[1], vertex[2])
  }
  canvas.closePath(closeType)
}

class P5Bezier {
  private b: BezierCanvas
  private points: PointList = []
  private vertices: VertexList = []
  private increment = 0

  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  constructor(canvas: any) {
    this.b = _getCanvasUtils(canvas)
  }

  draw(
    pointList: PointList,
    closeType: CloseType = 'OPEN',
    smoothness: Smoothness = 3,
  ): PointList {
    const points = _preparePoints(pointList, closeType)
    const increment = _smoothness[_validateSmoothness(smoothness)]
    if (increment !== this.increment || !_samePoints(points, this.points)) {
      _sampleBezier(points, this.b.dimension, increment, this.vertices)
      _copy(points, this.points)
      this.increment = increment
    }
    _drawVertices(this.b, this.vertices, closeType)
    return points
  }

  new(
    pointList: PointList,
    closeType: CloseType = 'OPEN',
    smoothness: Smoothness = 3,
  ): BezierCurve {
    const increment = _smoothness[_validateSmoothness(smoothness)]
    return new BezierCurve(pointList, closeType, increment, this.b)
  }
}

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
function initBezier(canvas: any): P5Bezier {
  return new P5Bezier(canvas)
}

class BezierCurve {
  controlPoints: PointList
  closeType: CloseType
  dimension: Dimension
  increment: number

  private vertexList: VertexList
  private sampledPoints: PointList
  private sampledIncrement: number
  private b: BezierCanvas

  constructor(
    points: PointList,
    closeType: CloseType,
    increment: number,
    bezierCanvas: BezierCanvas,
    vertexList: VertexList | null = null,
  ) {
    // A supplied vertex list is already sampled, including closure. This is
    // used by move() and must not append closing control points a second time.
    this.controlPoints =
      vertexList === null ? _preparePoints(points, closeType) : _copy(points)
    this.closeType = closeType === 'CLOSE' ? 'CLOSE' : 'OPEN'
    this.dimension = bezierCanvas.dimension
    this.increment = increment
    this.b = bezierCanvas
    this.vertexList = vertexList === null ? [] : vertexList.slice()
    this.sampledPoints = []
    this.sampledIncrement = increment
    if (vertexList === null) this._buildVertexList()
    else _copy(this.controlPoints, this.sampledPoints)
  }

  private _buildVertexList(): void {
    _sampleBezier(
      this.controlPoints,
      this.dimension,
      this.increment,
      this.vertexList,
    )
    _copy(this.controlPoints, this.sampledPoints)
    this.sampledIncrement = this.increment
  }

  draw(dash?: [number, number]): void {
    if (dash) this._dashedCurve(dash)
    else _drawVertices(this.b, this.vertexList, this.closeType)
  }

  private _dashedCurve(dash: [number, number]): void {
    const solidPart = Math.abs(dash[0])
    const gapPart = Math.abs(dash[1])
    if (!Number.isFinite(solidPart) || !Number.isFinite(gapPart)) {
      throw new Error('[p5.bezier] Dash lengths must be finite')
    }
    if (this.increment > 0.001) {
      this.increment = 0.001
      this._buildVertexList()
      console.warn('[p5.bezier] Smoothness set to 3 for a dashed curve')
    }
    if (solidPart === 0 && gapPart > 0) return

    this.b.beginDash()
    try {
      if (gapPart === 0) {
        _drawVertices(this.b, this.vertexList, this.closeType)
        return
      }
      let solid = true
      let needed = solidPart
      const first = this.vertexList[0]
      this.b.beginPath()
      this.b.moveTo(first[0], first[1], first[2])
      for (let i = 1; i < this.vertexList.length; i++) {
        const previous = this.vertexList[i - 1]
        const next = this.vertexList[i]
        let x = previous[0]
        let y = previous[1]
        let z = previous[2] ?? 0
        const nx = next[0]
        const ny = next[1]
        const nz = next[2] ?? 0
        const dx = nx - x
        const dy = ny - y
        const dz = nz - z
        let available = Math.sqrt(dx * dx + dy * dy + dz * dz)
        while (available >= needed) {
          const ratio = needed / available
          x += (nx - x) * ratio
          y += (ny - y) * ratio
          z += (nz - z) * ratio
          if (solid) this.b.lineTo(x, y, z)
          else this.b.moveTo(x, y, z)
          available -= needed
          solid = !solid
          needed = solid ? solidPart : gapPart
        }
        if (solid) this.b.lineTo(nx, ny, nz)
        needed -= available
      }
      this.b.closePath('OPEN')
    } finally {
      this.b.endDash()
    }
  }

  update(newControlPointList: PointList): void {
    if (newControlPointList.length !== this.controlPoints.length) {
      throw new Error('[p5.bezier] The number of control points changed')
    }
    if (
      this.increment === this.sampledIncrement &&
      _samePoints(this.sampledPoints, newControlPointList)
    ) {
      if (!_samePoints(this.controlPoints, newControlPointList)) {
        this.controlPoints = _copy(newControlPointList)
      }
      return
    }

    this.controlPoints = _copy(newControlPointList)
    this._buildVertexList()
  }

  move(
    x: number,
    y: number,
    z: number | null = null,
    toDraw = true,
    dash?: [number, number],
  ): BezierCurve {
    if (z === null && this.dimension === 3) {
      throw new Error('[p5.bezier] X, Y, and Z are needed to move a 3D curve')
    }
    const translate = (points: PointList): PointList => {
      const result: PointList = new Array(points.length)
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        result[i] =
          this.dimension === 3
            ? [point[0] + x, point[1] + y, (point[2] as number) + (z as number)]
            : [point[0] + x, point[1] + y]
      }
      return result
    }
    const moved = new BezierCurve(
      translate(this.controlPoints),
      this.closeType,
      this.increment,
      this.b,
      translate(this.vertexList),
    )
    if (toDraw) moved.draw(dash)
    return moved
  }

  shortest(pX: number, pY: number, pZ = 0): Vertex {
    let closest = this.vertexList[0]
    let minimum = Number.POSITIVE_INFINITY
    for (let i = 0; i < this.vertexList.length; i++) {
      const vertex = this.vertexList[i]
      const dx = vertex[0] - pX
      const dy = vertex[1] - pY
      const dz = this.dimension === 3 ? (vertex[2] as number) - pZ : 0
      const distance = dx * dx + dy * dy + dz * dz
      if (distance < minimum) {
        minimum = distance
        closest = vertex
      }
    }
    return closest.slice() as Vertex
  }
}

export default initBezier
