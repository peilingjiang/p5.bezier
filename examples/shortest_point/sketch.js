/*
  p5.bezier.js shortest_point example
  Peiling Jiang
  NYU ITP/IMA 2020
*/

const points = [
  [0, 0],
  [100, 1100],
  [1500, -2200],
  [1500, 2800],
  [100, -500],
  [0, 600],
]
let bezierObject

function setup() {
  const c = createCanvas(1000, 600)
  p5bezier.initBezier(c)
  noFill()
  strokeWeight(2)

  bezierObject = new p5bezier.newBezierObj(points, 'OPEN', 10)
}

function draw() {
  background(235)
  // Draw the dash Bezier curve
  bezierObject.draw([20, 5])
  // Find the closest point and the shortest distance
  const pointOnCurve = bezierObject.shortest(mouseX, mouseY)
  const r = dist(mouseX, mouseY, pointOnCurve[0], pointOnCurve[1])

  // Draw the line and ellipse from mouse to point
  line(mouseX, mouseY, pointOnCurve[0], pointOnCurve[1])
  push()
  strokeWeight(1)
  stroke(color('#F0134D'))
  ellipse(mouseX, mouseY, 2 * r, 2 * r)
  pop()
}
