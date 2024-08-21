export type CloseType = 'OPEN' | 'CLOSE'
export type Dimension = 2 | 3
export type Point = [number, number] | [number, number, number]
export type PointList = Point[]
export type Vertex = [number, number] | [number, number, number]
export type VertexList = Vertex[]

// @private
export const B: {
  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  canvas: any
  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  ctx: any
  dimension: Dimension
  useP5: boolean
  beginPath: () => void
  moveTo: (...args: Vertex) => void
  lineTo: (...args: Vertex) => void
  closePath: (closeType?: CloseType) => void
} = {
  canvas: null,
  ctx: null,
  dimension: 2,
  useP5: true,
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
}

/* -------------------------------------------------------------------------- */

export function _getDimension(
  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  context: any,
  isP3D: boolean,
): Dimension {
  return context.constructor.name === 'WebGLRenderingContext' || isP3D ? 3 : 2
}

export function _getCanvasUtils(
  useP5: boolean,
  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  canvas: any,
  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  context: any,
) {
  if (useP5) {
    B.beginPath = canvas.beginShape
    B.moveTo = canvas.vertex
    B.lineTo = canvas.vertex
    B.closePath = canvas.endShape
  } else {
    if (context instanceof WebGLRenderingContext) {
      B.beginPath = () => {}
      B.moveTo = (x, y, z = 0) => context.vertexAttrib3f(0, x, y, z)
      B.lineTo = (x, y, z = 0) => context.vertexAttrib3f(0, x, y, z)
      B.closePath = () => {}
    } else {
      B.beginPath = context.beginPath.bind(context)
      B.moveTo = context.moveTo.bind(context)
      B.lineTo = context.lineTo.bind(context)
      B.closePath = context.closePath.bind(context)
    }
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

export function _setStyles() {
  if (B.canvas._doFill) B.ctx.fill()
  if (B.canvas._doStroke) B.ctx.stroke()
}

export function _copy(arr: PointList): PointList {
  return arr.map((v) => v.slice()) as PointList
}

export function _getCloseCurvePoints(pointList: PointList): PointList {
  const len = pointList.length

  const first = pointList[0]
  const last = pointList[len - 1]

  const second = pointList[1]
  const secondLast = pointList[len - 2]

  return [
    [2 * last[0] - secondLast[0], 2 * last[1] - secondLast[1]] as Point,
    [2 * first[0] - second[0], 2 * first[1] - second[1]] as Point,
    first,
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