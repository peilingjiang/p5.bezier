/*
p5.bezier library by Peiling Jiang
2020

updated Aug 2024
*/

import packageJson from '../package.json'
import {
  type Smoothness,
  _binomialCoefficient,
  _smoothness,
} from './coefficients'
import {
  type BezierCanvas,
  type CloseType,
  type Dimension,
  type PointList,
  type Vertex,
  type VertexList,
  _concentrate,
  _dist,
  _getCanvasUtils,
  _getCloseCurvePoints,
  _getDimension,
  _interpolateVertex,
  _setStyles,
  _validateSmoothness,
} from './utils'

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
declare const p5: any

window.console.log(`[p5.bezier] ${packageJson.version}`)

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
// helpers

function _bezierVertex(
  pointList: PointList,
  n: number,
  t: number,
  dimension: number,
): Vertex {
  const vertex: number[] = new Array(dimension).fill(0)
  const oneMinusT = 1 - t

  for (let i = 0; i <= n; i++) {
    const coefficient =
      _binomialCoefficient(n, i) * oneMinusT ** (n - i) * t ** i

    for (let d = 0; d < dimension; d++)
      vertex[d] += coefficient * pointList[i][d]
  }

  return vertex as Vertex
}

function _drawBezierCurve(
  bezierCanvas: BezierCanvas,
  pointList: PointList,
  smoothness: Smoothness,
): void {
  const n = pointList.length - 1
  const increment = _smoothness[_validateSmoothness(smoothness)]

  for (let t = 0; t <= 1; t += increment) {
    const v = _bezierVertex(pointList, n, t, bezierCanvas.dimension)

    bezierCanvas.lineTo(...v)
  }
}

// function _drawBSplineCurve(
//   bezierCanvas: BezierCanvas,
//   pointList: PointList,
//   smoothness: Smoothness,
// ): void {
//   const increment = _smoothness[_validateSmoothness(smoothness)]
//   const n = pointList.length - 1

//   for (let i = 0; i < n - 2; i++) {
//     const b0 = pointList[i]
//     const b1 = pointList[i + 1]
//     const b2 = pointList[i + 2]
//     const b3 = pointList[i + 3]

//     for (let t = 0; t <= 1; t += increment) {
//       const t2 = t * t
//       const t3 = t2 * t

//       const vertex = bezierCanvas.dimension === 2 ? [0, 0] : [0, 0, 0]

//       for (let d = 0; d < bezierCanvas.dimension; d++) {
//         vertex[d] =
//           (1 / 6) *
//           ((-b0[d] + 3 * b1[d] - 3 * b2[d] + b3[d]) * t3 +
//             (3 * b0[d] - 6 * b1[d] + 3 * b2[d]) * t2 +
//             (-3 * b0[d] + 3 * b2[d]) * t +
//             (b0[d] + 4 * b1[d] + b2[d]))
//       }

//       bezierCanvas.lineTo(vertex[0], vertex[1], vertex[2])
//     }
//   }
// }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class P5Bezier {
  private b: BezierCanvas = {
    canvas: null,
    ctx: null,
    dimension: 2,
    useP5: true,
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
  }

  // biome-ignore lint/suspicious/noExplicitAny: p5 typing
  constructor(canvas: any) {
    this.b.canvas = canvas
    this.b.ctx = this.b.canvas.drawingContext

    if (typeof p5 !== 'undefined' && canvas instanceof p5.Graphics) {
      this.b.useP5 = true
      this.b.dimension = _getDimension(this.b.ctx, false)
    } else if (
      (typeof p5 !== 'undefined' && canvas instanceof p5.Renderer) ||
      canvas.drawingContext
    ) {
      this.b.useP5 = false

      if (
        typeof p5 === 'undefined' ||
        (typeof p5 !== 'undefined' && !(canvas instanceof p5.Renderer))
      )
        window.console.warn('[p5.bezier] Support beyond p5.js is not tested')

      this.b.dimension = _getDimension(this.b.ctx, canvas.isP3D)
    } else throw new Error('[p5.bezier] Canvas is not supported')

    _getCanvasUtils(this.b)
  }

  draw(
    pointList: PointList,
    closeType: CloseType = 'OPEN',
    smoothness: Smoothness = 3,
  ): PointList {
    if (pointList.length < 2) {
      throw new Error(
        '[p5.bezier] At least 2 points are needed to draw a curve',
      )
    }

    const _pL =
      closeType === 'CLOSE'
        ? [..._concentrate(pointList, true), ..._getCloseCurvePoints(pointList)]
        : _concentrate(pointList)

    this.b.beginPath()
    this.b.moveTo(..._pL[0])

    _drawBezierCurve(this.b, _pL, smoothness)

    this.b.lineTo(..._pL[_pL.length - 1])

    if (this.b.useP5) this.b.closePath(closeType)
    else if (closeType === 'CLOSE') this.b.closePath()

    _setStyles(this.b)

    return _pL
  }

  // bSpline(
  //   pointList: PointList,
  //   closeType: CloseType = 'OPEN',
  //   smoothness: Smoothness = 3,
  // ): PointList {
  //   if (pointList.length < 2) {
  //     throw new Error(
  //       '[p5.bezier] At least 2 points are needed to draw a curve',
  //     )
  //   }

  //   const _pL =
  //     closeType === 'CLOSE'
  //       ? [...pointList, ...pointList.slice(0, 3)]
  //       : pointList

  //   this.b.beginPath()
  //   // this.b.moveTo(..._pL[0])

  //   _drawBSplineCurve(this.b, _pL, smoothness)

  //   // this.b.lineTo(..._pL[_pL.length - 1])

  //   if (this.b.useP5) {
  //     this.b.closePath(closeType)
  //   } else if (closeType === 'CLOSE') {
  //     this.b.closePath()
  //   }

  //   _setStyles(this.b)

  //   return _pL
  // }

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

/* -------------------------------------------------------------------------- */

class BezierCurve {
  controlPoints: PointList
  closeType: CloseType
  dimension: Dimension
  increment: number

  private vertexList: VertexList
  private p: number
  private n: number
  private b: BezierCanvas

  constructor(
    points: PointList,
    closeType: CloseType,
    increment: number,
    bezierCanvas: BezierCanvas,
    vertexList: VertexList | null = null,
  ) {
    this.controlPoints = _concentrate(points, closeType === 'CLOSE')

    if (closeType === 'CLOSE') {
      this.controlPoints.push(..._getCloseCurvePoints(this.controlPoints))
      this.closeType = 'CLOSE'
    } else this.closeType = 'OPEN'

    this.dimension = bezierCanvas.dimension
    this.increment = increment
    this.vertexList = []
    this.p = this.controlPoints.length // has p points for (p - 1) degree curves
    this.n = this.p - 1 // degree

    this.b = bezierCanvas

    if (vertexList === null) this._buildVertexList()
    else this.vertexList = [...vertexList]
  }

  private _buildVertexList(): VertexList {
    this.vertexList = []

    for (let t = 0; t <= 1; t += this.increment) {
      const v = _bezierVertex(this.controlPoints, this.n, t, this.dimension)

      this.vertexList.push(v)
    }

    this._addVertex(this.controlPoints[this.controlPoints.length - 1] as Vertex)
    this.dimension = this.vertexList[0].length

    return this.vertexList
  }

  private _addVertex(vArray: Vertex): void {
    this.b.lineTo(...vArray)
  }

  private _distVertex(vArray1: Vertex, vArray2: Vertex): number {
    return this.dimension === 3 && vArray1.length === 3 && vArray2.length === 3
      ? _dist(
          vArray1[0],
          vArray1[1],
          vArray1[2],
          vArray2[0],
          vArray2[1],
          vArray2[2],
        )
      : this.dimension === 2
        ? _dist(vArray1[0], vArray1[1], vArray2[0], vArray2[1])
        : 0
  }

  draw(dash?: [number, number]): void {
    if (!dash) {
      this._solidCurve()
    } else {
      this._dashedCurve(dash)
    }
  }

  private _solidCurve(): void {
    this.b.beginPath()
    this.vertexList.map((v) => this._addVertex(v))

    if (this.closeType === 'CLOSE') this.b.closePath()

    if (this.b.useP5) this.b.closePath(this.closeType)
    else if (this.closeType === 'CLOSE') this.b.closePath()

    _setStyles(this.b)
  }

  private _dashedCurve(dash: [number, number]): void {
    if (this.increment > 0.001) {
      this.increment = 0.001
      window.console.warn('[p5.bezier] Smoothness set to 3 for a dashed curve')
    }

    const [solidPart, gapPart] = dash.map(Math.abs)
    let solid = true
    let lastVertex = this.vertexList[0]
    let toUseVertexInd = 1
    let currentVirtualVertex = lastVertex
    let availableDist = 0
    let neededDist = solidPart

    this.b.ctx.save()
    this.b.ctx.fillStyle = 'rgba(0, 0, 0, 0)'

    this.b.beginPath()
    this.b.moveTo(...lastVertex)

    while (toUseVertexInd < this.vertexList.length) {
      const toUseVertex = this.vertexList[toUseVertexInd]
      availableDist = this._distVertex(lastVertex, toUseVertex)

      while (availableDist >= neededDist) {
        currentVirtualVertex = _interpolateVertex(
          currentVirtualVertex,
          toUseVertex,
          neededDist / availableDist,
        )
        solid
          ? this.b.lineTo(...currentVirtualVertex)
          : this.b.moveTo(...currentVirtualVertex)

        availableDist -= neededDist
        solid = !solid

        neededDist = solid ? solidPart : gapPart
      }

      solid ? this.b.lineTo(...toUseVertex) : this.b.moveTo(...toUseVertex)
      neededDist -= this._distVertex(currentVirtualVertex, toUseVertex)

      lastVertex = toUseVertex
      currentVirtualVertex = lastVertex
      toUseVertexInd++
    }

    _setStyles(this.b)
    this.b.ctx.restore()
  }

  update(newControlPointList: PointList) {
    if (newControlPointList.length !== this.controlPoints.length) {
      throw new Error('[p5.bezier] The number of control points changed')
    }

    if (this.controlPoints.every((v, i) => v === newControlPointList[i])) {
      return
    }

    this.controlPoints = newControlPointList
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

    const toMove: number[] = [x, y]
    if (z !== null) toMove.push(z)

    const newCurveV: VertexList = this.vertexList.map(
      (v) => v.slice() as Vertex,
    )
    const newCurveObj: BezierCurve = new BezierCurve(
      this.controlPoints,
      this.closeType,
      this.increment,
      this.b,
      newCurveV,
    )

    newCurveObj.vertexList = newCurveObj.vertexList.map(
      (v) => v.map((val: number, i: number) => val + toMove[i]) as Vertex,
    )

    if (toDraw) newCurveObj.draw(dash)

    return newCurveObj
  }

  shortest(pX: number, pY: number, pZ = 0): Vertex {
    let minVertex: Vertex = [0, 0, 0]
    let dMin = Number.POSITIVE_INFINITY

    this.vertexList.map((v) => {
      const nowMin = this._distVertex(v, [pX, pY, pZ])
      if (dMin > nowMin) {
        dMin = nowMin
        minVertex = [...v] as Vertex
      }
    })

    return minVertex
  }
}

export default initBezier
