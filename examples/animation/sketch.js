/*
  p5.bezier.js animation example
  Peiling Jiang
  UCSD Design Lab 2023
*/

let t = 0 // set up a variable for time

function setup() {
  let c = createCanvas(window.innerWidth, window.innerHeight)

  p5bezier.initBezier(c)

  noFill()
  strokeWeight(5)

  textStyle(BOLD)
  textSize(120)
  textAlign(CENTER, CENTER)
  textFont('Arvo')
}

function draw() {
  background('#06283D')

  // update time
  t += 0.015

  stroke('#1363DF')
  p5bezier.newBezier(getSinPoints(t), 'OPEN', 7)
  stroke('#DFF6FF')
  p5bezier.newBezier(getSinPoints(t + 0.5), 'OPEN', 7)

  push()
  noStroke()
  fill('#FFFFFFEE')
  text('p5.bezier', width >> 1, height >> 1)
  pop()

  stroke('#47B5FF')
  p5bezier.newBezier(getSinPoints(t + 1), 'OPEN', 7)
  stroke('#D61C4E')
  p5bezier.newBezier(getSinPoints(t + 1.5), 'OPEN', 8)
}

function getSinPoints(t) {
  const points = []
  for (let pointX = 0; pointX <= width + 100; pointX += 100) {
    const pointY = height / 2 + sin(t * 2 + pointX * 0.012) * height // Double frequency and phase shift
    points.push([pointX, pointY])
  }

  return points
}
