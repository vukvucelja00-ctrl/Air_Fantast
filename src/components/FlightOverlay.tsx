import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { PLANE_CENTER, PLANE_PATH } from '../lib/planeShape'
import { planetCircle } from '../lib/planet'

/** Drawing units to CSS pixels, before the responsive scale. */
const PLANE_SIZE = 0.55

/** Half the wingspan in drawing units. */
const PLANE_HALF_SPAN = 25
/** Shadow distance below the plane, in screen heights. */
const SHADOW_DROP = 0.022
/** A nearly straight path, for when there is almost no room to curve. */
const FLATTEST_RADIUS = 20000

/** Each pass: where it flies in the clear band from the horizon (0) to the search panel (1), and which way. */
const FLIGHTS = [
  { lane: 0.5, direction: 1 },
  { lane: 0.85, direction: -1 },
  { lane: 0.15, direction: -1 },
  { lane: 0.65, direction: 1 },
]
const FIRST_DELAY = 1.5
const GAP = 2.5

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Runs the flights on a canvas until the returned cleanup is called. */
function runFlights(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  planet: { current: { horizon: number; curvature: number } },
  reducedMotion: boolean,
): () => void {
  const plane = new Path2D(PLANE_PATH)
  let width = 0
  let height = 0
  let dpr = 1
  let panelTop = Infinity
  let panelHalfWidth = 0
  let elapsed = -FIRST_DELAY
  let flight = 0
  let raf = 0
  let last = 0
  let visible = false

  const measure = () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    // The search panel overlaps the bottom of the hero; flights keep clear of it.
    const section = document.getElementById('flight-search')
    const panel = section?.firstElementChild
    panelTop = section ? section.offsetTop : Infinity
    panelHalfWidth = panel instanceof HTMLElement ? panel.offsetWidth / 2 : 0
  }

  /**
   * The circle a pass flies along. It follows the planet's curve where it can; where that
   * would dip behind the search panel, it flattens so the plane stays visible above it.
   */
  const flightPath = (lane: number, scale: number) => {
    const { cx, cy, radius } = planetCircle(width, height, planet.current.horizon, planet.current.curvature)
    const rim = cy - radius
    const clearance = PLANE_HALF_SPAN * PLANE_SIZE * scale + height * SHADOW_DROP
    const nearest = PLANE_HALF_SPAN * PLANE_SIZE * scale * 0.8
    const farthest = panelTop - rim - clearance
    const depth = farthest > nearest ? nearest + lane * (farthest - nearest) : nearest
    const room = panelTop - clearance - rim - depth
    const flatEnough = room > 0 ? (panelHalfWidth ** 2 + room ** 2) / (2 * room) : FLATTEST_RADIUS
    const r = Math.min(Math.max(radius - depth, flatEnough), FLATTEST_RADIUS)
    return { cx, cy: rim + depth + r, r }
  }

  const drawPlane = (x: number, y: number, heading: number, scale: number) => {
    const shape = (offsetY: number, size: number) => {
      ctx.save()
      ctx.translate(x, y + offsetY)
      ctx.rotate(heading)
      ctx.scale(size * PLANE_SIZE, size * PLANE_SIZE)
      ctx.translate(-PLANE_CENTER.x, -PLANE_CENTER.y)
      ctx.fill(plane)
      ctx.restore()
    }
    // Shadow on the ground, then the plane with a soft yellow glow.
    ctx.fillStyle = 'rgba(0, 8, 28, 0.32)'
    shape(height * SHADOW_DROP, scale * 0.94)
    ctx.save()
    ctx.shadowColor = 'rgba(255, 194, 14, 0.6)'
    ctx.shadowBlur = 12 * dpr
    ctx.fillStyle = '#ffffff'
    shape(0, scale)
    ctx.restore()
  }

  /** Draws one moment of a pass. Returns false once the plane and its trail have left the screen. */
  const draw = (distance: number, pass: (typeof FLIGHTS)[number]) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    if (width < 2 || height < 2) return true

    const scale = clamp(width / 850, 1.15, 1.8)
    const { cx, cy, r } = flightPath(pass.lane, scale)
    const margin = 34 * scale
    const edge = Math.asin(clamp((width / 2 + margin) / r, -1, 1))
    const trail = clamp(width * 0.24, 120, 340) / r
    const travelled = distance / r
    if (travelled > 2 * edge + trail) return false

    const { direction } = pass
    const nose = direction * (travelled - edge)
    const tail = direction * Math.max(travelled - edge - trail, -edge)
    const at = (angle: number) => ({ x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) })
    const from = at(tail)
    const to = at(nose)

    if (Math.abs(nose - tail) > 0.0001) {
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)')
      ctx.strokeStyle = gradient
      ctx.lineCap = 'butt'
      ctx.beginPath()
      // Canvas angles start at +x; ours start at the top of the circle.
      ctx.arc(cx, cy, r, tail - Math.PI / 2, nose - Math.PI / 2, direction < 0)
      ctx.lineWidth = 5 * scale
      ctx.globalAlpha = 0.22
      ctx.stroke()
      ctx.lineWidth = 1.5 * scale
      ctx.globalAlpha = 1
      ctx.stroke()
    }

    drawPlane(to.x, to.y, nose + (direction < 0 ? Math.PI : 0), scale)
    return true
  }

  const speed = () => Math.max(70, width * 0.06)

  const drawStill = () => {
    // Reduced motion: one plane parked mid-flight.
    draw((width / 2 + 34) * 0.85, FLIGHTS[0])
  }

  const frame = (now: number) => {
    raf = 0
    if (!visible) return
    const dt = last && now - last < 100 ? (now - last) / 1000 : 1 / 60
    last = now
    elapsed += dt
    if (elapsed < 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
    } else if (!draw(elapsed * speed(), FLIGHTS[flight % FLIGHTS.length])) {
      flight += 1
      elapsed = -GAP
    }
    raf = requestAnimationFrame(frame)
  }

  const start = () => {
    if (reducedMotion) {
      drawStill()
      return
    }
    if (!raf && visible) {
      last = 0
      raf = requestAnimationFrame(frame)
    }
  }

  const resize = new ResizeObserver(() => {
    measure()
    start()
  })
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    start()
  })

  measure()
  resize.observe(canvas)
  intersection.observe(canvas)

  return () => {
    cancelAnimationFrame(raf)
    resize.disconnect()
    intersection.disconnect()
  }
}

/**
 * A small plane crossing the planet along the curve of its horizon, leaving a fading contrail.
 * Sits inside EarthHorizon so it moves with the planet; never takes pointer events.
 */
export function FlightOverlay({ horizon, curvature }: { horizon: number; curvature: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const planet = useRef({ horizon, curvature })
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    planet.current = { horizon, curvature }
  }, [horizon, curvature])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    return runFlights(canvas, ctx, planet, !!reducedMotion)
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
