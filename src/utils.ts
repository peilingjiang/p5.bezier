import { MAX_DEGREE, type Smoothness } from './coefficients'

export type CloseType = 'OPEN' | 'CLOSE'
export type Dimension = 2 | 3
export type Point = [number, number] | [number, number, number]
export type PointList = Point[]
export type Vertex = [number, number] | [number, number, number]
export type VertexList = Vertex[]

export type BezierCanvas = {
  dimension: Dimension
  beginPath: () => void
  moveTo: (...args: Vertex) => void
  lineTo: (...args: Vertex) => void
  closePath: (closeType?: CloseType) => void
  beginDash: () => void
  endDash: () => void
}

function _getDimension(
  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  context: any,
  isP3D: boolean,
): Dimension {
  const name = context.constructor?.name
  return isP3D ||
    name === 'WebGLRenderingContext' ||
    name === 'WebGL2RenderingContext'
    ? 3
    : 2
}

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
export function _getCanvasUtils(canvas: any): BezierCanvas {
  // createGraphics wraps a renderer; createCanvas returns the renderer itself.
  const renderer = canvas?._renderer ?? canvas
  const ctx = renderer?.drawingContext
  if (!ctx) throw new Error('[p5.bezier] Canvas is not supported')

  const dimension = _getDimension(ctx, renderer.isP3D)
  const sketch = renderer._pInst
  if (!sketch) {
    if (dimension === 3) {
      throw new Error('[p5.bezier] WebGL requires a p5.js renderer')
    }
    return {
      dimension,
      beginPath: ctx.beginPath.bind(ctx),
      moveTo: ctx.moveTo.bind(ctx),
      lineTo: ctx.lineTo.bind(ctx),
      closePath: (closeType) => {
        if (closeType === 'CLOSE') ctx.closePath()
        if (renderer._doFill) ctx.fill()
        if (renderer._doStroke) ctx.stroke()
      },
      beginDash: () => {
        ctx.save()
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      },
      endDash: () => ctx.restore(),
    }
  }

  let hasVertices = false
  let pendingVertex: Vertex | null = null
  return {
    dimension,
    beginPath: () => {
      sketch.beginShape()
      hasVertices = false
      pendingVertex = null
    },
    lineTo: (x, y, z = 0) => {
      if (pendingVertex) {
        sketch.vertex(...pendingVertex)
        pendingVertex = null
      }
      sketch.vertex(x, y, z)
      hasVertices = true
    },
    moveTo: (x, y, z = 0) => {
      // Defer the next vertex so dash gaps don't submit singleton shapes.
      if (hasVertices) {
        sketch.endShape()
        sketch.beginShape()
        hasVertices = false
      }
      pendingVertex = [x, y, z]
    },
    closePath: (closeType) => {
      sketch.endShape(closeType === 'CLOSE' ? sketch.CLOSE : undefined)
      hasVertices = false
      pendingVertex = null
    },
    beginDash: () => {
      sketch.push()
      sketch.noFill()
    },
    endDash: () => sketch.pop(),
  }
}

export function _dist(...args: number[]): number {
  const len = args.length

  if (len === 4) {
    const dx = args[0] - args[2]
    const dy = args[1] - args[3]
    return Math.sqrt(dx * dx + dy * dy)
  }

  if (len === 6) {
    const dx = args[0] - args[3]
    const dy = args[1] - args[4]
    const dz = args[2] - args[5]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  return 0
}

let warnedSmoothness = false

export function _validateSmoothness(smoothness: number): Smoothness {
  if (smoothness < 1 || smoothness > 5 || !Number.isInteger(smoothness)) {
    if (!warnedSmoothness) {
      warnedSmoothness = true
      window.console.warn(
        '[p5.bezier] Smoothness should be an integer between 1 and 5',
      )
    }

    return Math.round(Math.max(1, Math.min(5, smoothness))) as Smoothness
  }

  return smoothness as Smoothness
}

/* -------------------------------------------------------------------------- */

class SeedRandom {
  private m = 2 ** 31 - 1
  private a = 1103515245
  private c = 12345
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  private r(): number {
    this.state = (this.a * this.state + this.c) % this.m
    return this.state / this.m
  }

  public next(min: number, max: number): number {
    return Math.floor(this.r() * (max - min + 1)) + min
  }
}

const seed = 1234

export function _concentrate(pointList: PointList, close = false): PointList {
  const save = close ? 3 : 0
  const limit = MAX_DEGREE - save

  if (pointList.length <= limit) return _copy(pointList)

  const excessPoints = pointList.length - limit
  const rng = new SeedRandom(seed)

  const rmIndex = new Set<number>()
  ;[...new Array(excessPoints)].map((_, ind) => {
    let r = rng.next(5 + ind, limit - 5 + ind)
    while (rmIndex.has(r)) {
      r = rng.next(5 + ind, limit - 5 + ind)
    }

    rmIndex.add(r)
  })

  return _copy(pointList.filter((_, index) => !rmIndex.has(index)))
}

function _copy(arr: PointList): PointList {
  return arr.map((v) => v.slice()) as PointList
}

export function _getCloseCurvePoints(pointList: PointList): PointList {
  const len = pointList.length
  if (len === 0) return []

  const first = pointList[0]
  const last = pointList[len - 1]

  if (len === 1) return _copy([first])

  const second = pointList[1]
  const secondLast = pointList[len - 2]

  return [
    _interpolateVertex(secondLast, last, 2),
    _interpolateVertex(second, first, 2),
    first.slice() as Point,
  ]
}

export function _interpolateVertex(v1: Vertex, v2: Vertex, t: number): Vertex {
  const len1 = v1.length
  const len2 = v2.length

  if (len1 === 2 && len2 === 2) {
    return [v1[0] + (v2[0] - v1[0]) * t, v1[1] + (v2[1] - v1[1]) * t] as Vertex
  }
  if (len1 === 3 && len2 === 3) {
    return [
      v1[0] + (v2[0] - v1[0]) * t,
      v1[1] + (v2[1] - v1[1]) * t,
      v1[2] + (v2[2] - v1[2]) * t,
    ] as Vertex
  }
  return v2
}
