import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import {
  DEFAULT_POINTS,
  MODES,
  makeDocument,
  makeSketch,
} from '../examples/recipes.mjs'

test('every experiment exports a complete executable p5 sketch', () => {
  for (const mode of MODES) {
    const sketch = makeSketch({
      mode,
      points: [
        [40, 200],
        [180, 40],
        [360, 340],
        [560, 120],
      ],
      smoothness: 3,
      closed: false,
      dash: 16,
    })
    assert.doesNotThrow(
      () => new vm.Script(sketch),
      `${mode} must be valid JavaScript`,
    )
    assert.match(sketch, /function setup\(/)
    assert.match(sketch, /initBezier\(/)
    const html = makeDocument(sketch)
    assert.match(html, /p5@2\.3\.3/)
    assert.match(html, /p5bezier@0\.8\.1/)
  }
})

test('readable reference and runnable examples exist without JavaScript', async () => {
  const html = await readFile(
    new URL('../examples/index.html', import.meta.url),
    'utf8',
  )
  for (const id of ['playground', 'quickstart', 'reference', 'agents'])
    assert.ok(html.includes(`id="${id}"`), `${id} must exist in HTML`)
  assert.match(html, /rel="alternate"[^>]*type="text\/markdown"/)
  assert.match(html, /href="llms\.txt"/)
  assert.match(html, /language-javascript/)
})

test('the Markdown mirror preserves API headings without leaking HTML', async () => {
  const markdown = await readFile(
    new URL('../examples/reference.md', import.meta.url),
    'utf8',
  )
  assert.match(markdown, /^## initBezier\(canvas\)$/m)
  assert.doesNotMatch(markdown, /<\/?(?:summary|code|div|span)\b/)
  assert.equal(
    [
      ...markdown.matchAll(
        /^## (?:initBezier|curves\.|curve\.|Canvas without)/gm,
      ),
    ].length,
    8,
  )
})

test('exported 2D sketches draw finite vertices using the actual library', async () => {
  const library = await readFile(
    new URL('../lib/p5.bezier.min.js', import.meta.url),
    'utf8',
  )
  for (const mode of MODES.filter((mode) => mode !== 'webgl')) {
    for (const closed of [false, true]) {
      let vertices = 0
      const record = (...values) => {
        assert.ok(values.every(Number.isFinite), `${mode}: finite coordinates`)
        vertices++
      }
      const noop = () => {}
      const drawingContext = {
        beginPath: noop,
        closePath: noop,
        lineTo: record,
        moveTo: record,
        stroke: noop,
        fill: noop,
        save: noop,
        restore: noop,
      }
      const scope = {
        window: { console },
        console,
        width: 720,
        height: 400,
        mouseX: DEFAULT_POINTS[0][0],
        mouseY: DEFAULT_POINTS[0][1],
        createCanvas: () => ({
          drawingContext,
          _doStroke: true,
          _doFill: false,
        }),
        noLoop: noop,
        background: noop,
        noFill: noop,
        stroke: noop,
        strokeWeight: noop,
        fill: noop,
        noStroke: noop,
        circle: record,
        line: record,
        redraw: noop,
        constrain: (n, min, max) => Math.max(min, Math.min(max, n)),
        dist: (x, y, a, b) => Math.hypot(x - a, y - b),
      }
      vm.createContext(scope)
      vm.runInContext(library, scope)
      vm.runInContext(
        makeSketch({ mode, closed, points: DEFAULT_POINTS, smoothness: 3 }),
        scope,
      )
      vm.runInContext('setup(); draw();', scope, { timeout: 2000 })
      assert.ok(vertices > 10, `${mode} should draw a curve`)
      if (scope.mousePressed) {
        vm.runInContext(
          'mousePressed(); mouseX = 90; mouseY = 240; mouseDragged(); draw();',
          scope,
          { timeout: 2000 },
        )
        if (['points', 'dash', 'move'].includes(mode)) {
          vm.runInContext(
            'mouseX = 120; mouseY = 220; mouseDragged(); draw();',
            scope,
            { timeout: 2000 },
          )
          const nearest = vm.runInContext(
            'curve.shortest(mouseX, mouseY)',
            scope,
          )
          assert.deepEqual(
            Array.from(nearest),
            [120, 220],
            `${mode}: the sampled endpoint must follow a second edit`,
          )
        }
      }
    }
  }
})
