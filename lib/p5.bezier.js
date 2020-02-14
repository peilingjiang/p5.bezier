/*
p5.bezier library by Peiling Jiang
2020
*/

p5.prototype.newBezier = function (pointList, closeType='OPEN') {
  if (Array.isArray(pointList)) {
    let bezierDimension = pointList[0].length;
    // Check if all points are valid
    for (let point of pointList) {
      if (!Array.isArray(pointList) || point.length != bezierDimension) {
        throw "One or more points in the array are not input correctly."
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
      for (t = 0; t <= 1; t += 0.008) {
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
      let xyz, t, i, d;
      for (t = 0; t <= 1; t += 0.008) {
        xyz = [0, 0, 0];
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
    return;
  } else {
    throw ("newBezier function expects an array, got %s.", typeof(pointList))
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
