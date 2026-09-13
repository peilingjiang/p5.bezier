import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const source = (
  await readFile(new URL('../examples/artwork.mjs', import.meta.url), 'utf8')
)
  .replace(/^import .*$/m, '')
  .replace('export function startArtwork', 'function startArtwork')

function harness(prefersReducedMotion = false) {
  const frames = new Map()
  let nextFrame = 0
  let now = 0
  let drawing = []
  let intersect
  function target() {
    const listeners = new Map()
    return {
      attributes: {},
      addEventListener: (name, callback) => listeners.set(name, callback),
      emit: (name, event) => listeners.get(name)?.(event),
      setAttribute(name, value) {
        this.attributes[name] = value
      },
    }
  }
  const canvas = target()
  const button = target()
  const reduced = { ...target(), matches: prefersReducedMotion }
  const document = {
    ...target(),
    hidden: false,
    querySelector: (selector) => (selector === '#ribbon' ? canvas : button),
  }
  vm.runInNewContext(`${source}\nstartArtwork()`, {
    document,
    performance: { now: () => now },
    matchMedia: () => reduced,
    requestAnimationFrame(callback) {
      frames.set(++nextFrame, callback)
      return nextFrame
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    IntersectionObserver: class {
      constructor(callback) {
        intersect = callback
      }
      observe() {}
    },
    ResizeObserver: class {
      observe() {}
    },
    surface: () => ({
      ctx: {},
      begin: () => {
        drawing = []
      },
      curves: {
        draw: (points) => drawing.push(Array.from(points, (p) => [...p])),
      },
    }),
  })
  return {
    get drawing() {
      return drawing
    },
    get pending() {
      return frames.size
    },
    button,
    step(time) {
      now = time
      const callbacks = [...frames.values()]
      frames.clear()
      for (const callback of callbacks) callback(now)
    },
    visible: (value) => intersect([{ isIntersecting: value }]),
    pause: () => button.emit('click'),
    hidden(value) {
      document.hidden = value
      document.emit('visibilitychange')
    },
    reduced(value) {
      reduced.matches = value
      reduced.emit('change', { matches: value })
    },
  }
}

function sample(points, t) {
  let row = points
  while (row.length > 1)
    row = row
      .slice(1)
      .map((point, i) =>
        point.map((value, axis) => row[i][axis] * (1 - t) + value * t),
      )
  return row[0]
}

function displacement(before, after) {
  return Math.max(
    ...before.flatMap((points, i) =>
      [0.25, 0.5, 0.75].map((t) => {
        const a = sample(points, t)
        const b = sample(after[i], t)
        return Math.hypot(a[0] - b[0], a[1] - b[1])
      }),
    ),
  )
}

test('the curve visibly changes within the first second', () => {
  const art = harness()
  art.visible(true)
  art.step(0)
  const first = art.drawing
  for (let i = 1; i <= 60; i++) art.step((i * 1000) / 60)
  assert.ok(
    displacement(first, art.drawing) > 16,
    'the rendered curve should move enough to see on a narrow screen',
  )
})

test('animation speed is independent of screen refresh rate', () => {
  const drawings = [60, 120].map((hz) => {
    const art = harness()
    art.visible(true)
    for (let i = 0; i <= hz * 2; i++) art.step((i * 1000) / hz)
    return art.drawing
  })
  assert.ok(displacement(...drawings) < 1e-6)
})

test('the complete loop stays inside the canvas and returns to its start', () => {
  const art = harness()
  art.visible(true)
  art.step(0)
  const initial = art.drawing
  for (let time = 0; time <= 10_000; time += 100) {
    art.step(time)
    for (const curve of [art.drawing[0], art.drawing.at(-1)]) {
      for (let i = 0; i <= 100; i++) {
        const [x, y] = sample(curve, i / 100)
        if (x >= 0 && x <= 1120)
          assert.ok(
            y >= 16 && y <= 344,
            'visible curves need vertical clearance',
          )
      }
    }
  }
  assert.ok(displacement(initial, art.drawing) < 1e-6)
})

for (const reason of ['pause', 'hidden', 'visible', 'reduced']) {
  test(`${reason} suspends animation and resumes without a time jump`, () => {
    const art = harness()
    art.visible(true)
    for (let i = 0; i <= 30; i++) art.step((i * 1000) / 60)
    const before = art.drawing
    art[reason](reason !== 'visible')
    assert.equal(art.pending, 0)
    art.step(60_000)
    assert.deepEqual(art.drawing, before)
    art[reason](reason === 'visible')
    assert.equal(art.pending, 1)
    art.step(60_000)
    assert.ok(displacement(before, art.drawing) < 0.5)
  })
}

test('reduced motion starts static with an accurate play button', () => {
  const art = harness(true)
  art.visible(true)
  assert.ok(art.drawing.length > 0)
  assert.equal(art.pending, 0)
  assert.equal(art.button.textContent, 'Play animation')
  assert.equal(art.button.attributes['aria-pressed'], 'true')
  art.pause()
  assert.equal(art.pending, 1)
  assert.equal(art.button.textContent, 'Pause animation')
  assert.equal(art.button.attributes['aria-pressed'], 'false')
})
