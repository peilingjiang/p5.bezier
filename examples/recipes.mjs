export const MODES = [
  'points',
  'draw',
  'dash',
  'closest',
  'smoothness',
  'move',
  'webgl',
]
export const DEFAULT_POINTS = [
  [90, 310],
  [650, 360],
  [650, 40],
  [90, 40],
  [90, 360],
  [650, 310],
]
export const DESCRIPTIONS = {
  points: [
    'Control points',
    'Curve settings',
    'Change the control points and update the curve.',
    'Drag a point · arrow keys move the selected point',
  ],
  draw: [
    'Freehand',
    'Drawing settings',
    'Use a stroke as control points. Each stroke replaces the previous curve.',
    'Draw with a mouse, pen, or finger',
  ],
  dash: [
    'Dashed curves',
    'Dash settings',
    'Draw a cached curve with a dash and gap pattern.',
    'Drag a point to change the curve',
  ],
  closest: [
    'Closest point',
    'Sampling settings',
    'Find the nearest sampled vertex to the pointer.',
    'Move over the canvas · arrow keys move the probe',
  ],
  smoothness: [
    'Smoothness',
    'Sampling settings',
    'Compare five sampling levels. The selected level is drawn in black.',
    'Select a smoothness level from 1 to 5',
  ],
  move: [
    'Translation',
    'Curve settings',
    'Translate cached vertices to draw twelve copies of a curve.',
    'Drag a point to update every copy',
  ],
  webgl: [
    'WebGL',
    '3D settings',
    'Draw 3D curves with a p5.js WebGL graphics buffer.',
    'Enable rotation to view the curves in 3D',
  ],
}

export function makeSketch({
  mode = 'points',
  points = DEFAULT_POINTS,
  smoothness = 3,
  closed = false,
  dash = 16,
  guides = true,
  animate = false,
  probe = [440, 130],
} = {}) {
  if (!MODES.includes(mode)) throw new Error('Unknown experiment')
  const close = closed ? 'CLOSE' : 'OPEN'
  const coords = JSON.stringify(points.map((point) => point.map(Math.round)))
  if (mode === 'webgl') {
    return `let buffer, curve;
const points = ${coords}.map(([x, y], i) => [x - 360, y - 200, Math.sin(i * 1.4) * 140]);

function setup() {
  createCanvas(720, 400);
  buffer = createGraphics(720, 400, WEBGL);
  const curves = initBezier(buffer);
  curve = curves.new(points, '${close}', ${smoothness});
  ${animate ? 'frameRate(30);' : 'noLoop();'}
}

function draw() {
  buffer.background('#0a0a0a');
  buffer.push();
  buffer.scale(0.48);
  buffer.rotateY(${animate ? 'frameCount * 0.012' : '0.45'});
  buffer.rotateX(-0.25);
  buffer.noFill();
  buffer.strokeWeight(2);
  for (let i = 0; i < 14; i++) {
    buffer.stroke(i % 3 === 0 ? '#ffffff' : '#a3a3a3');
    buffer.push();
    buffer.translate(0, (i - 7) * 9, (i - 7) * 8);
    curve.draw();
    buffer.pop();
  }
  buffer.pop();
  image(buffer, 0, 0);
}`
  }
  const setupCurve = !['draw', 'smoothness'].includes(mode)
  let body
  if (mode === 'draw')
    body = `if (points.length > 1) curves.draw(points, '${close}', ${smoothness});`
  else if (mode === 'dash')
    body = `curve.draw([${dash}, ${Math.round(dash / 2)}]);`
  else if (mode === 'closest')
    body = `curve.draw();
  const nearest = curve.shortest(probe[0], probe[1]);
  stroke('#a3a3a3');
  strokeWeight(1);
  line(probe[0], probe[1], nearest[0], nearest[1]);
  fill('#171717');
  noStroke();
  circle(nearest[0], nearest[1], 9);
  noFill();
  stroke('#171717');
  circle(probe[0], probe[1], 12);`
  else if (mode === 'move')
    body = `for (let i = 11; i >= 0; i--) {
    stroke(i === 0 ? '#171717' : '#a3a3a3');
    strokeWeight(i === 0 ? 3 : 1);
    curve.move(i * -6, i * 6);
  }`
  else if (mode === 'smoothness')
    body = `for (let level = 1; level <= 5; level++) {
    stroke(level === ${smoothness} ? '#171717' : '#a3a3a3');
    strokeWeight(level === ${smoothness} ? 3 : 1);
    const shifted = points.map(([x, y]) => [x, y * 0.6 + level * 25]);
    curves.draw(shifted, '${close}', level);
  }`
  else body = 'curve.draw();'
  const showGuides = guides && ['points', 'dash', 'move'].includes(mode)
  const guideCode = showGuides
    ? `
  stroke('#d4d4d4');
  strokeWeight(1);
  for (let i = 1; i < points.length; i++) line(...points[i - 1], ...points[i]);
  fill('#ffffff');
  stroke('#171717');
  for (const [x, y] of points) circle(x, y, 10);`
    : ''
  const pointControls = ['points', 'dash', 'move'].includes(mode)
    ? `

// Drag a control point. Rebuild closed curves to regenerate closure points.
let selected = -1;
function mousePressed() {
  selected = points.findIndex(([x, y]) => dist(x, y, mouseX, mouseY) < 20);
}
function mouseDragged() {
  if (selected < 0) return;
  points[selected] = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)];
  ${closed ? `curve = curves.new(points, 'CLOSE', ${smoothness});` : 'curve.update(points.map(point => [...point]));'}
  redraw();
}
function mouseReleased() { selected = -1; }`
    : ''
  const pointerCode =
    mode === 'closest'
      ? `

function mouseMoved() {
  probe = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)];
  redraw();
}`
      : mode === 'draw'
        ? `

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  points = [[mouseX, mouseY]];
  redraw();
}
function mouseDragged() {
  const next = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)];
  if (points.length === 0) return;
  const last = points[points.length - 1];
  if (dist(...last, ...next) < 8) return;
  if (points.length >= 80) points = points.filter((_, i) => i % 2 === 0);
  points.push(next);
  redraw();
}`
        : ''
  return `let curves${setupCurve ? ', curve' : ''};
${mode === 'draw' ? 'let' : 'const'} points = ${coords};${mode === 'closest' ? `\nlet probe = ${JSON.stringify(probe)};` : ''}

function setup() {
  curves = initBezier(createCanvas(720, 400));${setupCurve ? `\n  curve = curves.new(points, '${close}', ${smoothness});` : ''}
  noLoop();
}

function draw() {
  background('#ffffff');
  noFill();
  stroke('#171717');
  strokeWeight(3);
  ${body}${guideCode}
}${pointControls}${pointerCode}`
}

export function makeDocument(sketch) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>My p5.bezier sketch</title>
<style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#ffffff}canvas{max-width:100%;height:auto!important}</style>
<script src="https://cdn.jsdelivr.net/npm/p5@2.3.3/lib/p5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5bezier@0.8.1"></script>
</head><body><script>
${sketch.replaceAll('</script', '<\\/script')}
</script></body></html>`
}
