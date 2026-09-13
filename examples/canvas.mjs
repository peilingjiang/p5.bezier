export function surface(canvas, width = 720, height = 400) {
  const ctx = canvas.getContext('2d')
  const curves = window.initBezier({
    drawingContext: ctx,
    _doStroke: true,
    _doFill: false,
  })
  function begin(background) {
    const box = canvas.getBoundingClientRect()
    // Supersample fine linework on standard-density screens as well.
    const ratio = 2
    const w = Math.max(1, Math.min(4096, Math.round(box.width * ratio)))
    const h = Math.max(1, Math.min(4096, Math.round(box.height * ratio)))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    ctx.setTransform(w / width, 0, 0, h / height, 0, 0)
    ctx.clearRect(0, 0, width, height)
    if (background) {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([])
  }
  return { ctx, curves, begin }
}
export function circle(ctx, x, y, radius, fill, stroke) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}
export function segment(ctx, a, b) {
  ctx.beginPath()
  ctx.moveTo(...a)
  ctx.lineTo(...b)
  ctx.stroke()
}
