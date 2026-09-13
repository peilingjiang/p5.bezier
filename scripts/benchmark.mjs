import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { controlPoints, loadLibrary } from '../tests/helpers/library.mjs'

const paths = process.argv.slice(2)
if (paths.length === 0) paths.push('lib/p5.bezier.min.js')
const noop = () => {}
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
    ].map((name) => [name, noop]),
  ),
  _doStroke: true,
}
let sink = 0
function measure(run) {
  for (let i = 0; i < 5; i++) run()
  let iterations = 1
  let elapsed
  do {
    const start = performance.now()
    for (let i = 0; i < iterations; i++) run()
    elapsed = performance.now() - start
    if (elapsed < 15) iterations *= 2
  } while (elapsed < 15)
  const times = []
  for (let trial = 0; trial < 5; trial++) {
    const start = performance.now()
    for (let i = 0; i < iterations; i++) run()
    times.push((performance.now() - start) / iterations)
  }
  return times.sort((a, b) => a - b)[2]
}

const allResults = []
for (const path of paths) {
  const init = loadLibrary(resolve(path))
  const results = []
  for (const count of [4, 32, 160]) {
    for (const precision of [3, 4, 5]) {
      const api = init(renderer)
      const points = controlPoints(count)
      const curve = api.new(points, 'OPEN', precision)
      let frame = 0
      const animate = () => {
        points[1][1] = Math.sin(++frame * 0.01) * 200
      }
      const cases = {
        'animated draw': () => {
          animate()
          api.draw(points, 'OPEN', precision)
        },
        update: () => {
          animate()
          curve.update(points.map((p) => [...p]))
        },
        new: () => {
          sink += api.new(points, 'OPEN', precision).increment
        },
        'unchanged draw': () => api.draw(points, 'OPEN', precision),
        'stored draw': () => curve.draw(),
        shortest: () => {
          sink += curve.shortest(350, 120)[0]
        },
        move: () => {
          sink += curve.move(1, 2, null, false).increment
        },
        dashed: () => curve.draw([10, 5]),
      }
      for (const [operation, run] of Object.entries(cases)) {
        results.push({ points: count, precision, operation, ms: measure(run) })
      }
    }
  }
  // Deliberately exceed the basis-cache budget with changing large degrees.
  const mixedApi = init(renderer)
  const mixedPoints = [157, 158, 159, 160].map((count) => controlPoints(count))
  let mixedFrame = 0
  results.push({
    points: '157–160',
    precision: 5,
    operation: 'mixed animated draw',
    ms: measure(() => {
      const points = mixedPoints[mixedFrame++ % mixedPoints.length]
      points[1][1] = Math.sin(mixedFrame * 0.01) * 200
      mixedApi.draw(points, 'OPEN', 5)
    }),
  })
  allResults.push(results)
  console.log(
    `\n${path} — median ms/call after warmup (Node ${process.version}, ${process.platform}/${process.arch}); no-op renderer`,
  )
  console.table(
    results.map((result) => ({ ...result, ms: result.ms.toFixed(4) })),
  )
}
if (allResults.length === 2) {
  console.log('\nSpeedup: first bundle / second bundle')
  console.table(
    allResults[0].map((before, i) => ({
      points: before.points,
      precision: before.precision,
      operation: before.operation,
      speedup: `${(before.ms / allResults[1][i].ms).toFixed(1)}x`,
    })),
  )
}
if (!Number.isFinite(sink))
  throw new Error('Benchmark returned nonfinite results')
