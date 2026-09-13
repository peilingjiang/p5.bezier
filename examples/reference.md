# p5.bezier

> Bézier curves beyond four control points, by Peiling Jiang. MIT licensed. Repository version 0.8.0.

- [Homepage and interactive playground](./)
- [Agent index](llms.txt)
- [Source](https://github.com/peilingjiang/p5.bezier)

## Quickstart

Install with `npm install p5bezier`, then `import initBezier from 'p5bezier'` in a bundler. The module expects a browser environment. Or save this complete HTML example:

```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>p5.bezier example</title>
  <script src="https://cdn.jsdelivr.net/npm/p5@2.3.3/lib/p5.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/p5bezier@0.8.0"></script>
  <script>
    function setup() {
      const curves = initBezier(createCanvas(600, 400))
      background('#ffffff')
      noFill()
      stroke('#171717')
      strokeWeight(2)
      curves.draw([
        [60, 320],
        [60, 40],
        [540, 40],
        [540, 360],
        [240, 360],
        [240, 160],
      ])
    }
  </script>
</html>
```

## initBezier(canvas)

Pass a renderer from `createCanvas()` or a buffer from `createGraphics()`. Returns a drawing system with `draw()` and `new()`. For WebGL, supply `[x, y, z]` points. Raw WebGL contexts are unsupported.

```javascript
const curves = initBezier(createCanvas(600, 400))
const buffer = createGraphics(300, 300, WEBGL)
const curves3D = initBezier(buffer)
```

For native Canvas 2D, use the adapter in Canvas without p5.js.

## curves.draw(points, closeType?, smoothness?)

At least two `[x, y]` points, or `[x, y, z]` in WebGL. `closeType` is `'OPEN'` (default) or `'CLOSE'`. Smoothness is an integer from 1 to 5; default 3. Higher values sample more vertices. Uses the target's current stroke, fill, and transforms. Returns processed control points, not sampled vertices. Very large point lists are reduced internally.

```javascript
curves.draw(
  [
    [20, 160],
    [100, 20],
    [220, 180],
  ],
  'OPEN',
  3,
)
```

## curves.new(points, closeType?, smoothness?)

Creates a reusable curve object with precomputed vertices. Accepts the same arguments as `curves.draw()`, but does not draw until you call the object's `draw()` method.

```javascript
const curve = curves.new([
  [20, 160],
  [100, 20],
  [220, 180],
])
curve.draw()
```

## curve.draw(dash?)

Omit `dash` for a solid curve. Pass `[solidLength, gapLength]` for dashes. Use positive nonzero lengths. Dashed curves draw only the stroke and restore fill afterward. Create dashed objects at smoothness 3 or higher.

```javascript
curve.draw([16, 8])
```

## curve.update(points)

Recomputes vertices without drawing. Pass fresh coordinate arrays with the same count as `curve.controlPoints`; mutating stored arrays in place can skip the update. Closed curves add internal closure points, so rebuild a closed object from your original points instead.

```javascript
curve.update([
  [20, 100],
  [100, 60],
  [220, 140],
])
curve.draw()
```

## curve.move(x, y, z?, toDraw?, dash?)

Returns a translated copy, preserving the original. Draws the copy by default. Pass `false` as the fourth argument to defer drawing. A 3D curve requires a Z offset.

```javascript
const shifted = curve.move(20, 10, null, false)
shifted.draw()
```

## curve.shortest(x, y, z?)

Returns coordinates of the nearest sampled vertex. Supply Z for a 3D curve. Precision depends on smoothness; this is a sampled lookup, not an exact analytic projection.

```javascript
const nearest = curve.shortest(mouseX, mouseY)
line(mouseX, mouseY, nearest[0], nearest[1])
```

## Canvas without p5.js

Native canvases need a renderer-shaped adapter with a 2D drawing context and explicit stroke/fill flags. The 2D experiments on this page use this approach.

```javascript
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const curves = initBezier({
  drawingContext: ctx,
  _doStroke: true,
  _doFill: false,
})
ctx.strokeStyle = '#171717'
ctx.lineWidth = 3
curves.draw([
  [20, 160],
  [100, 20],
  [220, 180],
])
```

## Complete p5.js examples

Each JavaScript block below is a complete global-mode sketch. Load p5.js and p5.bezier as in the HTML quickstart, then replace its inline script with one of these examples. The downloadable HTML sketches use the same pinned dependencies. The interactive site itself uses the bundled repository build.

### Control points

Change the control points and update the curve.

```javascript
let curves, curve
const points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]

function setup() {
  curves = initBezier(createCanvas(720, 400))
  curve = curves.new(points, 'OPEN', 3)
  noLoop()
}

function draw() {
  background('#ffffff')
  noFill()
  stroke('#171717')
  strokeWeight(3)
  curve.draw()
  stroke('#d4d4d4')
  strokeWeight(1)
  for (let i = 1; i < points.length; i++) line(...points[i - 1], ...points[i])
  fill('#ffffff')
  stroke('#171717')
  for (const [x, y] of points) circle(x, y, 10)
}

// Drag a control point. Rebuild closed curves to regenerate closure points.
let selected = -1
function mousePressed() {
  selected = points.findIndex(([x, y]) => dist(x, y, mouseX, mouseY) < 20)
}
function mouseDragged() {
  if (selected < 0) return
  points[selected] = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)]
  curve.update(points.map(point => [...point]))
  redraw()
}
function mouseReleased() {
  selected = -1
}
```

### Freehand

Use a stroke as control points. Each stroke replaces the previous curve.

```javascript
let curves
let points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]

function setup() {
  curves = initBezier(createCanvas(720, 400))
  noLoop()
}

function draw() {
  background('#ffffff')
  noFill()
  stroke('#171717')
  strokeWeight(3)
  if (points.length > 1) curves.draw(points, 'OPEN', 3)
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return
  points = [[mouseX, mouseY]]
  redraw()
}
function mouseDragged() {
  const next = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)]
  if (points.length === 0) return
  const last = points[points.length - 1]
  if (dist(...last, ...next) < 8) return
  if (points.length >= 80) points = points.filter((_, i) => i % 2 === 0)
  points.push(next)
  redraw()
}
```

### Dashed curves

Draw a cached curve with a dash and gap pattern.

```javascript
let curves, curve
const points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]

function setup() {
  curves = initBezier(createCanvas(720, 400))
  curve = curves.new(points, 'OPEN', 3)
  noLoop()
}

function draw() {
  background('#ffffff')
  noFill()
  stroke('#171717')
  strokeWeight(3)
  curve.draw([16, 8])
  stroke('#d4d4d4')
  strokeWeight(1)
  for (let i = 1; i < points.length; i++) line(...points[i - 1], ...points[i])
  fill('#ffffff')
  stroke('#171717')
  for (const [x, y] of points) circle(x, y, 10)
}

// Drag a control point. Rebuild closed curves to regenerate closure points.
let selected = -1
function mousePressed() {
  selected = points.findIndex(([x, y]) => dist(x, y, mouseX, mouseY) < 20)
}
function mouseDragged() {
  if (selected < 0) return
  points[selected] = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)]
  curve.update(points.map(point => [...point]))
  redraw()
}
function mouseReleased() {
  selected = -1
}
```

### Closest point

Find the nearest sampled vertex to the pointer.

```javascript
let curves, curve
const points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]
let probe = [440, 130]

function setup() {
  curves = initBezier(createCanvas(720, 400))
  curve = curves.new(points, 'OPEN', 3)
  noLoop()
}

function draw() {
  background('#ffffff')
  noFill()
  stroke('#171717')
  strokeWeight(3)
  curve.draw()
  const nearest = curve.shortest(probe[0], probe[1])
  stroke('#a3a3a3')
  strokeWeight(1)
  line(probe[0], probe[1], nearest[0], nearest[1])
  fill('#171717')
  noStroke()
  circle(nearest[0], nearest[1], 9)
  noFill()
  stroke('#171717')
  circle(probe[0], probe[1], 12)
}

function mouseMoved() {
  probe = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)]
  redraw()
}
```

### Smoothness

Compare five sampling levels. The selected level is drawn in black.

```javascript
let curves
const points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]

function setup() {
  curves = initBezier(createCanvas(720, 400))
  noLoop()
}

function draw() {
  background('#ffffff')
  noFill()
  stroke('#171717')
  strokeWeight(3)
  for (let level = 1; level <= 5; level++) {
    stroke(level === 3 ? '#171717' : '#a3a3a3')
    strokeWeight(level === 3 ? 3 : 1)
    const shifted = points.map(([x, y]) => [x, y * 0.6 + level * 25])
    curves.draw(shifted, 'OPEN', level)
  }
}
```

### Translation

Translate cached vertices to draw twelve copies of a curve.

```javascript
let curves, curve
const points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]

function setup() {
  curves = initBezier(createCanvas(720, 400))
  curve = curves.new(points, 'OPEN', 3)
  noLoop()
}

function draw() {
  background('#ffffff')
  noFill()
  stroke('#171717')
  strokeWeight(3)
  for (let i = 11; i >= 0; i--) {
    stroke(i === 0 ? '#171717' : '#a3a3a3')
    strokeWeight(i === 0 ? 3 : 1)
    curve.move(i * -6, i * 6)
  }
  stroke('#d4d4d4')
  strokeWeight(1)
  for (let i = 1; i < points.length; i++) line(...points[i - 1], ...points[i])
  fill('#ffffff')
  stroke('#171717')
  for (const [x, y] of points) circle(x, y, 10)
}

// Drag a control point. Rebuild closed curves to regenerate closure points.
let selected = -1
function mousePressed() {
  selected = points.findIndex(([x, y]) => dist(x, y, mouseX, mouseY) < 20)
}
function mouseDragged() {
  if (selected < 0) return
  points[selected] = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)]
  curve.update(points.map(point => [...point]))
  redraw()
}
function mouseReleased() {
  selected = -1
}
```

### WebGL

Draw 3D curves with a p5.js WebGL graphics buffer.

```javascript
let buffer, curve
const points = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
].map(([x, y], i) => [x - 360, y - 200, Math.sin(i * 1.4) * 140])

function setup() {
  createCanvas(720, 400)
  buffer = createGraphics(720, 400, WEBGL)
  const curves = initBezier(buffer)
  curve = curves.new(points, 'OPEN', 3)
  noLoop()
}

function draw() {
  buffer.background('#0a0a0a')
  buffer.push()
  buffer.scale(0.48)
  buffer.rotateY(0.45)
  buffer.rotateX(-0.25)
  buffer.noFill()
  buffer.strokeWeight(2)
  for (let i = 0; i < 14; i++) {
    buffer.stroke(i % 3 === 0 ? '#ffffff' : '#a3a3a3')
    buffer.push()
    buffer.translate(0, (i - 7) * 9, (i - 7) * 8)
    curve.draw()
    buffer.pop()
  }
  buffer.pop()
  image(buffer, 0, 0)
}
```

## Limitations

Smoothness trades computation for sampling precision. shortest() returns a sampled vertex. update() expects a consistent count and fresh arrays. For closed curves, reconstruct the object to regenerate closure points. The library internally reduces very large point lists; this playground bounds freehand input to 80 points. Raw WebGL contexts are unsupported. Intersection, offset, curvature, and B-spline methods are not implemented. No authentication or HTTP API is required: this is a client-side JavaScript library.
