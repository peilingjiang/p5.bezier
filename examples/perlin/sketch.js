/*
  p5.bezier.js basic example
  Peiling Jiang
  NYU ITP/IMA 2020
*/

let xOff = 0
let yOff = 100
let bObject

function setup() {
  let c = createCanvas(window.innerWidth, 300)

  p5bezier.initBezier(c)

  noFill()
  strokeWeight(5)

  textStyle(BOLD)
  textSize(120)
  textAlign(CENTER, CENTER)
  textFont('Roboto')
}

function draw() {
  background('#06283D')

  xOff = xOff + 0.0025
  yOff = yOff + 0.003

  stroke('#1363DF')
  p5bezier.newBezier(getNoisePoints(xOff), 'OPEN', 6)

  push()
  noStroke()
  fill('#FFFFFF')
  text('p5.bezier', width >> 1, height >> 1)
  pop()

  stroke('#DFF6FF')
  p5bezier.newBezier(getNoisePoints(xOff + 1), 'OPEN', 6)
  stroke('#47B5FF')
  p5bezier.newBezier(getNoisePoints(yOff + 3), 'OPEN', 6)
  stroke('#D61C4E')
  p5bezier.newBezier(getNoisePoints(yOff + 5), 'OPEN', 6)
}

function getNoisePoints(offset) {
  const points = []
  for (let pointX = 0; pointX <= width + 50; pointX += 50) {
    const pointY = ((noise(offset + pointX) * height) << 1) - (height >> 1)
    points.push([pointX, pointY])
  }

  return points
}
