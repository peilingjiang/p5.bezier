import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import {
  canvasHarness,
  controlPoints,
  deCasteljau,
  loadLibrary,
} from './helpers/library.mjs'

const init = loadLibrary()
const segments = [10, 50, 1000, 2000, 5000]
function near(actual, expected, tolerance = 1e-8) {
  assert.equal(actual.length, expected.length)
  actual.forEach((value, d) =>
    assert.ok(
      Number.isFinite(value) && Math.abs(value - expected[d]) <= tolerance,
      `${actual} must be within ${tolerance} of ${expected}`,
    ),
  )
}

for (const dimension of [2, 3]) {
  for (const count of [2, 3, 4, 8, 32, 80, 160]) {
    test(`${dimension}D / ${count} points: all precisions match de Casteljau`, () => {
      const h = canvasHarness(init, dimension)
      const points = controlPoints(count, dimension)
      for (let precision = 1; precision <= 5; precision++) {
        h.clear()
        const curve = h.api.new(points, 'OPEN', precision)
        assert.equal(h.events.length, 0, 'construction must not draw')
        curve.draw()
        const vertices = h.vertices()
        const steps = segments[precision - 1]
        assert.equal(
          vertices.length,
          steps + 1,
          'one vertex per uniform sample, including both endpoints',
        )
        assert.deepEqual(vertices[0], points[0])
        assert.deepEqual(vertices.at(-1), points.at(-1))
        for (const fraction of [0.001, 0.07, 0.25, 0.5, 0.71, 0.93, 0.999]) {
          const index = Math.round(steps * fraction)
          near(vertices[index], deCasteljau(points, index / steps))
        }
      }
    })
  }

  test(`${dimension}D: immediate and stored closed curves agree`, () => {
    const h = canvasHarness(init, dimension)
    const points = controlPoints(8, dimension)
    const prepared = h.api.draw(points, 'CLOSE', 5)
    const immediate = h.vertices()
    h.clear()
    const curve = h.api.new(points, 'CLOSE', 5)
    curve.draw()
    assert.deepEqual(immediate, h.vertices())
    assert.deepEqual(curve.controlPoints, prepared)
    assert.deepEqual(immediate[0], immediate.at(-1))
  })

  test(`${dimension}D: update detects repeated in-place edits and copies input`, () => {
    const h = canvasHarness(init, dimension)
    const points = controlPoints(4, dimension)
    const curve = h.api.new(points, 'OPEN', 5)
    for (const x of [100, 200, 300]) {
      points[0][0] = x
      curve.update(points)
      near(curve.shortest(...points[0]), points[0])
    }
    points[0][0] = 999
    assert.equal(curve.controlPoints[0][0], 300)
    assert.equal(h.events.length, 0, 'update must not draw')
  })

  test(`${dimension}D: move translates samples and controls without extending a closed curve`, () => {
    const h = canvasHarness(init, dimension)
    const curve = h.api.new(controlPoints(6, dimension), 'CLOSE', 5)
    const original = curve.controlPoints.map((point) => [...point])
    const offset = [10, -20, 30]
    const moved = curve.move(
      offset[0],
      offset[1],
      dimension === 3 ? offset[2] : null,
      false,
    )
    assert.equal(h.events.length, 0)
    assert.equal(moved.controlPoints.length, original.length)
    moved.controlPoints.forEach((point, i) =>
      near(
        point,
        original[i].map((value, d) => value + offset[d]),
      ),
    )
    assert.deepEqual(curve.controlPoints, original)
    moved.draw()
    const translated = h.vertices()
    h.clear()
    curve.draw()
    h.vertices().forEach((point, i) =>
      near(
        translated[i],
        point.map((value, d) => value + offset[d]),
      ),
    )
    const twice = moved.move(10, -20, dimension === 3 ? 30 : null, false)
    assert.equal(twice.controlPoints.length, original.length)
    near(twice.shortest(...twice.controlPoints[0]), twice.controlPoints[0])
  })
}

test('nearest returns the closest uniform sample and an independent array', () => {
  const h = canvasHarness(init)
  const curve = h.api.new(controlPoints(32), 'OPEN', 5)
  curve.draw()
  const query = [340, 130]
  const vertices = h.vertices()
  const distance = (v) => (v[0] - query[0]) ** 2 + (v[1] - query[1]) ** 2
  const expected = vertices.reduce((best, v) =>
    distance(v) < distance(best) ? v : best,
  )
  const actual = curve.shortest(...query)
  near(actual, expected)
  actual[0] = -999
  near(curve.shortest(...query), expected)
})

test('immediate redraw notices edits and keeps its returned controls independent', () => {
  const h = canvasHarness(init)
  const points = controlPoints(4)
  for (const x of [0, 30, 60]) {
    points[0][0] = x
    const returned = h.api.draw(points, 'OPEN', 5)
    near(h.vertices()[0], points[0])
    returned[0][0] = -500
    h.clear()
    h.api.draw(points, 'OPEN', 5)
    near(h.vertices()[0], points[0])
    h.clear()
  }
})

test('dashes use correct arc-length intervals on a straight line', () => {
  const h = canvasHarness(init)
  const curve = h.api.new(
    [
      [0, 0],
      [100, 0],
    ],
    'OPEN',
    1,
  )
  curve.draw([10, 5])
  assert.equal(curve.increment, 0.001)
  const events = h.events.filter(
    ([name]) => name === 'moveTo' || name === 'lineTo',
  )
  let previous = [0, 0]
  let ink = 0
  for (const [name, ...point] of events) {
    if (name === 'lineTo')
      ink += Math.hypot(point[0] - previous[0], point[1] - previous[1])
    previous = point
  }
  assert.ok(Math.abs(ink - 70) < 1e-8, `expected 70 units of ink, got ${ink}`)
  h.clear()
  curve.draw()
  assert.equal(
    h.vertices().length,
    1001,
    'dash precision upgrade must rebuild the samples',
  )
})

test('invalid point counts and nonfinite precision cannot create invalid geometry', () => {
  const h = canvasHarness(init)
  for (const points of [[], [[1, 2]]]) {
    assert.throws(() => h.api.new(points), /At least 2/)
    assert.throws(() => h.api.draw(points), /At least 2/)
  }
  h.api.draw(
    [
      [0, 0],
      [10, 10],
    ],
    'OPEN',
    Number.NaN,
  )
  assert.equal(h.vertices().length, 1001)
})

test('the npm entry point can be imported without a browser global', () => {
  const require = createRequire(import.meta.url)
  assert.equal(typeof require('../lib/p5.bezier.min.js'), 'function')
})

test('an unchanged update restores controls edited independently of the samples', () => {
  const h = canvasHarness(init)
  const points = [
    [0, 0],
    [100, 0],
  ]
  const curve = h.api.new(points)
  curve.controlPoints[0][0] = 50
  curve.update(points)
  assert.deepEqual(curve.controlPoints, points)
  curve.controlPoints[1][1] = 100
  curve.update(curve.controlPoints)
  near(curve.shortest(0, 0), [0, 0])
  near(curve.shortest(100, 100), [100, 100])
})

test('changing precision resamples an unchanged update', () => {
  const h = canvasHarness(init)
  const curve = h.api.new(controlPoints(4), 'OPEN', 1)
  curve.increment = 0.0002
  curve.update(curve.controlPoints)
  curve.draw()
  assert.equal(h.vertices().length, 5001)
})

test('zero-length and nonfinite dash patterns finish without invalid vertices', () => {
  const h = canvasHarness(init)
  const curve = h.api.new([
    [0, 0],
    [100, 0],
  ])
  for (const pattern of [
    [0, 0],
    [10, 0],
    [0, 10],
    [-10, -5],
  ]) {
    h.clear()
    curve.draw(pattern)
    for (const point of h.vertices()) assert.ok(point.every(Number.isFinite))
    if (pattern[0] === 0 && pattern[1] > 0) assert.equal(h.vertices().length, 0)
  }
  for (const pattern of [
    [Number.NaN, 5],
    [5, Number.POSITIVE_INFINITY],
  ])
    assert.throws(() => curve.draw(pattern), /finite/)
  h.clear()
  h.api
    .new([
      [10, 10],
      [10, 10],
    ])
    .draw([10, 5])
  for (const point of h.vertices()) near(point, [10, 10])
})

test('dashed drawing restores canvas state when the renderer throws', () => {
  const h = canvasHarness(init)
  h.renderer.drawingContext.lineTo = () => {
    throw new Error('renderer failed')
  }
  assert.throws(
    () => h.api.new(controlPoints(4)).draw([10, 5]),
    /renderer failed/,
  )
  assert.equal(h.events[0][0], 'save')
  assert.equal(h.events.at(-1)[0], 'restore')
})

test('p5 targets preserve shape boundaries, fill state and buffer ownership', () => {
  const h = canvasHarness(init, 3)
  const api = init({ _renderer: h.renderer })
  const curve = api.new(controlPoints(4, 3), 'CLOSE', 2)
  curve.draw()
  assert.deepEqual(h.events[0], ['beginShape'])
  assert.deepEqual(h.events.at(-1), ['endShape', 'CLOSE'])
  h.clear()
  curve.draw([10, 5])
  assert.deepEqual(h.events.slice(0, 2), [['push'], ['noFill']])
  assert.deepEqual(h.events.at(-1), ['pop'])
  for (const vertex of h.vertices()) assert.ok(vertex.every(Number.isFinite))
})

test('large coordinate offsets stay stable at the maximum control count', () => {
  const h = canvasHarness(init)
  const points = controlPoints(160).map((p) => p.map((v) => 1e9 + v))
  const curve = h.api.new(points, 'OPEN', 5)
  curve.draw()
  const vertices = h.vertices()
  for (const i of [1, 1234, 2500, 3789, 4999])
    near(vertices[i], deCasteljau(points, i / 5000), 1e-4)
})
