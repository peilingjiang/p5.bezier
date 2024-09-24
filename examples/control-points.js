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
    pa.add(Math.max(width / 5, 200), 570)
    pa.add(Math.max(width / 5, 200), 30)
    pa.add((width / 4) * 3, 30)
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
}, 'control-points-sketch')
