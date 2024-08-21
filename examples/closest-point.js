new p5(p => {
  let p5bezier

  const points = [
    [0, 0],
    [100, 1100],
    [1500, -2200],
    [1500, 2800],
    [100, -500],
    [0, 600],
  ]
  let bezierObject

  p.setup = () => {
    const c = p.createCanvas(width, 600)

    p5bezier = initBezier(c)
    bezierObject = p5bezier.new(points, 'OPEN', 5)

    p.noFill()
    p.strokeWeight(2)
  }

  p.draw = () => {
    p.background(255)

    p.stroke(p.color('#666'))
    bezierObject.draw([20, 10])
    const pointOnCurve = bezierObject.shortest(p.mouseX, p.mouseY)

    const r = p.dist(p.mouseX, p.mouseY, pointOnCurve[0], pointOnCurve[1])
    p.line(p.mouseX, p.mouseY, pointOnCurve[0], pointOnCurve[1])

    p.push()
    p.strokeWeight(3)
    p.stroke(p.color('#FD5E53'))
    p.ellipse(p.mouseX, p.mouseY, 2 * r, 2 * r)
    p.pop()
  }
}, 'closest-point-sketch')
