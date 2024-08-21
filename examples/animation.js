new p5(p => {
  let p5bezier
  let t = 0

  p.setup = () => {
    const c = p.createCanvas(width, 600)
    p5bezier = initBezier(c)

    p.noFill()
    p.strokeWeight(5)

    p.textStyle(p.BOLD)
    p.textSize(64)
    p.textAlign(p.CENTER, p.CENTER)
    p.textFont('Inter')
  }

  p.draw = () => {
    p.background('#06283D')

    t += 0.015

    p.stroke('#1363DF')
    p5bezier.draw(getSinPoints(p, t), 'OPEN', 3)

    p.stroke('#DFF6FF')
    p5bezier.draw(getSinPoints(p, t + 0.5), 'OPEN', 3)

    p.push()
    p.noStroke()
    p.fill('#FFFFFFE0')
    p.text('p5.bezier', p.width / 2, p.height / 2)
    p.pop()

    p.stroke('#47B5FF')
    p5bezier.draw(getSinPoints(p, t + 1), 'OPEN', 3)

    p.stroke('#FD5E53')
    p5bezier.draw(getSinPoints(p, t + 1.5), 'OPEN', 3)
  }

  const getSinPoints = (p, t) => {
    const points = []
    for (let pointX = 0; pointX <= p.width + 100; pointX += 100) {
      const pointY =
        p.height / 2 + (p.sin(t * 2 + pointX * 0.012) * p.height) / 2
      points.push([pointX, pointY])
    }

    return points
  }
}, 'animation-sketch')
