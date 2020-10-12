/*
p5.bezier library by Peiling Jiang
2020
*/

const p5bezierAccuracyListAll = [
  0.2,
  0.1,
  0.05,
  0.04,
  0.02,
  0.01,
  0.008,
  0.002,
  0.001,
  0.0005,
  0.0001,
]

let _canvas, _ctx, _dimension, _strict

export function initBezier(canvas, strictMode = false) {
  _canvas = canvas
  _ctx = _canvas.drawingContext
  _dimension = canvas.isP3D ? 3 : 2
  _strict = strictMode // Always check and throw errors or not
}

export function newBezier(pointList, closeType = 'OPEN', accuracy = 7) {
  if (_strict && !Array.isArray(pointList))
    throw ('newBezier() function expects an array, got %s.', typeof pointList)

  // Define the increment of t based on accuracy
  const tIncrement = p5bezierAccuracyListAll[accuracy]

  if (_dimension !== 0) {
    // Check if all points are valid
    if (_strict)
      for (let point of pointList)
        if (!Array.isArray(pointList) || point.length !== _dimension)
          throw 'One or more points in the array are not input correctly.'

    // Add the first point as the last point to close the curve
    if (closeType === 'CLOSE') pointList.push(pointList[0])
    let p = pointList.length // pointList has p points for (p - 1) degree curves
    let n = p - 1

    _ctx.beginPath()
    _ctx.moveTo(...pointList[0])
    // Are we drawing 2D or 3D curves
    if (_dimension === 2) {
      // 2-Dimensional bezier curve
      let x, y, t, i
      for (t = 0; t <= 1; t += tIncrement) {
        x = 0
        y = 0
        for (i = 0; i <= n; i++) {
          // i point in pointList
          x +=
            (_helper_factorial(n) /
              (_helper_factorial(i) * _helper_factorial(n - i))) *
            Math.pow(1 - t, n - i) *
            Math.pow(t, i) *
            pointList[i][0]
          y +=
            (_helper_factorial(n) /
              (_helper_factorial(i) * _helper_factorial(n - i))) *
            Math.pow(1 - t, n - i) *
            Math.pow(t, i) *
            pointList[i][1]
        }
        _ctx.lineTo(x, y)
      }
      _ctx.lineTo(...pointList.slice(-1)[0])
    } else if (_dimension === 3) {
      // 3-Dimensional bezier curve
      let xyz = [0, 0, 0],
        t,
        i,
        d
      for (t = 0; t <= 1; t += tIncrement) {
        xyz = [0, 0, 0]
        for (i = 0; i <= n; i++) {
          for (d = 0; d < 3; d++) {
            xyz[d] +=
              (_helper_factorial(n) /
                (_helper_factorial(i) * _helper_factorial(n - i))) *
              Math.pow(1 - t, n - i) *
              Math.pow(t, i) *
              pointList[i][d]
          }
        }
        _ctx.lineTo(...xyz)
      }
      _ctx.lineTo(...pointList.slice(-1)[0])
    }

    if (closeType === 'CLOSE') _ctx.closePath()
    else if (_strict && closeType !== 'OPEN')
      throw 'Close Type Error. A bezier curve can only be either OPEN or CLOSE.'

    _helper_style()

    return
  }
}

export function newBezierObj(pointList, closeType = 'OPEN', accuracy = 7) {
  // Define the increment of t based on accuracy
  const tIncrement = p5bezierAccuracyListAll[accuracy]

  if (_strict && !Array.isArray(pointList))
    throw ('newBezier() function expects an array, got %s.', typeof pointList)

  // Check if all points are valid
  if (_strict)
    for (let point of pointList)
      if (!Array.isArray(pointList) || point.length !== _dimension)
        throw 'One or more points in the array are not input correctly.'

  // All checks done
  let bObj = new BezierCurve(pointList, closeType, tIncrement, _dimension)
  return bObj
}

function _helper_factorial(a) {
  // Factorial function for binomial coefficient calculation
  return a > 1 ? a * _helper_factorial(a - 1) : 1
}

function _helper_dist() {
  if (arguments.length === 4)
    return Math.hypot(arguments[0] - arguments[2], arguments[1] - arguments[3])
  else if (arguments.length === 6)
    return Math.hypot(
      arguments[0] - arguments[3],
      arguments[1] - arguments[4],
      arguments[2] - arguments[5]
    )
  return 0
}

function _helper_style() {
  if (_canvas._doFill) _ctx.fill()
  if (_canvas._doStroke) _ctx.stroke()
}

class BezierCurve {
  // Take pointList, closeType, tIncrement, bezierDimension into constructor
  constructor(pL, closeT, tI, bD, vL = null) {
    if (_strict && bD !== 2 && bD !== 3) {
      throw (
        ("Dimension Error. The bezier curve is %d-dimensional and doesn't belong to our world.",
        bD)
      )
    }
    this.controlPoints = pL

    if (closeT === 'CLOSE') {
      this.controlPoints.push(pL[0])
      this.closeType = 'CLOSE'
    } else if (closeT === 'OPEN') {
      this.closeType = 'OPEN'
    } else {
      throw 'Close Type Error. A bezier curve can only be either OPEN or CLOSE.'
    }

    this.dimension = bD
    this.increment = tI
    this.vertexList = []
    this.vertexListLen = 0
    this.p = this.controlPoints.length // Has p points for (p - 1) degree curves
    this.n = this.p - 1 // Degree
    // Calculate thr vertex
    if (vL === null) {
      this._buildVertexList()
    } else {
      this.vertexList = vL
      this.vertexListLen = this.vertexList.length
    }
  }

  _buildVertexList() {
    /*
    Return vertexList
    */
    this.vertexList = []
    if (this.dimension === 2) {
      // 2-Dimensional bezier curve
      let x, y, t, i
      for (t = 0; t <= 1; t += this.increment) {
        x = 0
        y = 0
        for (i = 0; i <= this.n; i++) {
          // i point in pointList
          x +=
            (_helper_factorial(this.n) /
              (_helper_factorial(i) * _helper_factorial(this.n - i))) *
            Math.pow(1 - t, this.n - i) *
            Math.pow(t, i) *
            this.controlPoints[i][0]
          y +=
            (_helper_factorial(this.n) /
              (_helper_factorial(i) * _helper_factorial(this.n - i))) *
            Math.pow(1 - t, this.n - i) *
            Math.pow(t, i) *
            this.controlPoints[i][1]
        }
        this.vertexList.push([x, y])
      }
    } else if (this.dimension === 3) {
      // 3-Dimensional bezier curve
      let xyz = [0, 0, 0],
        t,
        i,
        d
      for (t = 0; t <= 1; t += this.increment) {
        xyz[0] = 0
        xyz[1] = 0
        xyz[2] = 0
        for (i = 0; i <= this.n; i++) {
          for (d = 0; d < 3; d++) {
            xyz[d] +=
              (_helper_factorial(this.n) /
                (_helper_factorial(i) * _helper_factorial(this.n - i))) *
              Math.pow(1 - t, this.n - i) *
              Math.pow(t, i) *
              this.controlPoints[i][d]
          }
        }
        this.vertexList.push(xyz)
      }
    }
    // Ending fix
    this._addVertex(this.controlPoints.slice(-1)[0])

    this.dimension = this.vertexList[0].length // Update dimension
    this.vertexListLen = this.vertexList.length // Update vertexListLen
    return this.vertexList
  }

  _addVertex(vArray) {
    // vArray is an array of [x, y] position or [x, y, z] position
    if (this.dimension === 2 || this.dimension === 3) _ctx.lineTo(...vArray)
    else throw 'Vertices can only be in 2D or 3D space.'
  }

  _distVertex(vArray1, vArray2) {
    // Calculate the distance between
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
  }

  draw(dash) {
    if (!dash) {
      _ctx.beginPath()
      for (let v of this.vertexList) {
        this._addVertex(v)
      }

      if (this.closeType === 'CLOSE') _ctx.closePath()
      _helper_style()
    } else if (
      Array.isArray(dash) &&
      dash.length === 2 &&
      this.increment <= 0.008
    ) {
      // Draw a dash curve
      let solidPart = Math.abs(dash[0]) // Length of one solid part
      let onePart = solidPart + Math.abs(dash[1]),
        nowLen = 0,
        modOnePart = 0
      let lastVertex = this.vertexList[0]
      let solid = true // true draw, false break

      _ctx.save() // push
      _ctx.fillStyle = 'rgba(0, 0, 0, 0)' // TODO: Enable fill
      _ctx.beginPath()
      _ctx.moveTo(...this.vertexList[0])
      for (let v = 1; v < this.vertexListLen; v++) {
        nowLen += this._distVertex(lastVertex, this.vertexList[v])
        modOnePart = nowLen % onePart
        if (modOnePart <= solidPart && solid) {
          this._addVertex(this.vertexList[v])
        } else if (modOnePart > solidPart && modOnePart <= onePart && solid) {
          // endShape()
          solid = false
        } else if (modOnePart <= solidPart && !solid) {
          _ctx.moveTo(...this.vertexList[v])
          solid = true
        }
        lastVertex = this.vertexList[v]
      }
      // if (solid) {
      //   // Shape didn't end
      //   endShape()
      // }
      _helper_style()
      _ctx.restore()
    } else if (this.increment > 0.008) {
      throw 'Fidelity is too low for a dash line. It should be at least 6.'
    } else {
      throw "Your dash array input is not valid. Make sure it's an array of two numbers."
    }
  }

  update(newControlList) {
    /*
    Update the vertexList when control points change
    */
    if (newControlList.length !== this.controlPoints) {
      throw 'The number of points changed. (Keep the point array length the same.)'
    } else if (this.controlPoints === newControlList) {
      // Do we really need to update? No.
      // return ;
    } else {
      this.controlPoints = newControlList
      this._buildVertexList()
    }
  }

  move(x, y, z = null, toDraw = true, dash = 0) {
    /*
    Move the curve to another place
    Return a new object
    */
    if (z === null && this.dimension === 3) {
      // A 3D curve treated as 2D error
      throw 'To move a 3D curve, please specify (x, y, z).'
    } else {
      let toMove = [x, y]
      if (z !== null) toMove.push(z)
      // Copy to a new object
      let newCurveV = []
      for (let i = 0; i < this.vertexListLen; i++)
        newCurveV.push(this.vertexList[i].slice())
      let newCurveObj = new BezierCurve(
        this.controlPoints,
        this.closeType,
        this.increment,
        this.dimension,
        newCurveV
      )
      // Move
      for (let i = 0; i < newCurveObj.vertexListLen; i++) {
        for (let j = 0; j < newCurveObj.dimension; j++) {
          newCurveObj.vertexList[i][j] += toMove[j]
        }
      }
      if (toDraw) {
        newCurveObj.draw(dash)
      }
      return newCurveObj
    }
  }

  shortest(pX, pY, pZ = 0) {
    // Return the point on curve that is closest to the point outside
    // Always return array length of 3
    // Last position (z) be 0 for all 2D calculation
    let dMin = -1,
      nowMin = 0
    let minVertex
    for (let v of this.vertexList) {
      if (dMin === -1) {
        dMin = this._distVertex(v, [pX, pY, pZ])
        minVertex = v
      } else {
        nowMin = this._distVertex(v, [pX, pY, pZ])
        if (dMin > nowMin) {
          dMin = nowMin
          minVertex = v
        }
      }
    }
    return minVertex // An array of vertex position
  }
}
