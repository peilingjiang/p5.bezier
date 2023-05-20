/*
p5.bezier library by Peiling Jiang
2020

updated May 2023
*/

declare const p5: any

window.console.log('[p5.bezier]')

// fidelity 0-10
const p5bezierAccuracyListAll: number[] = [
  0.2, 0.1, 0.05, 0.04, 0.02, 0.01, 0.008, 0.002, 0.001, 0.0005, 0.0001,
]

let _canvas: any,
  _ctx: any,
  _dimension: number,
  _strict: boolean,
  _useP5: boolean,
  _beginPath: Function,
  _moveTo: Function,
  _lineTo: Function,
  _closePath: Function

let _precalculatedFactorials: number[] = [1]

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
// helpers

function _determineDimension(context: any, isP3D: boolean): number {
  return context.constructor.name === 'WebGLRenderingContext' || isP3D ? 3 : 2
}

function _setCanvasFunctions(useP5: boolean, canvas: any, context: any) {
  if (useP5) {
    _beginPath = canvas.beginShape
    _moveTo = canvas.vertex
    _lineTo = canvas.vertex
    _closePath = canvas.endShape
  } else {
    _beginPath = context.beginPath.bind(context)
    _moveTo = context.moveTo.bind(context)
    _lineTo = context.lineTo.bind(context)
    _closePath = context.closePath.bind(context)
  }
}

function _ensureFactorials(n: number): void {
  for (let i = _precalculatedFactorials.length; i <= n; i++) {
    _precalculatedFactorials[i] = i * _precalculatedFactorials[i - 1]
  }
}

function _helper_factorial(i: number): number {
  _ensureFactorials(i)
  return _precalculatedFactorials[i]
}

function _binomialCoefficient(n: number, i: number): number {
  _ensureFactorials(n)
  return (
    _helper_factorial(n) / (_helper_factorial(i) * _helper_factorial(n - i))
  )
}

function _helper_dist(...args: number[]): number {
  if (args.length === 4) return Math.hypot(args[0] - args[2], args[1] - args[3])
  else if (args.length === 6)
    return Math.hypot(args[0] - args[3], args[1] - args[4], args[2] - args[5])
  return 0
}

function _helper_style() {
  if (_canvas._doFill) _ctx.fill()
  if (_canvas._doStroke) _ctx.stroke()
}

function _deepCopyArray(arr: number[][]): number[][] {
  return arr.map((v: number[]) => [...v])
}

function _findCloseCurveExtraPoints(pointList: number[][]): number[][] {
  let first = pointList[0]
  let last = pointList[pointList.length - 1]
  let second = pointList[1]
  let secondLast = pointList[pointList.length - 2]

  let point1 = [2 * last[0] - secondLast[0], 2 * last[1] - secondLast[1]]
  let point2 = [2 * first[0] - second[0], 2 * first[1] - second[1]]

  return [point1, point2, first]
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

export function initBezier(canvas: any, strictMode: boolean = false): void {
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
    ) {
      window.console.warn(
        '[p5.bezier] Support for non-p5 canvas is not tested.'
      )
    }
    _dimension = _determineDimension(_ctx, canvas.isP3D)
  } else {
    throw new Error('[p5.bezier] Canvas is not supported.')
  }

  _setCanvasFunctions(_useP5, _canvas, _ctx)
  _strict = strictMode
}

export function newBezier(
  pointList: number[][],
  closeType: string = 'OPEN',
  accuracy: number = 7
): void {
  if (_strict && !Array.isArray(pointList)) {
    throw new Error(
      `[p5.bezier] newBezier() function expects an array, got ${typeof pointList}.`
    )
  }

  pointList = _deepCopyArray(pointList)

  if (closeType === 'CLOSE') {
    const closeCurveExtraPoints = _findCloseCurveExtraPoints(pointList)
    pointList.push(...closeCurveExtraPoints)
  }

  const tIncrement = p5bezierAccuracyListAll[accuracy]
  const p = pointList.length // pointList has p points for (p - 1) degree curves
  const n = p - 1

  if (_dimension !== 0) {
    if (_strict) {
      for (let point of pointList) {
        if (!Array.isArray(pointList) || point.length !== _dimension) {
          throw new Error(
            '[p5.bezier] One or more points in the array are not input correctly.'
          )
        }
      }
    }

    _ensureFactorials(n)

    _beginPath()
    _moveTo(...pointList[0])

    if (_dimension === 2) {
      let x, y, t
      for (t = 0; t <= 1; t += tIncrement) {
        x = y = 0
        for (let i = 0; i <= n; i++) {
          const coefficient =
            _binomialCoefficient(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i)
          x += coefficient * pointList[i][0]
          y += coefficient * pointList[i][1]
        }
        _lineTo(x, y)
      }
    } else if (_dimension === 3) {
      let t
      for (t = 0; t <= 1; t += tIncrement) {
        let xyz: number[] = [0, 0, 0]
        for (let i = 0; i <= n; i++) {
          const coefficient =
            _binomialCoefficient(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i)
          for (let d = 0; d < 3; d++) {
            xyz[d] += coefficient * pointList[i][d]
          }
        }
        _lineTo(...xyz)
      }
    }

    _lineTo(...pointList.slice(-1)[0])

    if (_useP5) {
      _closePath(closeType)
    } else if (closeType === 'CLOSE') {
      _closePath()
    } else if (_strict && closeType !== 'OPEN') {
      throw new Error(
        '[p5.bezier] Close type error. A bezier curve can only be either OPEN or CLOSE.'
      )
    }

    _helper_style()
  }
}

export function newBezierObj(
  pointList: Array<Array<number>>,
  closeType: string = 'OPEN',
  accuracy: number = 7
): BezierCurve {
  const tIncrement = p5bezierAccuracyListAll[accuracy]

  if (_strict) {
    if (!Array.isArray(pointList)) {
      throw new Error(
        `[p5.bezier] newBezierObj() function expects an array, got ${typeof pointList}.`
      )
    }

    for (let point of pointList) {
      if (!Array.isArray(point) || point.length !== _dimension) {
        throw new Error(
          '[p5.bezier] One or more points in the array are not input correctly.'
        )
      }
    }
  }

  return new BezierCurve(pointList, closeType, tIncrement, _dimension)
}

class BezierCurve {
  controlPoints: any[]
  closeType: string
  dimension: number
  increment: number
  vertexList: any[]
  vertexListLen: number
  p: number
  n: number

  // take pointList, closeType, tIncrement, bezierDimension into constructor
  constructor(
    pL: any[],
    closeT: string,
    tI: number,
    bD: number,
    vL: any[] | null = null
  ) {
    if (_strict && bD !== 2 && bD !== 3) {
      throw new Error(
        `[p5.bezier] Dimension error. The bezier curve is ${bD}-dimensional and doesn't belong to our world.`
      )
    }

    this.controlPoints = _deepCopyArray(pL)

    if (closeT === 'CLOSE') {
      this.controlPoints.push(..._findCloseCurveExtraPoints(this.controlPoints))
      this.closeType = 'CLOSE'
    } else if (closeT === 'OPEN') {
      this.closeType = 'OPEN'
    } else {
      throw new Error(
        '[p5.bezier] Close type error. A bezier curve can only be either OPEN or CLOSE.'
      )
    }

    this.dimension = bD
    this.increment = tI
    this.vertexList = []
    this.vertexListLen = 0
    this.p = this.controlPoints.length // has p points for (p - 1) degree curves
    this.n = this.p - 1 // degree

    // ensure enough factorials are calculated up to this.n
    _ensureFactorials(this.n)

    if (vL === null) {
      this._buildVertexList()
    } else {
      this.vertexList = [...vL]
      this.vertexListLen = this.vertexList.length
    }
  }

  private _buildVertexList(): any[] {
    this.vertexList = []

    if (this.dimension === 2) {
      for (let t = 0; t <= 1; t += this.increment) {
        let x = 0
        let y = 0

        for (let i = 0; i <= this.n; i++) {
          let binomialCoefficient = _binomialCoefficient(this.n, i)
          let term =
            binomialCoefficient * Math.pow(1 - t, this.n - i) * Math.pow(t, i)

          x += term * this.controlPoints[i][0]
          y += term * this.controlPoints[i][1]
        }

        this.vertexList.push([x, y])
      }
    } else if (this.dimension === 3) {
      for (let t = 0; t <= 1; t += this.increment) {
        let xyz: number[] = [0, 0, 0]

        for (let i = 0; i <= this.n; i++) {
          let binomialCoefficient = _binomialCoefficient(this.n, i)
          let term =
            binomialCoefficient * Math.pow(1 - t, this.n - i) * Math.pow(t, i)

          for (let d = 0; d < 3; d++) {
            xyz[d] += term * this.controlPoints[i][d]
          }
        }

        this.vertexList.push(xyz)
      }
    }

    this._addVertex(this.controlPoints[this.controlPoints.length - 1])

    this.dimension = this.vertexList[0].length // update dimension
    this.vertexListLen = this.vertexList.length // update vertexListLen

    return this.vertexList
  }

  private _addVertex(vArray: number[]): void {
    // vArray is an array of [x, y] position or [x, y, z] position
    if (this.dimension === 2 || this.dimension === 3) _lineTo(...vArray)
    else throw new Error('[p5.bezier] Vertices can only be in 2D or 3D space.')
  }

  private _distVertex(vArray1: number[], vArray2: number[]): number {
    // calculate the distance between
    // vertex_array_1 and vertex_array_2
    if (this.dimension === 2) {
      return _helper_dist(vArray1[0], vArray1[1], vArray2[0], vArray2[1])
    } else if (this.dimension === 3) {
      return _helper_dist(
        vArray1[0],
        vArray1[1],
        vArray1[2],
        vArray2[0],
        vArray2[1],
        vArray2[2]
      )
    }

    return 0
  }

  draw(dash?: number[]): void {
    if (!dash) {
      _beginPath()
      for (let v of this.vertexList) {
        this._addVertex(v)
      }

      if (this.closeType === 'CLOSE') _ctx.closePath()

      if (_useP5) _closePath(this.closeType)
      else if (this.closeType === 'CLOSE') _closePath()

      _helper_style()
    } else if (
      Array.isArray(dash) &&
      dash.length === 2 &&
      this.increment <= 0.008
    ) {
      // draw a dash curve
      let solidPart: number = Math.abs(dash[0]) // length of one solid part
      let onePart: number = solidPart + Math.abs(dash[1]),
        nowLen: number = 0,
        modOnePart: number = 0
      let lastVertex: any[] = this.vertexList[0]
      let solid: boolean = true // true draw, false break

      _ctx.save() // push
      _ctx.fillStyle = 'rgba(0, 0, 0, 0)' // TODO enable fill

      _beginPath()
      _moveTo(...this.vertexList[0])

      for (let v = 1; v < this.vertexListLen; v++) {
        nowLen += this._distVertex(lastVertex, this.vertexList[v])
        modOnePart = nowLen % onePart
        if (modOnePart <= solidPart && solid) {
          this._addVertex(this.vertexList[v])
        } else if (modOnePart > solidPart && modOnePart <= onePart && solid) {
          // endShape();
          solid = false
        } else if (modOnePart <= solidPart && !solid) {
          _moveTo(...this.vertexList[v])
          solid = true
        }
        lastVertex = this.vertexList[v]
      }

      _helper_style()
      _ctx.restore()
    } else if (this.increment > 0.008)
      throw new Error(
        '[p5.bezier] Fidelity is too low for a dash line. It should be at least 6.'
      )
    else
      throw new Error(
        "[p5.bezier] Your dash array input is not valid. Make sure it's an array of two numbers."
      )
  }

  update(newControlList: number[][]) {
    if (newControlList.length !== this.controlPoints.length) {
      throw new Error(
        '[p5.bezier] The number of points changed. (Keep the length of the point array the same.)'
      )
    } else if (this.controlPoints.every((v, i) => v === newControlList[i])) {
      return
    } else {
      this.controlPoints = newControlList
      this._buildVertexList()
    }
  }

  move(
    x: number,
    y: number,
    z: number | null = null,
    toDraw: boolean = true,
    dash: number[] = [0]
  ): BezierCurve {
    if (z === null && this.dimension === 3) {
      throw new Error(
        '[p5.bezier] To move a 3D curve, please specify (x, y, z).'
      )
    } else {
      const toMove: number[] = [x, y]
      if (z !== null) toMove.push(z)

      const newCurveV: number[][] = this.vertexList.map(v => v.slice())
      const newCurveObj: BezierCurve = new BezierCurve(
        this.controlPoints,
        this.closeType,
        this.increment,
        this.dimension,
        newCurveV
      )

      newCurveObj.vertexList = newCurveObj.vertexList.map((v: number[]) =>
        v.map((val: number, i: number) => val + toMove[i])
      )

      if (toDraw) {
        newCurveObj.draw(dash)
      }

      return newCurveObj
    }
  }

  shortest(pX: number, pY: number, pZ: number = 0): number[] {
    let minVertex: number[] = []
    let dMin = Infinity

    for (let v of this.vertexList) {
      const nowMin = this._distVertex(v, [pX, pY, pZ])
      if (dMin > nowMin) {
        dMin = nowMin
        minVertex = v
      }
    }

    return minVertex
  }
}
