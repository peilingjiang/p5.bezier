new p5(p => {
  let p5bezier

  const lines = []
  let currentLine = []
  let pointCount = 0

  p.setup = () => {
    const c = p.createCanvas(width, 600)
    p5bezier = initBezier(c)
  }

  p.draw = () => {
    p.background(255)

    for (let i = 0; i < lines.length; i++) {
      drawLine(lines[i], i)
    }

    if (currentLine.length > 0) {
      drawLine(currentLine, lines.length)
    }
  }

  function drawLine(line) {
    if (line.length < 2) return

    p.push()
    p.noFill()
    p.stroke(p.color('#FD5E53'))
    p.strokeWeight(3)

    const pl = p5bezier.draw(line)

    p.pop()

    // points
    for (const point of pl) {
      p.fill(p.color('#541690'))
      p.ellipse(point[0], point[1], 5, 5)
    }

    // point count
    p.fill(0)
    p.noStroke()
    p.text(
      line.length,
      line[line.length - 1][0] + 10,
      line[line.length - 1][1] + 10,
    )
  }

  p.mousePressed = () => {
    currentLine = []
    pointCount = 0
  }

  p.mouseDragged = () => {
    currentLine.push([p.mouseX, p.mouseY])
    pointCount++
  }

  p.mouseReleased = () => {
    if (currentLine.length > 1) lines.push(currentLine)
    currentLine = []
  }
}, 'draw-sketch')
