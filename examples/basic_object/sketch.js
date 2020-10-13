/*
  p5.bezier.js basic_object example
  Peiling Jiang
  NYU ITP/IMA 2020
*/

let bezierObject

function setup() {
  let c = createCanvas(500, 500)
  p5bezier.initBezier(c)
  bezierObject = p5bezier.newBezierObj([
    [10, 10],
    [100, 700],
    [500, -800],
    [800, 1000],
    [10, 300],
  ])
  console.log(bezierObject)
  noFill()
}

function draw() {
  background(235)
  strokeWeight(2)
  bezierObject.draw()
}
