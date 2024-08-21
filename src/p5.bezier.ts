/*
p5.bezier library by Peiling Jiang
2020

updated Aug 2024
*/

import packageJson from '../package.json'
import {
  type Accuracy,
  _accuracies,
  _binomialCoefficient,
} from './coefficients'
import {
  B,
  type CloseType,
  type Dimension,
  type PointList,
  type Vertex,
  type VertexList,
  _copy,
  _dist,
  _getCanvasUtils,
  _getCloseCurvePoints,
  _getDimension,
  _interpolateVertex,
  _setStyles,
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

function _drawBezierCurve(pointList: PointList, accuracy: Accuracy): void {
  const n = pointList.length - 1
  const increment = _accuracies[accuracy]

  for (let t = 0; t <= 1; t += increment) {
    const v = _bezierVertex(pointList, n, t, B.dimension)

    B.lineTo(...v)
  }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
function initBezier(canvas: any): void {
  B.canvas = canvas
  B.ctx = B.canvas.drawingContext

  if (typeof p5 !== 'undefined' && canvas instanceof p5.Graphics) {
    B.useP5 = true
    B.dimension = _getDimension(B.ctx, false)
  } else if (
    (typeof p5 !== 'undefined' && canvas instanceof p5.Renderer) ||
    canvas.drawingContext
  ) {
    B.useP5 = false

    if (
      typeof p5 === 'undefined' ||
      (typeof p5 !== 'undefined' && !(canvas instanceof p5.Renderer))
    )
      window.console.warn('[p5.bezier] Support beyond p5.js is not tested')

    B.dimension = _getDimension(B.ctx, canvas.isP3D)
  } else throw new Error('[p5.bezier] Canvas is not supported')

  _getCanvasUtils(B.useP5, B.canvas, B.ctx)
}

/* -------------------------------------------------------------------------- */

function newBezier(
  pointList: PointList,
  closeType: CloseType = 'OPEN',
  accuracy: Accuracy = 3,
): void {
  const _pL = _copy(pointList)

  if (closeType === 'CLOSE') {
    const closeCurveExtraPoints = _getCloseCurvePoints(_pL)
    _pL.push(...closeCurveExtraPoints)
  }

  // const p = _pL.length // pointList has p points for (p - 1) degree curves
  // const n = p - 1

  B.beginPath()
  B.moveTo(..._pL[0])

  _drawBezierCurve(_pL, accuracy)
  B.lineTo(..._pL[_pL.length - 1])

  if (B.useP5) B.closePath(closeType)
  else if (closeType === 'CLOSE') B.closePath()

  _setStyles()
}

function newBezierObj(
  pointList: PointList,
  closeType: CloseType = 'OPEN',
  accuracy: Accuracy = 3,
): BezierCurve {
  const increment = _accuracies[accuracy]
  return new BezierCurve(pointList, closeType, increment, B.dimension)
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

  constructor(
    points: PointList,
    closeType: CloseType,
    increment: number,
    dimension: Dimension,
    vertexList: VertexList | null = null,
  ) {
    this.controlPoints = _copy(points)

    if (closeType === 'CLOSE') {
      this.controlPoints.push(..._getCloseCurvePoints(this.controlPoints))
      this.closeType = 'CLOSE'
    } else this.closeType = 'OPEN'

    this.dimension = dimension
    this.increment = increment
    this.vertexList = []
    this.p = this.controlPoints.length // has p points for (p - 1) degree curves
    this.n = this.p - 1 // degree

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
    B.lineTo(...vArray)
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
    B.beginPath()
    this.vertexList.map((v) => this._addVertex(v))

    if (this.closeType === 'CLOSE') B.closePath()

    if (B.useP5) B.closePath(this.closeType)
    else if (this.closeType === 'CLOSE') B.closePath()

    _setStyles()
  }

  private _dashedCurve(dash: [number, number]): void {
    if (this.increment > 0.008) {
      this.increment = 0.008
      window.console.warn(
        '[p5.bezier] Accuracy is changed to 6 for a dash curve',
      )
    }

    const [solidPart, gapPart] = dash.map(Math.abs)
    let solid = true
    let lastVertex = this.vertexList[0]
    let toUseVertexInd = 1
    let currentVirtualVertex = lastVertex
    let availableDist = 0
    let neededDist = solidPart

    B.ctx.save()
    B.ctx.fillStyle = 'rgba(0, 0, 0, 0)'

    B.beginPath()
    B.moveTo(...lastVertex)

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
          ? B.lineTo(...currentVirtualVertex)
          : B.moveTo(...currentVirtualVertex)

        availableDist -= neededDist
        solid = !solid

        neededDist = solid ? solidPart : gapPart
      }

      solid ? B.lineTo(...toUseVertex) : B.moveTo(...toUseVertex)
      neededDist -= this._distVertex(currentVirtualVertex, toUseVertex)

      lastVertex = toUseVertex
      currentVirtualVertex = lastVertex
      toUseVertexInd++
    }

    _setStyles()
    B.ctx.restore()
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
      this.dimension,
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

const p5bezier = {
  init: initBezier,
  draw: newBezier,
  new: newBezierObj,
}

export { initBezier as init, newBezier as draw, newBezierObj as new }
export default p5bezier
