import { geoInterpolate, geoNaturalEarth1, geoPath, type GeoContext, type GeoProjection } from 'd3-geo'
import { select } from 'd3-selection'
import 'd3-transition'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import type { Feature, FeatureCollection } from 'geojson'
import { Minus, Plus } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { loadLand } from '../../lib/landMask'
import { PLANE_CENTER, PLANE_PATH } from '../../lib/planeShape'
import { ORIGINS, type OriginCode, type Route, type RouteKind } from '../../lib/routes'

export type Pads = { top: number; right: number; bottom: number; left: number }

export type StageHandle = {
  showEurope: () => void
  showWorld: () => void
  /** Frames the given routes, keeping clear of `pads`. */
  showRoutes: (routes: Route[], pads?: Partial<Pads>) => void
}

const MIN_ZOOM = 0.9
const MAX_ZOOM = 40
/** Beyond this zoom there is room to name every destination. */
const LABEL_ZOOM = 11
/** How high a route bows away from a straight line, relative to its length. */
const ARC_BOW = 0.14
const ARC_SAMPLES = 36
const EUROPE: [number, number][] = [
  [-12, 34],
  [46, 34],
  [-12, 67],
  [46, 67],
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function paintLand(
  canvas: HTMLCanvasElement | null,
  land: Path2D | null,
  { k, x, y }: { k: number; x: number; y: number },
) {
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const dpr = canvas.width / Math.max(canvas.clientWidth, 1)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!land) return
  ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * x, dpr * y)
  ctx.fillStyle = '#1a4583'
  ctx.fill(land, 'evenodd')
}

function buildLand(geo: FeatureCollection | Feature, projection: GeoProjection): Path2D {
  const path = new Path2D()
  const context: GeoContext = {
    beginPath: () => {},
    moveTo: (x, y) => path.moveTo(x, y),
    lineTo: (x, y) => path.lineTo(x, y),
    arc: (x, y, r, a, b) => path.arc(x, y, r, a, b),
    closePath: () => path.closePath(),
  }
  geoPath(projection, context)(geo)
  return path
}

function arcPath(route: Route, projection: GeoProjection): string {
  const origin = ORIGINS[route.origin]
  const destination = route.destination
  const along = geoInterpolate([origin.lon, origin.lat], [destination.lon, destination.lat])
  const a = projection([origin.lon, origin.lat]) ?? [0, 0]
  const b = projection([destination.lon, destination.lat]) ?? [0, 0]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const length = Math.hypot(dx, dy) || 1
  // Bow towards the top of the map, whichever way the route runs.
  const flip = dx >= 0 ? 1 : -1
  const nx = (dy / length) * flip
  const ny = (-dx / length) * flip
  const points: string[] = []
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const t = i / ARC_SAMPLES
    const p = projection(along(t)) ?? a
    const lift = Math.sin(Math.PI * t) * length * ARC_BOW
    points.push(`${(p[0] + nx * lift).toFixed(2)} ${(p[1] + ny * lift).toFixed(2)}`)
  }
  return `M${points.join('L')}`
}

/** Flies the plane along a route, lap after lap, until the returned cleanup is called. */
function flyPlane(path: SVGPathElement, plane: SVGGElement, onLap: () => void, still: boolean): () => void {
  const length = path.getTotalLength()
  const seconds = clamp(2.4 + length / 110, 3, 9)
  let raf = 0
  let start = 0

  const place = (t: number) => {
    const at = path.getPointAtLength(t * length)
    const next = path.getPointAtLength(Math.min(t * length + 1, length))
    const previous = path.getPointAtLength(Math.max(t * length - 1, 0))
    const angle = (Math.atan2(next.y - previous.y, next.x - previous.x) * 180) / Math.PI
    plane.style.transform = `translate(${at.x}px, ${at.y}px) rotate(${angle}deg) scale(calc(1 / var(--k, 1)))`
    plane.style.opacity = String(clamp(Math.min(t, 1 - t) * 14, 0, 1))
  }

  if (still) {
    place(0.5)
    return () => {}
  }

  const frame = (now: number) => {
    if (!start) start = now
    const t = (now - start) / (seconds * 1000)
    if (t >= 1) {
      start = 0
      plane.style.opacity = '0'
      onLap()
    } else {
      place(t)
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

const ORIGIN_CODES = Object.keys(ORIGINS) as OriginCode[]

export const WorldStage = forwardRef<
  StageHandle,
  {
    routes: Route[]
    /** Destination codes drawn highlighted. */
    activeCodes: Set<string>
    planeRouteId: string | null
    selectedCode: string | null
    onPick: (code: string | null) => void
    onHover: (code: string | null) => void
    onPlaneLap: () => void
  }
>(function WorldStage({ routes, activeCodes, planeRouteId, selectedCode, onPick, onHover, onPlaneLap }, ref) {
  const reducedMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const viewRef = useRef<SVGGElement>(null)
  const planeRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const transformRef = useRef<ZoomTransform>(zoomIdentity)
  const landRef = useRef<Path2D | null>(null)
  const paintQueued = useRef(0)
  const lapRef = useRef(onPlaneLap)

  const [size, setSize] = useState({ width: 0, height: 0 })
  const [geo, setGeo] = useState<FeatureCollection | Feature | null>(null)

  useEffect(() => {
    lapRef.current = onPlaneLap
  }, [onPlaneLap])

  useEffect(() => {
    let cancelled = false
    loadLand()
      .then((land) => {
        if (!cancelled) setGeo(land)
      })
      .catch(() => {
        // The routes still make sense without the coastlines.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(() => {
      setSize({ width: stage.clientWidth, height: stage.clientHeight })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const projection = useMemo(() => {
    if (size.width < 2 || size.height < 2) return null
    return geoNaturalEarth1()
      .rotate([-20, 0])
      .fitExtent(
        [
          [6, 6],
          [size.width - 6, size.height - 6],
        ],
        { type: 'Sphere' },
      )
  }, [size])

  const arcs = useMemo(
    () => (projection ? routes.map((route) => ({ route, d: arcPath(route, projection) })) : []),
    [routes, projection],
  )

  const markers = useMemo(() => {
    if (!projection) return []
    const seen = new Map<string, { route: Route; x: number; y: number }>()
    for (const route of routes) {
      if (seen.has(route.destination.code)) continue
      const p = projection([route.destination.lon, route.destination.lat])
      if (p) seen.set(route.destination.code, { route, x: p[0], y: p[1] })
    }
    return [...seen.values()]
  }, [routes, projection])

  const origins = useMemo(() => {
    if (!projection) return []
    return ORIGIN_CODES.filter((code) => routes.some((route) => route.origin === code)).map((code) => {
      const p = projection([ORIGINS[code].lon, ORIGINS[code].lat]) ?? [0, 0]
      return { ...ORIGINS[code], x: p[0], y: p[1] }
    })
  }, [routes, projection])

  const landPath = useMemo(() => (geo && projection ? buildLand(geo, projection) : null), [geo, projection])

  const paint = () => {
    cancelAnimationFrame(paintQueued.current)
    paintQueued.current = requestAnimationFrame(() => {
      paintLand(canvasRef.current, landRef.current, transformRef.current)
    })
  }

  useEffect(() => {
    landRef.current = landPath
    paintLand(canvasRef.current, landPath, transformRef.current)
  }, [landPath])

  // Pan and zoom. The wheel keeps scrolling the page unless Ctrl or Cmd is held (trackpad pinch
  // sends that too), and one finger keeps scrolling on phones while two zoom the map.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const behaviour = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .filter((event: Event) => {
        if (event.type === 'wheel') return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey
        if (event.type === 'touchstart') return (event as TouchEvent).touches.length >= 2
        return !(event as MouseEvent).button
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        const t = event.transform
        transformRef.current = t
        viewRef.current?.setAttribute('transform', t.toString())
        svg.style.setProperty('--k', String(t.k))
        svg.classList.toggle('show-labels', t.k >= LABEL_ZOOM)
        paint()
      })
    select(svg).call(behaviour).on('wheel.zoom-page', null)
    zoomRef.current = behaviour
    return () => {
      select(svg).on('.zoom', null)
      cancelAnimationFrame(paintQueued.current)
    }
    // paint only touches refs, so it never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fit = (points: [number, number][], pads: Partial<Pads> = {}, maxZoom = 14): ZoomTransform | null => {
    if (!projection || size.width < 2) return null
    const { top = 40, right = 40, bottom = 40, left = 40 } = pads
    const projected = points.map((point) => projection(point)).filter((p): p is [number, number] => !!p)
    if (!projected.length) return null
    const xs = projected.map((p) => p[0])
    const ys = projected.map((p) => p[1])
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const roomX = Math.max(size.width - left - right, 40)
    const roomY = Math.max(size.height - top - bottom, 40)
    const k = clamp(Math.min(roomX / Math.max(x1 - x0, 1), roomY / Math.max(y1 - y0, 1)), MIN_ZOOM, maxZoom)
    const x = left + roomX / 2 - (k * (x0 + x1)) / 2
    const y = top + roomY / 2 - (k * (y0 + y1)) / 2
    return zoomIdentity.translate(x, y).scale(k)
  }

  const moveTo = (target: ZoomTransform | null, animate = true) => {
    const svg = svgRef.current
    const behaviour = zoomRef.current
    if (!svg || !behaviour || !target) return
    // A background tab freezes the transition's clock, so go straight there.
    if (animate && !reducedMotion && !document.hidden) {
      select(svg).transition().duration(1100).call(behaviour.transform, target)
    } else {
      select(svg).call(behaviour.transform, target)
    }
  }

  // Start on Europe, where most routes are, and again whenever the map changes size.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width < 2) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size.width * dpr)
    canvas.height = Math.round(size.height * dpr)
    moveTo(fit(EUROPE), false)
    paintLand(canvas, landRef.current, transformRef.current)
    // Runs only for a new size; fit and moveTo read that same size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  useImperativeHandle(ref, () => ({
    showEurope: () => moveTo(fit(EUROPE)),
    showWorld: () =>
      moveTo(
        fit(
          routes.map((route) => [route.destination.lon, route.destination.lat]),
          { top: 50, right: 50, bottom: 50, left: 50 },
        ),
      ),
    showRoutes: (list, pads) => {
      const points = list.flatMap((route): [number, number][] => [
        [route.destination.lon, route.destination.lat],
        [ORIGINS[route.origin].lon, ORIGINS[route.origin].lat],
      ])
      moveTo(fit(points, { top: 70, right: 70, bottom: 70, left: 70, ...pads }, 9))
    },
  }))

  // The plane only flies while the map is on screen.
  const [onScreen, setOnScreen] = useState(false)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const plane = planeRef.current
    const path = planeRouteId
      ? svgRef.current?.querySelector<SVGPathElement>(`[data-route="${planeRouteId}"]`)
      : null
    if (!plane) return
    plane.style.opacity = '0'
    if (!path || !onScreen) return
    return flyPlane(path, plane, () => lapRef.current(), !!reducedMotion)
  }, [planeRouteId, arcs, onScreen, reducedMotion])

  const zoomBy = (factor: number) => {
    const svg = svgRef.current
    const behaviour = zoomRef.current
    if (svg && behaviour) select(svg).transition().duration(reducedMotion ? 0 : 350).call(behaviour.scaleBy, factor)
  }

  const kindClass = (kind: RouteKind) => `kind-${kind}`
  const isActive = (route: Route) =>
    activeCodes.has(route.destination.code)

  return (
    <div ref={stageRef} className="rm-stage">
      <canvas ref={canvasRef} className={`rm-land${landPath ? ' is-ready' : ''}`} aria-hidden="true" />
      <svg
        ref={svgRef}
        className="rm-svg"
        role="img"
        aria-label="World map of direct flights from Serbia. The same destinations are listed beside the map."
        onClick={(event) => {
          if (event.target === svgRef.current) onPick(null)
        }}
      >
        <g ref={viewRef}>
          <g className="rm-arcs">
            {arcs.map(({ route, d }) => (
              <path
                key={route.id}
                data-route={route.id}
                d={d}
                className={`rm-arc ${kindClass(route.kind)}${isActive(route) ? ' is-active' : ''}`}
              />
            ))}
          </g>

          {markers.map(({ route, x, y }) => {
            const code = route.destination.code
            const active = activeCodes.has(code)
            return (
              <g
                key={code}
                className={`rm-marker ${kindClass(route.kind)}${active ? ' is-active' : ''}${selectedCode === code ? ' is-selected' : ''}`}
                style={{ transform: `translate(${x}px, ${y}px) scale(calc(1 / var(--k, 1)))` }}
                onClick={() => onPick(code)}
                onMouseEnter={() => onHover(code)}
                onMouseLeave={() => onHover(null)}
              >
                <circle className="rm-hit" r={11} />
                <circle className="rm-dot" r={active ? 5.5 : 3.2} />
                <text className="rm-label" x={9} y={4}>
                  {route.destination.city}
                </text>
              </g>
            )
          })}

          {origins.map(({ code, city, x, y }) => (
            <g
              key={code}
              className="rm-origin"
              style={{ transform: `translate(${x}px, ${y}px) scale(calc(1 / var(--k, 1)))` }}
            >
              <circle className="rm-origin-pulse" r={7} />
              <circle className="rm-origin-dot" r={5} />
              {code === 'BEG' && (
                <text className="rm-origin-label" x={10} y={-8}>
                  {city}
                </text>
              )}
            </g>
          ))}

          <g ref={planeRef} className="rm-plane" style={{ opacity: 0 }}>
            <path d={PLANE_PATH} transform={`scale(0.42) translate(${-PLANE_CENTER.x} ${-PLANE_CENTER.y})`} />
          </g>
        </g>
      </svg>

      <div className="rm-zoom">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.7)}>
          <Plus size={17} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.7)}>
          <Minus size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
})
