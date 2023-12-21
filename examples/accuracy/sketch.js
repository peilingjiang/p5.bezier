/*
  p5.bezier.js accuracy example
  Peiling Jiang
  UCSD Design Lab 2023

  color palette from colorhunt.co
*/

let points = [
  [0, 0],
  [100, 1100],
  [1500, -2200],
  [1500, 2800],
  [100, -500],
  [0, 600],
]

function setup() {
  let c = createCanvas(1000, 600)
  p5bezier.initBezier(c)
  noFill()
}

function draw() {
  background(235)
  strokeWeight(2)
  stroke(color('#FFB99A'))
  p5bezier.newBezier(points, 'OPEN', 0)
  stroke(color('#FF6464'))
  p5bezier.newBezier(points, 'OPEN', 1)
  stroke(color('#DB3056'))
  p5bezier.newBezier(points, 'OPEN', 3)
  stroke(color('#851D41'))
  p5bezier.newBezier(points, 'OPEN', 7)

  // Caption
  push()
  noStroke()
  fill(color('#FFB99A'))
  text('Accuracy 0', 935, 540)
  fill(color('#FF6464'))
  text('Accuracy 1', 935, 555)
  fill(color('#DB3056'))
  text('Accuracy 3', 935, 570)
  fill(color('#851D41'))
  text('Accuracy 7', 935, 585)
  pop()
}
