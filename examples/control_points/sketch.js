/* eslint-disable no-undef */

/*
  Peiling Jiang
  UCSD Design Lab 2023
*/

// DRAG THE POINTS AROUND!

let pa // a PointArray object

// eslint-disable-next-line no-unused-vars
function setup() {
  const c = createCanvas(windowWidth, windowHeight)
  p5bezier.init(c)
  noFill()

  pa = new PointArray()
  pa.add(100, 400)
  pa.add(400, 700)
  pa.add(700, 100)
  pa.add(1000, 400)
}

// eslint-disable-next-line no-unused-vars
function draw() {
  background(255)
  stroke(color('#FD5E53'))
  strokeWeight(3)
  // Draw an open Bezier curve with accuracy of 10 (highest)
  p5bezier.draw(pa.get(), 'OPEN', 5)
  pa.display(true)
}

let focusedPointInd = -1
// eslint-disable-next-line no-unused-vars
function mousePressed() {
  const distances = pa.points.map((point) =>
    dist(mouseX, mouseY, point.position[0], point.position[1]),
  )
  const minDistance = Math.min(...distances)

  if (minDistance < 60) {
    const minIndex = distances.indexOf(minDistance)
    focusedPointInd = minIndex
  } else focusedPointInd = pa.add(mouseX, mouseY)
}

// eslint-disable-next-line no-unused-vars
function mouseDragged() {
  if (focusedPointInd > -1)
    pa.pointArray[focusedPointInd].update(mouseX, mouseY)
}

// eslint-disable-next-line no-unused-vars
function mouseUp() {
  focusedPointInd = -1
}

class PointArray {
  constructor() {
    this.pointArray = []
  }

  get points() {
    return this.pointArray
  }

  add(pX, pY) {
    let index = 0
    for (const point of this.pointArray) {
      if (pX < point.position[0]) break
      index++
    }
    this.pointArray.splice(index, 0, new Point(pX, pY))

    return index
  }

  display(lines = false) {
    if (lines) {
      push()
      stroke(50)
      strokeWeight(1)
      for (
        let pointIndex = 0;
        pointIndex < pa.pointArray.length - 1;
        pointIndex++
      ) {
        line(
          this.pointArray[pointIndex].position[0],
          this.pointArray[pointIndex].position[1],
          this.pointArray[pointIndex + 1].position[0],
          this.pointArray[pointIndex + 1].position[1],
        )
      }
      pop()
    }

    for (const point of this.pointArray) point.display()
  }

  get() {
    // Return an array of array
    // for p5bezier.draw function to use
    const positionArray = []
    // point is a Point object
    for (const point of this.pointArray) positionArray.push(point.position)
    return positionArray
  }
}

class Point {
  constructor(x, y) {
    this.position = [x, y]
    this.r = 10
  }

  display() {
    push()
    fill(255)
    stroke(0)
    strokeWeight(2)
    ellipse(this.position[0], this.position[1], 2 * this.r, 2 * this.r)
    fill(0)
    noStroke()
    text(
      `(${this.position[0]}, ${this.position[1]})`,
      this.position[0] + 10,
      this.position[1] - 10,
    )
    pop()
  }

  update(mX, mY) {
    this.position = [mX, mY]
  }
}
