const parent = document.querySelector('.sketch')
const width = parent.clientWidth

// Animation
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

// Draw!
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

// Control Points
new p5(p => {
  let p5bezier

  let pa
  let focusedPointInd = -1

  p.setup = () => {
    const c = p.createCanvas(width, 600)
    p5bezier = initBezier(c)
    p.noFill()

    pa = new PointArray(p)
    pa.add(100, 300)
    pa.add(width / 4, 550)
    pa.add((width / 4) * 3, 50)
    pa.add(width - 100, 300)
  }

  p.draw = () => {
    p.background(255)
    p.stroke(p.color('#FD5E53'))
    p.strokeWeight(3)

    p5bezier.draw(pa.get(), 'OPEN', 5)

    pa.display(true)
  }

  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > width || p.mouseY < 0 || p.mouseY > 600)
      return false

    const distances = pa.points.map(point =>
      p.dist(p.mouseX, p.mouseY, point.position[0], point.position[1]),
    )

    const minDistance = Math.min(...distances)

    if (minDistance < 60) focusedPointInd = distances.indexOf(minDistance)
    else focusedPointInd = pa.add(p.mouseX, p.mouseY)
  }

  p.mouseDragged = () => {
    if (p.mouseX < 0 || p.mouseX > width || p.mouseY < 0 || p.mouseY > 600)
      return false

    if (focusedPointInd > -1)
      pa.pointArray[focusedPointInd].update(p.mouseX, p.mouseY)
  }

  p.mouseReleased = () => {
    focusedPointInd = -1
  }

  class PointArray {
    constructor(p5Instance) {
      this.p = p5Instance
      this.pointArray = []
    }

    get points() {
      return this.pointArray
    }

    add(pX, pY) {
      let index = 0
      for (const point of this.pointArray) {
        if (pX < point.position[0]) break
        index++
      }
      this.pointArray.splice(index, 0, new Point(this.p, pX, pY))

      return index
    }

    display(lines = false) {
      if (lines) {
        this.p.push()
        this.p.stroke(p.color('#666'))
        this.p.strokeWeight(1)

        for (
          let pointIndex = 0;
          pointIndex < this.pointArray.length - 1;
          pointIndex++
        ) {
          this.p.line(
            this.pointArray[pointIndex].position[0],
            this.pointArray[pointIndex].position[1],
            this.pointArray[pointIndex + 1].position[0],
            this.pointArray[pointIndex + 1].position[1],
          )
        }

        this.p.pop()
      }

      for (const point of this.pointArray) point.display()
    }

    get() {
      return this.pointArray.map(point => point.position)
    }
  }

  class Point {
    constructor(p5Instance, x, y) {
      this.p = p5Instance
      this.position = [x, y]
      this.r = 10
    }

    display() {
      this.p.push()
      this.p.fill(255)
      this.p.stroke(p.color('#666'))
      this.p.strokeWeight(2)
      this.p.ellipse(this.position[0], this.position[1], 2 * this.r, 2 * this.r)
      this.p.fill(p.color('#666'))
      this.p.noStroke()
      this.p.text(
        `(${Math.round(this.position[0])}, ${Math.round(this.position[1])})`,
        this.position[0] + 10,
        this.position[1] - 10,
      )
      this.p.pop()
    }

    update(mX, mY) {
      this.position = [mX, mY]
    }
  }
}, 'drag-points-sketch')

// Closest Point
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
    bezierObject.draw([20, 5])
    const pointOnCurve = bezierObject.shortest(p.mouseX, p.mouseY)

    const r = p.dist(p.mouseX, p.mouseY, pointOnCurve[0], pointOnCurve[1])
    p.line(p.mouseX, p.mouseY, pointOnCurve[0], pointOnCurve[1])

    p.push()
    p.strokeWeight(3)
    p.stroke(p.color('#FD5E53'))
    p.ellipse(p.mouseX, p.mouseY, 2 * r, 2 * r)
    p.pop()
  }
}, 'shortest-point-sketch')

// Smoothness
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
