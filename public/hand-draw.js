/*
  Peiling Jiang
  UCSD Design Lab 2024
*/

// DRAW ON CANVAS!

const lines = []

let currentLine = []
let pointCount = 0

function setup() {
  const c = createCanvas(windowWidth, windowHeight)
  p5bezier.init(c)
}

function draw() {
  background(255)

  for (let i = 0; i < lines.length; i++) {
    drawLine(lines[i], i)
  }

  if (currentLine.length > 0) {
    drawLine(currentLine, lines.length)
  }
}

function drawLine(line) {
  push()
  noFill()
  stroke(color('#FF4949'))
  strokeWeight(3)
  const pl = p5bezier.draw(line)
  pop()

  // points
  for (const point of pl) {
    fill(color('#541690'))
    ellipse(point[0], point[1], 7, 7)
  }

  // point count
  fill(0)
  noStroke()
  text(
    line.length,
    line[line.length - 1][0] + 10,
    line[line.length - 1][1] + 10,
  )
}

function mousePressed() {
  currentLine = []
  pointCount = 0
}

function mouseDragged() {
  currentLine.push([mouseX, mouseY])
  pointCount++
}

function mouseReleased() {
  if (currentLine.length > 1) {
    lines.push(currentLine)
  }

  currentLine = []
}
