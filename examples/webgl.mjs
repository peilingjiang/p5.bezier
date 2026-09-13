let p5Loading
function loadP5() {
  if (window.p5) return Promise.resolve()
  if (!p5Loading)
    p5Loading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/p5@2.3.3/lib/p5.min.js'
      const fail = () => {
        clearTimeout(timeout)
        script.remove()
        p5Loading = null
        reject(
          new Error(
            'p5.js could not load. Check your connection and select WebGL again.',
          ),
        )
      }
      const timeout = setTimeout(fail, 15000)
      script.onload = () => {
        clearTimeout(timeout)
        resolve()
      }
      script.onerror = fail
      document.head.append(script)
    })
  return p5Loading
}

export async function createWebGL(container, getState) {
  await loadP5()
  const probe = document.createElement('canvas')
  const gl = probe.getContext('webgl2') || probe.getContext('webgl')
  if (!gl)
    throw new Error(
      'WebGL is unavailable in this browser. Try another browser, or select a 2D example.',
    )
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  let visible = true
  let active = true
  let buffer
  let curves
  const instance = await new Promise((resolve, reject) => {
    new window.p5((p) => {
      p.setup = () => {
        try {
          p.createCanvas(720, 400)
          p.pixelDensity(Math.min(devicePixelRatio || 1, 2))
          buffer = p.createGraphics(720, 400, p.WEBGL)
          curves = window.initBezier(buffer)
          p.frameRate(30)
          p.noLoop()
          resolve(p)
        } catch (error) {
          p.remove()
          reject(error)
        }
      }
      p.draw = () => {
        if (!buffer) return
        const state = getState()
        const points = state.points.map(([x, y], i) => [
          x - 360,
          y - 200,
          Math.sin(i * 1.4) * 140,
        ])
        const curve = curves.new(
          points,
          state.closed ? 'CLOSE' : 'OPEN',
          state.smoothness,
        )
        buffer.background('#0a0a0a')
        buffer.push()
        buffer.scale(0.48)
        buffer.rotateY(state.animate ? p.frameCount * 0.012 : 0.45)
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
        p.image(buffer, 0, 0)
      }
    }, container)
  })
  function sync() {
    const canDraw = active && visible && !document.hidden
    if (canDraw && getState().animate) instance.loop()
    else {
      instance.noLoop()
      if (canDraw) instance.redraw()
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  })
  observer.observe(container)
  document.addEventListener('visibilitychange', sync)
  instance.canvas.setAttribute(
    'aria-label',
    'Fourteen three-dimensional Bézier curves rendered with a p5.js WebGL graphics buffer',
  )
  sync()
  return {
    refresh: sync,
    setActive(value) {
      active = value
      sync()
    },
    canvas: instance.canvas,
  }
}
