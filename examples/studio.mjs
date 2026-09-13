import { startArtwork } from './artwork.mjs?v=wave-2'
import { circle, segment, surface } from './canvas.mjs?v=grid-5'
import {
  DEFAULT_POINTS,
  DESCRIPTIONS,
  MODES,
  makeDocument,
  makeSketch,
} from './recipes.mjs?v=simplify-1'
import { createWebGL } from './webgl.mjs?v=simplify-1'

const $ = (id) => document.getElementById(id)
const ARROW_DIRECTIONS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}
const sliders = [
  ...document.querySelectorAll('.control-row input[type="range"]'),
]
function syncSlider(slider) {
  const min = Number(slider.min)
  const max = Number(slider.max)
  const fraction = max > min ? (Number(slider.value) - min) / (max - min) : 0
  slider.style.setProperty(
    '--range-fill',
    `${Math.max(0, Math.min(1, fraction)) * 100}%`,
  )
}
for (const slider of sliders) {
  syncSlider(slider)
  slider.addEventListener('input', () => syncSlider(slider))
}
let toastTimer
function notify(message) {
  $('status').textContent = message
  $('status').dataset.visible = 'true'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    $('status').dataset.visible = 'false'
  }, 3500)
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    notify('Copied.')
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    notify(
      copied
        ? 'Copied.'
        : 'Copy is unavailable. Select the code and copy it manually.',
    )
  }
}
function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
for (const button of document.querySelectorAll('[data-copy]'))
  button.addEventListener('click', () =>
    copy($(button.dataset.copy).textContent),
  )
$('copy-agent').addEventListener('click', async () => {
  try {
    const response = await fetch('reference.md')
    if (!response.ok) throw new Error('Reference unavailable')
    await copy(await response.text())
  } catch {
    notify(
      'Could not load the reference. Open reference.md and copy it directly.',
    )
  }
})

function startStudio() {
  const state = {
    mode: 'points',
    points: structuredClone(DEFAULT_POINTS),
    smoothness: 3,
    closed: false,
    dash: 16,
    guides: true,
    animate: false,
    probe: [440, 130],
  }
  const stage = $('canvas-stage')
  const canvas = $('play-canvas')
  const handles = $('point-handles')
  const codePanel = document.querySelector('.code-panel')
  const s = surface(canvas)
  let cachedCurve
  let cacheKey = ''
  let cachedPoints = ''
  let drag = null
  let webgl
  let webglLoading = false
  let sketch = ''
  let frame = 0

  function showCode() {
    sketch = makeSketch(state)
    if (!codePanel.open) return
    const fragment = document.createDocumentFragment()
    const tokens =
      /(\/\/[^\n]*|'[^'\n]*'|\b(?:function|const|let|return|if|for|new)\b|\b\d+(?:\.\d+)?\b)/g
    let last = 0
    for (const match of sketch.matchAll(tokens)) {
      fragment.append(sketch.slice(last, match.index))
      const token = match[0]
      const span = document.createElement('span')
      span.className = `syntax-${token.startsWith('//') ? 'comment' : token.startsWith("'") ? 'string' : /^\d/.test(token) ? 'number' : 'keyword'}`
      span.textContent = token
      fragment.append(span)
      last = match.index + token.length
    }
    fragment.append(sketch.slice(last))
    $('live-code').replaceChildren(fragment)
  }
  codePanel.addEventListener('toggle', () => {
    if (codePanel.open) showCode()
  })
  function curve() {
    const key = `${state.points.length}/${state.closed}/${state.smoothness}`
    const pointsKey = JSON.stringify(state.points)
    if (
      !cachedCurve ||
      cacheKey !== key ||
      (state.closed && cachedPoints !== pointsKey)
    ) {
      cachedCurve = s.curves.new(
        state.points,
        state.closed ? 'CLOSE' : 'OPEN',
        state.smoothness,
      )
      cacheKey = key
    } else if (cachedPoints !== pointsKey) {
      // update() retains its argument; keep the editable state independent.
      cachedCurve.update(state.points.map((point) => [...point]))
    }
    cachedPoints = pointsKey
    return cachedCurve
  }
  function paint() {
    frame = 0
    if (state.mode === 'webgl') {
      webgl?.refresh()
      return
    }
    s.begin('#ffffff')
    const { ctx } = s
    // Logical canvas coordinates stay fixed when the viewport changes.
    ctx.fillStyle = '#e5e5e5'
    for (let x = 24; x < 720; x += 24)
      for (let y = 24; y < 400; y += 24) ctx.fillRect(x, y, 1, 1)
    ctx.strokeStyle = '#171717'
    ctx.lineWidth = 3
    if (state.points.length >= 2) {
      if (state.mode === 'draw')
        s.curves.draw(
          state.points,
          state.closed ? 'CLOSE' : 'OPEN',
          state.smoothness,
        )
      else if (state.mode === 'smoothness') {
        for (let level = 1; level <= 5; level++) {
          ctx.strokeStyle = level === state.smoothness ? '#171717' : '#a3a3a3'
          ctx.lineWidth = level === state.smoothness ? 3 : 1
          s.curves.draw(
            state.points.map(([x, y]) => [x, y * 0.6 + level * 25]),
            state.closed ? 'CLOSE' : 'OPEN',
            level,
          )
          ctx.fillStyle = level === state.smoothness ? '#171717' : '#737373'
          ctx.font = '11px monospace'
          ctx.fillText(
            String(level),
            state.points.at(-1)[0] + 13,
            state.points.at(-1)[1] * 0.6 + level * 25 + 3,
          )
        }
      } else if (state.mode === 'move') {
        const c = curve()
        for (let i = 11; i >= 0; i--) {
          ctx.strokeStyle = i === 0 ? '#171717' : '#a3a3a3'
          ctx.lineWidth = i === 0 ? 3 : 1
          c.move(i * -6, i * 6)
        }
      } else {
        const c = curve()
        c.draw(
          state.mode === 'dash'
            ? [state.dash, Math.round(state.dash / 2)]
            : undefined,
        )
        if (state.mode === 'closest') {
          const nearest = c.shortest(...state.probe)
          ctx.strokeStyle = '#a3a3a3'
          ctx.lineWidth = 1
          segment(ctx, state.probe, nearest)
          circle(ctx, ...nearest, 4.5, '#171717')
          circle(ctx, ...state.probe, 6, undefined, '#171717')
          const distance = Math.hypot(
            nearest[0] - state.probe[0],
            nearest[1] - state.probe[1],
          )
          $('curve-measure').textContent = `distance ${distance.toFixed(1)} px`
        }
      }
      if (state.guides && ['points', 'dash', 'move'].includes(state.mode)) {
        ctx.strokeStyle = '#d4d4d4'
        ctx.lineWidth = 0.8
        for (let i = 1; i < state.points.length; i++)
          segment(ctx, state.points[i - 1], state.points[i])
      }
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint)
  }
  function coordinate(event) {
    const rect = canvas.getBoundingClientRect()
    return [
      Math.round(
        Math.max(
          18,
          Math.min(702, ((event.clientX - rect.left) / rect.width) * 720),
        ),
      ),
      Math.round(
        Math.max(
          24,
          Math.min(376, ((event.clientY - rect.top) / rect.height) * 400),
        ),
      ),
    ]
  }
  function positionHandles() {
    for (const [i, handle] of [...handles.children].entries()) {
      const [x, y] = state.points[i]
      handle.style.left = `${(x / 720) * 100}%`
      handle.style.top = `${(y / 400) * 100}%`
      handle.setAttribute(
        'aria-label',
        `Control point ${i + 1}, x ${x}, y ${y}. Use arrow keys to move.`,
      )
    }
  }
  function buildHandles() {
    handles.replaceChildren()
    if (!['points', 'dash', 'move'].includes(state.mode)) return
    for (let i = 0; i < state.points.length; i++) {
      const handle = document.createElement('button')
      handle.type = 'button'
      handle.className = 'point-handle'
      const label = document.createElement('span')
      label.textContent = `P${i}`
      label.setAttribute('aria-hidden', 'true')
      handle.append(label)
      handle.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return
        event.preventDefault()
        handle.focus({ preventScroll: true })
        handle.setPointerCapture(event.pointerId)
        drag = { point: i, pointer: event.pointerId }
      })
      handle.addEventListener('keydown', (event) => {
        const direction = ARROW_DIRECTIONS[event.key]
        if (!direction) return
        event.preventDefault()
        const delta = event.shiftKey ? 10 : 2
        state.points[i] = state.points[i].map((v, d) =>
          Math.round(
            Math.max(
              d ? 24 : 18,
              Math.min(d ? 376 : 702, v + direction[d] * delta),
            ),
          ),
        )
        positionHandles()
        showCode()
        schedule()
      })
      handles.append(handle)
    }
    positionHandles()
  }
  function update() {
    const [name, title, description, hint] = DESCRIPTIONS[state.mode]
    $('experiment-name').textContent = name
    $('control-title').textContent = title
    $('experiment-description').textContent = description
    $('canvas-hint').textContent = hint
    $('curve-measure').textContent =
      state.mode === 'webgl'
        ? '14 curves · 3 dimensions'
        : `${state.points.length} control points · degree ${Math.max(0, state.points.length - 1)}`
    $('point-count').value = state.points.length
    $('point-count-value').value = state.points.length
    $('point-count').disabled = state.mode === 'draw'
    $('smoothness').min = state.mode === 'dash' ? 3 : 1
    $('smoothness').value = state.smoothness
    $('smoothness-value').value = state.smoothness
    $('close-curve').checked = state.closed
    $('show-guides').checked = state.guides
    $('dash-control').hidden = state.mode !== 'dash'
    $('guides-control').hidden = !['points', 'dash', 'move'].includes(
      state.mode,
    )
    $('motion-control').hidden = state.mode !== 'webgl'
    $('animate-3d').checked = state.animate
    stage.dataset.mode = state.mode
    canvas.hidden = state.mode === 'webgl'
    $('webgl-stage').hidden = state.mode !== 'webgl'
    canvas.tabIndex = state.mode === 'closest' ? 0 : -1
    canvas.setAttribute(
      'aria-label',
      state.mode === 'closest'
        ? 'Closest point probe. Use arrow keys to move the probe; hold Shift for larger steps.'
        : `${title}. ${hint}`,
    )
    for (const button of document.querySelectorAll('[data-mode]'))
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.mode === state.mode),
      )
    for (const slider of sliders) syncSlider(slider)
    buildHandles()
    showCode()
    schedule()
  }
  async function selectMode(mode) {
    if (!MODES.includes(mode)) return
    state.mode = mode
    state.points = mode === 'draw' ? [] : structuredClone(DEFAULT_POINTS)
    state.closed = false
    state.smoothness = 3
    cachedCurve = null
    $('canvas-message').hidden = true
    webgl?.setActive(mode === 'webgl')
    update()
    if (mode === 'webgl' && !webgl && !webglLoading) {
      webglLoading = true
      $('canvas-message').textContent = 'Loading the p5.js WebGL canvas…'
      $('canvas-message').hidden = false
      try {
        webgl = await createWebGL($('webgl-stage'), () => state)
        webgl.setActive(state.mode === 'webgl')
        $('canvas-message').hidden = true
      } catch (error) {
        if (state.mode === 'webgl') {
          $('canvas-message').textContent = error.message
          $('canvas-message').hidden = false
        }
      } finally {
        webglLoading = false
      }
    }
  }
  for (const button of document.querySelectorAll('[data-mode]'))
    button.addEventListener('click', () => selectMode(button.dataset.mode))
  $('reset').addEventListener('click', () => {
    state.guides = true
    state.dash = 16
    state.probe = [440, 130]
    state.animate = false
    $('dash-length').value = 16
    $('dash-value').value = '16 px'
    selectMode(state.mode)
  })
  $('point-count').addEventListener('input', (event) => {
    const count = Number(event.target.value)
    state.points = Array.from({ length: count }, (_, i) => {
      const position = (i / (count - 1)) * (DEFAULT_POINTS.length - 1)
      const start = Math.floor(position)
      const end = Math.min(start + 1, DEFAULT_POINTS.length - 1)
      return DEFAULT_POINTS[start].map((value, axis) =>
        Math.round(
          value + (DEFAULT_POINTS[end][axis] - value) * (position - start),
        ),
      )
    })
    update()
  })
  $('smoothness').addEventListener('input', (event) => {
    state.smoothness = Number(event.target.value)
    $('smoothness-value').value = state.smoothness
    showCode()
    schedule()
  })
  $('dash-length').addEventListener('input', (event) => {
    state.dash = Number(event.target.value)
    $('dash-value').value = `${state.dash} px`
    showCode()
    schedule()
  })
  $('close-curve').addEventListener('change', (event) => {
    state.closed = event.target.checked
    showCode()
    schedule()
  })
  $('show-guides').addEventListener('change', (event) => {
    state.guides = event.target.checked
    showCode()
    schedule()
  })
  $('animate-3d').addEventListener('change', (event) => {
    state.animate = event.target.checked
    showCode()
    schedule()
  })
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
    'change',
    (event) => {
      if (event.matches) {
        state.animate = false
        $('animate-3d').checked = false
        showCode()
        webgl?.refresh()
      }
    },
  )
  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || state.mode !== 'draw') return
    stage.setPointerCapture(event.pointerId)
    drag = { point: null, pointer: event.pointerId }
    state.points = [coordinate(event)]
    update()
  })
  stage.addEventListener('pointermove', (event) => {
    if (drag && event.pointerId !== drag.pointer) return
    if (drag?.point != null) {
      state.points[drag.point] = coordinate(event)
      positionHandles()
      showCode()
      schedule()
    } else if (state.mode === 'draw' && drag) {
      const next = coordinate(event)
      const last = state.points.at(-1)
      if (last && Math.hypot(next[0] - last[0], next[1] - last[1]) < 8) return
      if (state.points.length >= 80)
        state.points = state.points.filter((_, i) => i % 2 === 0)
      state.points.push(next)
      $('point-count-value').value = state.points.length
      $('curve-measure').textContent = `${state.points.length} control points`
      showCode()
      schedule()
    } else if (state.mode === 'closest') {
      state.probe = coordinate(event)
      showCode()
      schedule()
    }
  })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    stage.addEventListener(type, () => {
      drag = null
    })
  canvas.addEventListener('keydown', (event) => {
    if (state.mode !== 'closest') return
    const direction = ARROW_DIRECTIONS[event.key]
    if (!direction) return
    event.preventDefault()
    state.probe = state.probe.map((v, i) =>
      Math.max(
        0,
        Math.min(i ? 400 : 720, v + direction[i] * (event.shiftKey ? 20 : 5)),
      ),
    )
    showCode()
    schedule()
  })
  $('copy-sketch').addEventListener('click', () => copy(sketch))
  $('download-sketch').addEventListener('click', () => {
    download(
      new Blob([makeDocument(sketch)], { type: 'text/html' }),
      `p5bezier-${state.mode}.html`,
    )
    notify('HTML downloaded. Open it in a browser.')
  })
  $('export-image').addEventListener('click', () => {
    const target = state.mode === 'webgl' ? webgl?.canvas : canvas
    if (!target) {
      notify('The 3D canvas is still loading. Try again when it appears.')
      return
    }
    paint()
    target.toBlob((blob) => {
      if (blob) {
        download(blob, `p5bezier-${state.mode}.png`)
        notify('PNG saved.')
      } else notify('Could not save this canvas. Try resetting the experiment.')
    })
  })
  new ResizeObserver(schedule).observe(stage)
  update()
}

if (typeof window.initBezier === 'function') {
  startArtwork()
  startStudio()
} else {
  $('canvas-message').textContent =
    'The curve library could not load. Reload this page or use the examples in the reference below.'
  $('canvas-message').hidden = false
  for (const button of document.querySelectorAll(
    '.experiment-tabs button, .studio-shell button, .studio-shell input, #pause-art',
  ))
    button.disabled = true
}
