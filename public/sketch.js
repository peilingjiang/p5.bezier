/* eslint-disable no-undef */

/*
  Peiling Jiang
  UCSD Design Lab 2023
*/

// DRAG THE POINTS AROUND!

let pa // a PointArray object

function setup() {
  let c = createCanvas(windowWidth, windowHeight)
  p5bezier.initBezier(c)
  noFill()

  pa = new PointArray()
  pa.add(100, 400)
  pa.add(400, 700)
  pa.add(700, 100)
  pa.add(1000, 400)
}

function draw() {
  background(255)
  stroke(color('#FD5E53'))
  strokeWeight(3)
  // Draw an open Bezier curve with fidelity of 9 (highest)
  p5bezier.newBezier(pa.get(), 'OPEN', 10)
  pa.display()
}

function mouseDragged() {
  pa.update(mouseX, mouseY)
}

class PointArray {
  constructor() {
    this.pointArray = []
  }

  add(pX, pY) {
    this.pointArray.push(new Point(pX, pY))
  }

  display() {
    for (let point of this.pointArray) point.display()
  }

  update(mX, mY) {
    for (let point of this.pointArray) {
      if (dist(mX, mY, point.position[0], point.position[1]) < 60)
        point.update(mX, mY)
    }
  }

  get() {
    // Return an array of array
    // for p5bezier.newBezier function to use
    let positionArray = []
    // point is a Point object
    for (let point of this.pointArray) positionArray.push(point.position)
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
      '(' + this.position[0] + ', ' + this.position[1] + ')',
      this.position[0] + 10,
      this.position[1] - 10
    )
    pop()
  }

  update(mX, mY) {
    this.position = [mX, mY]
  }
}
