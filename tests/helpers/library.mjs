import { readFileSync } from 'node:fs'

export function loadLibrary(
  path = new URL('../../lib/p5.bezier.min.js', import.meta.url),
) {
  const module = { exports: {} }
  const quietConsole = { log() {}, warn() {} }
  const source = readFileSync(path, 'utf8')
  new Function('window', 'module', 'exports', source)(
    { console: quietConsole },
    module,
    module.exports,
  )
  return module.exports
}

export function canvasHarness(init, dimension = 2) {
  const events = []
  const record =
    (name) =>
    (...args) =>
      events.push([name, ...args])
  const renderer = {
    drawingContext: Object.fromEntries(
      [
        'beginPath',
        'closePath',
        'moveTo',
        'lineTo',
        'stroke',
        'fill',
        'save',
        'restore',
      ].map((name) => [name, record(name)]),
    ),
    _doStroke: true,
    _doFill: false,
  }
  if (dimension === 3) {
    renderer.isP3D = true
    renderer._pInst = {
      ...Object.fromEntries(
        ['beginShape', 'endShape', 'vertex', 'push', 'pop', 'noFill'].map(
          (name) => [name, record(name)],
        ),
      ),
      CLOSE: 'CLOSE',
    }
  }
  return {
    api: init(renderer),
    renderer,
    events,
    clear: () => {
      events.length = 0
    },
    vertices: () =>
      events
        .filter(([name]) => ['moveTo', 'lineTo', 'vertex'].includes(name))
        .map((event) => event.slice(1)),
  }
}

// Independent, stable reference; intentionally not the library's algorithm.
export function deCasteljau(points, t) {
  const work = points.map((point) => [...point])
  for (let count = work.length - 1; count > 0; count--)
    for (let i = 0; i < count; i++)
      for (let d = 0; d < work[i].length; d++)
        work[i][d] = (1 - t) * work[i][d] + t * work[i + 1][d]
  return work[0]
}

export function controlPoints(count, dimension = 2) {
  return Array.from({ length: count }, (_, i) =>
    Array.from({ length: dimension }, (_, d) =>
      d === 0 ? (i * 720) / (count - 1) : Math.sin(i * (d + 1) * 0.7) * 240,
    ),
  )
}
