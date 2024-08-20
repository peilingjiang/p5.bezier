/*
p5.bezier library by Peiling Jiang
2020

updated Aug 2024
*/

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
declare const p5: any

type Accuracy = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
type CloseType = 'OPEN' | 'CLOSE'
type Dimension = 2 | 3
type Point = [number, number] | [number, number, number]
type PointList = Point[]
type Vertex = [number, number] | [number, number, number]
type VertexList = Vertex[]

window.console.log('[p5.bezier] 2024')

// accuracy 0 - 10, default 7
const _p5bezierAccuracyListAll: {
  [A in Accuracy]: number
} = {
  0: 0.2,
  1: 0.1,
  2: 0.05,
  3: 0.04,
  4: 0.02,
  5: 0.01,
  6: 0.008,
  7: 0.002,
  8: 0.001,
  9: 0.0005,
  10: 0.0001,
}

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
let _canvas: any
// biome-ignore lint/suspicious/noExplicitAny: p5 typing
let _ctx: any
let _dimension: Dimension
let _useP5: boolean
let _beginPath: () => void
let _moveTo: (...args: Vertex) => void
let _lineTo: (...args: Vertex) => void
let _closePath: (closeType?: CloseType) => void

const ENSURED_FACTORIAL_COUNT = 10
const _calculatedFactorials: number[] = [1]

const _calculatedBinomialCoefficients: {
  [n: number]: {
    [i: number]: number
  }
} = {}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
// helpers

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
function _determineDimension(context: any, isP3D: boolean): Dimension {
  return context.constructor.name === 'WebGLRenderingContext' || isP3D ? 3 : 2
}

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
function _setCanvasFunctions(useP5: boolean, canvas: any, context: any) {
  if (useP5) {
    _beginPath = canvas.beginShape
    _moveTo = canvas.vertex
    _lineTo = canvas.vertex
    _closePath = canvas.endShape
  } else {
    if (context instanceof WebGLRenderingContext) {
      _beginPath = () => {}
      _moveTo = (x, y, z = 0) => context.vertexAttrib3f(0, x, y, z)
      _lineTo = (x, y, z = 0) => context.vertexAttrib3f(0, x, y, z)
      _closePath = () => {}
    } else {
      _beginPath = context.beginPath.bind(context)
      _moveTo = context.moveTo.bind(context)
      _lineTo = context.lineTo.bind(context)
      _closePath = context.closePath.bind(context)
    }
  }
}

function _ensureFactorials(n: number): void {
  for (let i = _calculatedFactorials.length; i <= n; i++)
    _calculatedFactorials[i] = i * _calculatedFactorials[i - 1]
}
_ensureFactorials(ENSURED_FACTORIAL_COUNT)

function _helper_factorial(i: number): number {
  return _calculatedFactorials[i]
}

function _helper_binomialCoefficient(n: number, i: number): number {
  return (
    _helper_factorial(n) / (_helper_factorial(i) * _helper_factorial(n - i))
  )
}

function _binomialCoefficient(n: number, i: number): number {
  if (i === 0 || i === n) return 1

  // _ensureFactorials(n)

  if (!_calculatedBinomialCoefficients[n])
    _calculatedBinomialCoefficients[n] = {}

  if (_calculatedBinomialCoefficients[n][i] !== undefined)
    return _calculatedBinomialCoefficients[n][i]

  _calculatedBinomialCoefficients[n][i] = _helper_binomialCoefficient(n, i)

  return _calculatedBinomialCoefficients[n][i]
}

function _helper_dist(...args: number[]): number {
  if (args.length === 4) return Math.hypot(args[0] - args[2], args[1] - args[3])
  if (args.length === 6)
    return Math.hypot(args[0] - args[3], args[1] - args[4], args[2] - args[5])
  return 0
}

function _helper_style() {
  if (_canvas._doFill) _ctx.fill()
  if (_canvas._doStroke) _ctx.stroke()
}

function _deepCopyPoints(arr: PointList): PointList {
  return arr.map((v) => [...v]) as PointList
}

function _findCloseCurveExtraPoints(pointList: PointList): PointList {
  const first = pointList[0]
  const last = pointList[pointList.length - 1]
  const second = pointList[1]
  const secondLast = pointList[pointList.length - 2]

  const point1 = [
    2 * last[0] - secondLast[0],
    2 * last[1] - secondLast[1],
  ] as Point
  const point2 = [2 * first[0] - second[0], 2 * first[1] - second[1]] as Point

  return [point1, point2, first]
}

function _interpolateVertex(v1: Vertex, v2: Vertex, t: number): Vertex {
  if (v1.length === 2 && v2.length === 2)
    return [v1[0] + (v2[0] - v1[0]) * t, v1[1] + (v2[1] - v1[1]) * t] as Vertex

  if (v1.length === 3 && v2.length === 3)
    return [
      v1[0] + (v2[0] - v1[0]) * t,
      v1[1] + (v2[1] - v1[1]) * t,
      v1[2] + (v2[2] - v1[2]) * t,
    ] as Vertex

  return v2
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// biome-ignore lint/suspicious/noExplicitAny: p5 typing
function initBezier(canvas: any): void {
  _canvas = canvas
  _ctx = _canvas.drawingContext

  if (typeof p5 !== 'undefined' && canvas instanceof p5.Graphics) {
    _useP5 = true
    _dimension = _determineDimension(_ctx, false)
  } else if (
    (typeof p5 !== 'undefined' && canvas instanceof p5.Renderer) ||
    canvas.drawingContext
  ) {
    _useP5 = false

    if (
      typeof p5 === 'undefined' ||
      (typeof p5 !== 'undefined' && !(canvas instanceof p5.Renderer))
    )
      window.console.warn('[p5.bezier] Support beyond p5.js is not tested')

    _dimension = _determineDimension(_ctx, canvas.isP3D)
  } else throw new Error('[p5.bezier] Canvas is not supported.')

  _setCanvasFunctions(_useP5, _canvas, _ctx)
}

function newBezier(
  pointList: PointList,
  closeType: CloseType = 'OPEN',
  accuracy: Accuracy = 7,
): void {
  const _pL = _deepCopyPoints(pointList)

  if (closeType === 'CLOSE') {
    const closeCurveExtraPoints = _findCloseCurveExtraPoints(_pL)
    _pL.push(...closeCurveExtraPoints)
  }

  const tIncrement = _p5bezierAccuracyListAll[accuracy]
  const p = _pL.length // pointList has p points for (p - 1) degree curves
  const n = p - 1

  _ensureFactorials(n)

  _beginPath()
  _moveTo(..._pL[0])

  if (_dimension === 2) {
    let x: number
    let y: number
    let t: number

    for (t = 0; t <= 1; t += tIncrement) {
      x = y = 0
      for (let i = 0; i <= n; i++) {
        const coefficient =
          _binomialCoefficient(n, i) * (1 - t) ** (n - i) * t ** i

        x += coefficient * _pL[i][0]
        y += coefficient * _pL[i][1]
      }

      _lineTo(x, y)
    }
  } else if (_dimension === 3) {
    for (let t = 0; t <= 1; t += tIncrement) {
      const xyz: [number, number, number] = [0, 0, 0]

      for (let i = 0; i <= n; i++) {
        const coefficient =
          _binomialCoefficient(n, i) * (1 - t) ** (n - i) * t ** i

        for (let d = 0; d < 3; d++) xyz[d] += coefficient * _pL[i][d]
      }

      _lineTo(...xyz)
    }
  }

  _lineTo(..._pL[_pL.length - 1])

  if (_useP5) _closePath(closeType)
  else if (closeType === 'CLOSE') _closePath()

  _helper_style()
}

function newBezierObj(
  pointList: PointList,
  closeType: CloseType = 'OPEN',
  accuracy: Accuracy = 7,
): BezierCurve {
  const increment = _p5bezierAccuracyListAll[accuracy]
  return new BezierCurve(pointList, closeType, increment, _dimension)
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

  // take pointList, closeType, tIncrement, bezierDimension into constructor
  constructor(
    points: PointList,
    closeType: CloseType,
    increment: number,
    dimension: Dimension,
    vertexList: VertexList | null = null,
  ) {
    this.controlPoints = _deepCopyPoints(points)

    if (closeType === 'CLOSE') {
      this.controlPoints.push(..._findCloseCurveExtraPoints(this.controlPoints))
      this.closeType = 'CLOSE'
    } else this.closeType = 'OPEN'

    this.dimension = dimension
    this.increment = increment
    this.vertexList = []
    this.p = this.controlPoints.length // has p points for (p - 1) degree curves
    this.n = this.p - 1 // degree

    // ensure enough factorials are calculated up to this.n
    _ensureFactorials(this.n)

    if (vertexList === null) this._buildVertexList()
    else this.vertexList = [...vertexList]
  }

  private _buildVertexList(): VertexList {
    this.vertexList = []

    if (this.dimension === 2) {
      for (let t = 0; t <= 1; t += this.increment) {
        let x = 0
        let y = 0

        for (let i = 0; i <= this.n; i++) {
          const binomialCoefficient = _binomialCoefficient(this.n, i)
          const term = binomialCoefficient * (1 - t) ** (this.n - i) * t ** i

          x += term * this.controlPoints[i][0]
          y += term * this.controlPoints[i][1]
        }

        this.vertexList.push([x, y])
      }
    } else if (this.dimension === 3) {
      for (let t = 0; t <= 1; t += this.increment) {
        const xyz: [number, number, number] = [0, 0, 0]

        for (let i = 0; i <= this.n; i++) {
          const binomialCoefficient = _binomialCoefficient(this.n, i)
          const term = binomialCoefficient * (1 - t) ** (this.n - i) * t ** i

          for (let d = 0; d < 3; d++) {
            xyz[d] += term * this.controlPoints[i][d]
          }
        }

        this.vertexList.push(xyz)
      }
    }

    this._addVertex(this.controlPoints[this.controlPoints.length - 1] as Vertex)
    this.dimension = this.vertexList[0].length // update dimension

    return this.vertexList
  }

  private _addVertex(vArray: Vertex): void {
    // vArray is an array of [x, y] or [x, y, z]
    _lineTo(...vArray)
  }

  private _distVertex(vArray1: Vertex, vArray2: Vertex): number {
    if (this.dimension === 3 && vArray1.length === 3 && vArray2.length === 3) {
      return _helper_dist(
        vArray1[0],
        vArray1[1],
        vArray1[2],
        vArray2[0],
        vArray2[1],
        vArray2[2],
      )
    }
    if (this.dimension === 2) {
      return _helper_dist(vArray1[0], vArray1[1], vArray2[0], vArray2[1])
    }

    return 0
  }

  draw(dash?: [number, number]): void {
    if (!dash) {
      _beginPath()
      this.vertexList.map((v) => this._addVertex(v))

      if (this.closeType === 'CLOSE') _ctx.closePath()

      if (_useP5) _closePath(this.closeType)
      else if (this.closeType === 'CLOSE') _closePath()

      _helper_style()
    } else {
      if (this.increment > 0.008) {
        this.increment = 0.008
        window.console.warn(
          '[p5.bezier] Accuracy is changed to 6 for a dash curve',
        )
      }

      // draw a dash curve
      const solidPart = Math.abs(dash[0])
      const gapPart = Math.abs(dash[1])
      let solid = true

      let lastVertex: Vertex = this.vertexList[0]
      let toUseVertexInd = 1
      let toUseVertex: Vertex = this.vertexList[toUseVertexInd]
      let currentVirtualVertex: Vertex = lastVertex

      let availableDist = 0
      let neededDist: number = solid ? solidPart : gapPart

      _ctx.save() // push

      _ctx.fillStyle = 'rgba(0, 0, 0, 0)' // TODO
      _beginPath()
      _moveTo(...lastVertex)

      while (toUseVertexInd < this.vertexList.length) {
        toUseVertex = this.vertexList[toUseVertexInd]

        const newDist = this._distVertex(lastVertex, toUseVertex)
        availableDist = newDist

        while (availableDist >= neededDist) {
          currentVirtualVertex = _interpolateVertex(
            currentVirtualVertex,
            toUseVertex,
            neededDist / availableDist,
          )

          if (solid) _lineTo(...currentVirtualVertex)
          else _moveTo(...currentVirtualVertex)

          availableDist -= neededDist
          solid = !solid
          neededDist = solid ? solidPart : gapPart
        }

        // available dist is not enough, used as much as possible
        if (solid) _lineTo(...toUseVertex)
        else _moveTo(...toUseVertex)
        const usedDist = this._distVertex(currentVirtualVertex, toUseVertex)
        neededDist -= usedDist

        lastVertex = toUseVertex
        currentVirtualVertex = lastVertex
        toUseVertexInd++
      }

      _helper_style()

      _ctx.restore()
    }
  }

  update(newControlPointList: PointList) {
    if (newControlPointList.length !== this.controlPoints.length) {
      throw new Error('[p5.bezier] The number of control points changed.')
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
      throw new Error('[p5.bezier] X, Y, and Z are needed to move a 3D curve.')
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

export { initBezier as init, newBezier as draw, newBezierObj as new }
