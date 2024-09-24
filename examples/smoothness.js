new p5(p => {
  let p5bezier

  p.setup = () => {
    const c = p.createCanvas(width, 300)
    p5bezier = initBezier(c)

    p.noFill()
  }

  p.draw = () => {
    const points = [
      [-300, 800],
      [width * 0.5, -750],
      [width + 300, 800],
    ]

    p.background(255)
    p.strokeWeight(2)

    const offset = 40

    p.stroke(p.color('#666'))
    p5bezier.draw(points, 'OPEN', 1)

    p5bezier.draw(
      points.map(point => [point[0], point[1] + offset]),
      'OPEN',
      2,
    )

    p.push()
    p.strokeWeight(3)
    p.stroke(p.color('#FD5E53'))
    p5bezier.draw(
      points.map(point => [point[0], point[1] + offset * 2]),
      'OPEN',
      3,
    )
    p.pop()

    p5bezier.draw(
      points.map(point => [point[0], point[1] + offset * 3]),
      'OPEN',
      4,
    )

    p5bezier.draw(
      points.map(point => [point[0], point[1] + offset * 4]),
      'OPEN',
      5,
    )

    p.push()
    p.noStroke()
    p.textSize(16)
    p.textStyle(p.BOLD)
    p.textFont('Inter')
    p.textAlign(p.CENTER, p.CENTER)

    const tX = width * 0.5
    const tY = 40
    const dX = 0
    const dY = 40

    p.fill(p.color('#666'))
    p.text('1', width * 0.5, tY)
    p.text('2', tX + dX, tY + dY)

    p.fill(p.color('#FD5E53'))
    p.text('3', tX + dX * 2, tY + dY * 2)

    p.fill(p.color('#666'))
    p.text('4', tX + dX * 3, tY + dY * 3)
    p.text('5', tX + dX * 4, tY + dY * 4)

    p.pop()
  }
}, 'smoothness-sketch')
