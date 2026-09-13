import { surface } from './canvas.mjs?v=grid-5'

// x, resting height, wave amplitude, half-width of the curve family.
const ANCHORS = [
  [-40, 250, 50, 12],
  [160, 270, 85, 22],
  [360, 185, 115, 42],
  [610, 75, 115, 64],
  [880, 115, 85, 82],
  [1160, 185, 50, 90],
]
const LOOP_MS = 10000
const CURVE_COUNT = 32

export function startArtwork() {
  const canvas = document.querySelector('#ribbon')
  const pause = document.querySelector('#pause-art')
  const { ctx, curves, begin } = surface(canvas, 1120, 360)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let paused = reduced.matches
  let visible = false
  let frame = 0
  let elapsed = 0
  let lastTime = null

  function render() {
    begin()
    const phase = (elapsed / LOOP_MS) * Math.PI * 2 + 1.75
    const spine = ANCHORS.map(([x, y, amplitude, width], index) => [
      x,
      // Fit the complete wave inside the canvas, including its widest phase.
      180 + (y + Math.sin(phase - index * 0.7) * amplitude - 162) * 0.94,
      width * (1 + Math.sin(phase - index * 0.5) * 0.15) * 0.94,
    ])
    for (let i = 0; i < CURVE_COUNT; i++) {
      const strand = (i / (CURVE_COUNT - 1)) * 2 - 1
      const contour = i % 8 === 0 || i === CURVE_COUNT - 1
      ctx.strokeStyle = contour
        ? 'rgba(17, 17, 17, .82)'
        : 'rgba(17, 17, 17, .46)'
      ctx.lineWidth = contour ? 1.3 : 0.9
      // Positive widths keep the strands ordered throughout the wave.
      curves.draw(
        spine.map(([x, y, width]) => [x, y + strand * width]),
        'OPEN',
        2,
      )
    }
  }

  function tick(now) {
    frame = 0
    if (paused || !visible || document.hidden) return
    if (lastTime !== null) elapsed = (elapsed + now - lastTime) % LOOP_MS
    lastTime = now
    render()
    frame = requestAnimationFrame(tick)
  }

  function sync() {
    cancelAnimationFrame(frame)
    frame = 0
    // Suspension never counts toward the animation's elapsed time.
    lastTime = null
    pause.textContent = paused ? 'Play animation' : 'Pause animation'
    pause.setAttribute('aria-pressed', String(paused))
    if (!paused && visible && !document.hidden)
      frame = requestAnimationFrame(tick)
  }

  pause.addEventListener('click', () => {
    paused = !paused
    sync()
  })
  reduced.addEventListener('change', (event) => {
    paused = event.matches
    sync()
  })
  document.addEventListener('visibilitychange', sync)
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  }).observe(canvas)
  new ResizeObserver(render).observe(canvas)
  sync()
  render()
}
