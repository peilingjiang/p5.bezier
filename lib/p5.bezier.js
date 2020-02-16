/*
p5.bezier library by Peiling Jiang
2020
*/

p5bezierAccuracyListAll = [0.2, 0.1, 0.05, 0.04, 0.02, 0.01, 0.008, 0.005, 0.002, 0.001];

p5.prototype.newBezier = function (pointList, closeType='OPEN', accuracy=7) {
  // Define the increment of t based on accuracy
  let tIncrement = p5bezierAccuracyListAll[accuracy];

  if (!Array.isArray(pointList)) {
    throw ("newBezier() function expects an array, got %s.", typeof(pointList));
  } else {
    let bezierDimension = pointList[0].length;
    // Check if all points are valid
    for (let point of pointList) {
      if (!Array.isArray(pointList) || point.length != bezierDimension) {
        throw "One or more points in the array are not input correctly.";
      }
    }
    // Add the first point as the last point to close the curve
    if (closeType == 'CLOSE') pointList.push(pointList[0]);
    let p = pointList.length; // pointList has p points for (p - 1) degree curves
    let n = p - 1;

    beginShape();
    // Are we drawing 2D or 3D curves
    if (bezierDimension == 2) {
      // 2-Dimensional bezier curve
      let x, y, t, i;
      for (t = 0; t <= 1; t += tIncrement) {
        x = 0;
        y = 0;
        for (i = 0; i <= n; i++) {
          // i point in pointList
          x += ( factorial(n) / (factorial(i) * factorial(n - i)) ) * pow(1 - t, n - i) * pow(t, i) * pointList[i][0];
          y += ( factorial(n) / (factorial(i) * factorial(n - i)) ) * pow(1 - t, n - i) * pow(t, i) * pointList[i][1];
        }
        vertex(x, y);
      }

    } else if (bezierDimension == 3) {
      // 3-Dimensional bezier curve
      let xyz = [0, 0, 0], t, i, d;
      for (t = 0; t <= 1; t += tIncrement) {
        xyz[0] = 0;
        xyz[1] = 0;
        xyz[2] = 0;
        for (i = 0; i <= n; i++) {
          for (d = 0; d < 3; d++) {
            xyz[d] += ( factorial(n) / (factorial(i) * factorial(n - i)) ) * pow(1 - t, n - i) * pow(t, i) * pointList[i][d];
          }
        }
        vertex(xyz[0], xyz[1], xyz[2]);
      }
    }
    if (closeType == 'OPEN') endShape();
    else if (closeType == 'CLOSE') endShape(CLOSE);
    else throw "Close Type Error. A bezier curve can only be either OPEN or CLOSE.";
    return ;
  }
}

p5.prototype.newBezierObj = function (pointList, closeType='OPEN', accuracy=7) {
  // Define the increment of t based on accuracy
  let tIncrement = p5bezierAccuracyListAll[accuracy];

  if (!Array.isArray(pointList)) {
    throw ("newBezier() function expects an array, got %s.", typeof(pointList));
  } else {
    let bezierDimension = pointList[0].length;
    // Check if all points are valid
    for (let point of pointList) {
      if (!Array.isArray(pointList) || point.length != bezierDimension) {
        throw "One or more points in the array are not input correctly.";
      }
    }
    // All checks done
    let bObj = new BezierCurve(pointList, closeType, tIncrement, bezierDimension);
    return bObj;
  }
}

function factorial (a) {
  // Factorial function for binomial coefficient calculation
  if (a == 0 || a == 1) {
    return 1;
  } else if (a > 1) {
    return a * factorial(a - 1);
  }
}

class BezierCurve {
  // Take pointList, closeType, tIncrement, bezierDimension into constructor
  constructor(pL, closeT, tI, bD) {
    if (bD != 2 && bD != 3) {
      throw ("Dimension Error. The bezier curve is %d-dimensional and doesn't belong to our world.", bD);
    }
    this.controlPoints = pointList;

    if (closeT == 'CLOSE') {
      this.controlPoints.push(pL[0]);
      this.closeType = 'CLOSE';
    } else if (closeT == 'OPEN') {
      this.closeType = 'OPEN';
    } else {
      throw "Close Type Error. A bezier curve can only be either OPEN or CLOSE.";
    }

    this.dimension = bD;
    this.increment = tI;
    this.vertexList = [];
    this.vertexListLen = 0;
    this.p = this.controlPoints.length; // Has p points for (p - 1) degree curves
    this.n = p - 1; // Degree
    // Calsulate thr vertex
    return this._buildVertexList();
  }

  _buildVertexList() {
    /*
    return vertexList
    */
    this.vertexList = [];
    if (this.dimension == 2) {
      // 2-Dimensional bezier curve
      let x, y, t, i;
      for (t = 0; t <= 1; t += this.increment) {
        x = 0;
        y = 0;
        for (i = 0; i <= this.n; i++) {
          // i point in pointList
          x += ( factorial(this.n) / (factorial(i) * factorial(this.n - i)) ) * pow(1 - t, this.n - i) * pow(t, i) * this.controlPoints[i][0];
          y += ( factorial(this.n) / (factorial(i) * factorial(this.n - i)) ) * pow(1 - t, this.n - i) * pow(t, i) * this.controlPoints[i][1];
        }
        this.vertexList.push([x, y]);
      }
    } else if (this.dimension == 3) {
      // 3-Dimensional bezier curve
      let xyz = [0, 0, 0], t, i, d;
      for (t = 0; t <= 1; t += this.increment) {
        xyz[0] = 0;
        xyz[1] = 0;
        xyz[2] = 0;
        for (i = 0; i <= this.n; i++) {
          for (d = 0; d < 3; d++) {
            xyz[d] += ( factorial(this.n) / (factorial(i) * factorial(this.n - i)) ) * pow(1 - t, this.n - i) * pow(t, i) * this.controlPoints[i][d];
          }
        }
        this.vertexList.push(xyz);
      }
    }
    this.dimension = this.vertexList[0].length; // Update dimension
    this.vertexListLen = this.vertexList.length; // Update vertexListLen
    return this.vertexList;
  }

  _addVertex(vArray) {
    // vArray is an array of [x, y] position or [x, y, z] position
    if (this.dimension == 2) {
      vertex(vArray[0], vArray[1]);
    } else if (this.dimension == 3) {
      vertex(vArray[0], vArray[1], vArray[2]);
    } else {
      throw "Vertices can only be in 2D or 3D space."
    }
  }

  _distVertex(vArray1, vArray2) {
    if (this.dimension == 2) {
      return dist(vArray1[0], vArray1[1], vArray2[0], vArray2[1]);
    } else if (this.dimension == 3) {
      return dist(vArray1[0], vArray1[1], vArray1[2], vArray2[0], vArray2[1], vArray2[2]);
    }
  }

  draw(dash=0) {
    if (dash == 0) {
      beginShape();
      for (let v of this.vertexList) {
        this._addVertex(v);
      }
      if (this.closeType == 'OPEN') endShape();
      else if (this.closeType == 'CLOSE') endShape(CLOSE);
    } else if (Array.isArray(dash) && dash.length == 2 && this.increment <= 0.008) {
      // Draw a dash curve
      let solidPart = abs(dash[0]); // Length of one solid part
      let onePart = solidPart + abs(dash[1]), nowLen = 0, modOnePart = 0;
      let lastVertex = this.vertexList[0];
      let solid = true; // true draw, false break
      push();
      noFill();
      beginShape();
      this._addVertex(this.vertexList[0]);
      for (let v = 1; v < this.vertexListLen; v++) {
        nowLen += this._distVertex(lastVertex, this.vertexList[v]);
        modOnePart = nowLen % onePart;
        if (modOnePart <= solidPart && solid) {
          this._addVertex(this.vertexList[v])
        } else if (modOnePart > solidPart && modOnePart <= onePart && solid) {
          endShape();
          solid = false;
        } else if (modOnePart <= solidPart && !solid) {
          beginShape();
          this._addVertex(this.vertexList[v]);
          solid = true;
        }
        lastVertex = this.vertexList[v];
      }
      if (solid) {
        // Shape didn't end
        endShape();
      }
      pop();
    } else if (this.increment > 0.008) {
      throw "Fidelity is too low for a dash line. It should be at least 6."
    } else {
      throw "Your dash array input is not valid. Make sure it's an array of two numbers."
    }
  }

  update(newControlList) {
    /*
    Update the vertexList when control points change
    */
    if (newControlList.length != this.controlPoints) {
      throw "The number of points changed.";
    } else if (this.controlPoints == newControlList) {
      // Do we really need to update? No.
      // return ;
    } else {
      this.controlPoints = newControlList;
      return this._buildVertexList();
    }
  }

  shortest(pX, pY, pZ=0) {
    // Return the point on curve that is closest to the point outside
    // Always return array length of 3
    // Last position (z) be 0 for all 2D calculation
    let dMin = -1, nowMin = 0;
    let minVertex;
    for (let v of this.vertexList) {
      if (dMin == -1) {
        dMin = this._distVertex(v, [pX, pY, pZ]);
        minVertex = v;
      } else {
        nowMin = this._distVertex(v, [pX, pY, pZ]);
        if (dMin > nowMin) {
          dMin = nowMin;
          minVertex = v;
        }
      }
    }
    return minVertex; // An array of vertex position
  }
}
