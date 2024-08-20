/*
  p5.bezier.js basic example
  Peiling Jiang
  NYU ITP/IMA 2020
*/

function setup() {
  const c = createCanvas(500, 500)
  p5bezier.init(c)
  noFill()
}

function draw() {
  background(235)
  strokeWeight(2)
  p5bezier.draw([
    [10, 10],
    [100, 700],
    [500, -800],
    [800, 1000],
    [10, 300],
  ])
}
