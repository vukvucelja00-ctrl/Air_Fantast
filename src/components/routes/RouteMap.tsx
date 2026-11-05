import { ArrowRight, Search, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { lazy, useMemo, useRef, useState } from 'react'
import { airports } from '../../lib/airports'
import {
  KIND_LABEL,
  ORIGINS,
  distanceKm,
  estimateFlightMinutes,
  routes,
  type OriginCode,
  type Route,
  type RouteKind,
} from '../../lib/routes'
import { requestRoute } from '../../lib/searchBridge'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { useNearViewport } from '../../lib/useNearViewport'
import { OptionalChunk } from '../OptionalChunk'
import type { StageHandle } from './WorldStage'
import './RouteMap.css'

// The map and its coastlines load only as the visitor gets close to this section.
const WorldStage = lazy(() => import('./WorldStage').then((module) => ({ default: module.WorldStage })))

type OriginFilter = 'ALL' | OriginCode

const KINDS: RouteKind[] = ['scheduled', 'seasonal', 'charter', 'upcoming']
const ORIGIN_CODES = Object.keys(ORIGINS) as OriginCode[]
const ease = [0.22, 1, 0.36, 1] as const

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

/** Other names a destination goes by, such as "Pariz" for Paris. */
const aliasesByCode = new Map(airports.map((airport) => [airport.code, (airport.aliases ?? []).join(' ')]))

const destinationCount = (list: Route[]) => new Set(list.map((route) => route.destination.code)).size

function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes / 5) * 5
  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

function RouteCard({ list, onClose }: { list: Route[]; onClose: () => void }) {
  const destination = list[0].destination
  return (
    <motion.div
      className="rm-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease }}
    >
      <div className="rm-card-head">
        <div>
          <h3>{destination.city}</h3>
          <p>
            {destination.airport ? `${destination.airport}, ` : ''}
            {destination.country}
          </p>
        </div>
        <button type="button" className="rm-card-close" aria-label="Close route details" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <ul className="rm-card-routes">
        {list.map((route) => {
          const origin = ORIGINS[route.origin]
          const km = distanceKm(origin.lat, origin.lon, destination.lat, destination.lon)
          return (
            <li key={route.id} className="rm-card-route">
              <div className="rm-card-info">
                <p className="rm-card-line">
                  {origin.city}
                  <ArrowRight size={14} aria-hidden="true" />
                  {destination.city}
                  <span className={`rm-badge kind-${route.kind}`}>{KIND_LABEL[route.kind]}</span>
                </p>
                <p className="rm-card-meta">{route.airlines.join(', ')}</p>
                <p className="rm-card-meta">
                  {Math.round(km).toLocaleString('en-GB')} km, about {formatDuration(estimateFlightMinutes(km))}
                </p>
                {route.note && <p className="rm-card-note">{route.note}</p>}
              </div>
              <button
                type="button"
                className="rm-card-search"
                onClick={() => requestRoute({ from: route.origin, to: destination.code })}
              >
                Search flights
                <ArrowRight size={15} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

export function RouteMap() {
  const reducedMotion = useReducedMotion()
  const isNarrow = !useMediaQuery('(min-width: 900px)')
  const stageRef = useRef<StageHandle>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const nearMap = useNearViewport(mapRef, '300px')

  const [origin, setOrigin] = useState<OriginFilter>('ALL')
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<RouteKind>>(new Set())
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [lap, setLap] = useState(0)

  const visible = useMemo(
    () => routes.filter((route) => (origin === 'ALL' || route.origin === origin) && !hiddenKinds.has(route.kind)),
    [origin, hiddenKinds],
  )

  const listed = useMemo(() => {
    const q = normalize(query)
    const seen = new Map<string, Route>()
    for (const route of visible) {
      const { code, city, country, airport } = route.destination
      if (seen.has(code)) continue
      const haystack = `${city} ${country} ${code} ${airport ?? ''} ${aliasesByCode.get(code) ?? ''}`
      if (!q || normalize(haystack).includes(q)) seen.set(code, route)
    }
    return [...seen.values()].sort(
      (a, b) =>
        a.destination.city.localeCompare(b.destination.city, 'en') ||
        (a.destination.airport ?? '').localeCompare(b.destination.airport ?? '', 'en'),
    )
  }, [visible, query])

  const selectedRoutes = useMemo(
    () => (picked ? visible.filter((route) => route.destination.code === picked) : []),
    [picked, visible],
  )
  const selectedCode = selectedRoutes.length ? picked : null

  // With nothing chosen, a plane keeps touring the scheduled routes so the map feels alive.
  const tour = useMemo(() => visible.filter((route) => route.kind === 'scheduled'), [visible])
  const focusCode = selectedCode ?? hovered
  const focusRoutes = focusCode ? visible.filter((route) => route.destination.code === focusCode) : []
  const tourRoute = tour.length ? tour[(lap * 37) % tour.length] : null
  const planeRoute = focusRoutes[0] ?? tourRoute

  const activeCodes = useMemo(() => {
    const codes = new Set<string>()
    if (focusCode) codes.add(focusCode)
    else if (planeRoute) codes.add(planeRoute.destination.code)
    return codes
  }, [focusCode, planeRoute])

  const pick = (code: string | null) => {
    setPicked(code)
    if (!code) return
    const list = visible.filter((route) => route.destination.code === code)
    // On wide screens the details card covers the bottom of the map, more so with several departures.
    stageRef.current?.showRoutes(list, isNarrow ? {} : { bottom: 120 + list.length * 66 })
  }

  const toggleKind = (kind: RouteKind) => {
    const next = new Set(hiddenKinds)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    setHiddenKinds(next)
  }

  const reveal = (index: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.8, delay: index * 0.07, ease },
  })

  const originChips: { value: OriginFilter; label: string; count: number }[] = [
    { value: 'ALL', label: 'All of Serbia', count: destinationCount(routes) },
    ...ORIGIN_CODES.map((code) => ({
      value: code as OriginFilter,
      label: ORIGINS[code].city,
      count: destinationCount(routes.filter((route) => route.origin === code)),
    })),
  ]

  return (
    <section id="routes" className="rm" aria-labelledby="rm-title">
      <motion.header className="rm-head" {...reveal(0)}>
        <p className="section-eyebrow">Direct from Serbia</p>
        <h2 id="rm-title" className="section-title">
          See where you can fly nonstop
        </h2>
        <p className="section-text">Pick a destination on the map or in the list to see who flies there, then search it in one click.</p>
      </motion.header>

      <motion.div className="rm-toolbar" {...reveal(1)}>
        <div className="rm-origins" role="radiogroup" aria-label="Departure airport">
          {originChips.map(({ value, label, count }) => (
            <label key={value} className={`rm-origin-chip${origin === value ? ' is-active' : ''}`}>
              <input
                type="radio"
                name="rm-origin"
                className="sr-only"
                checked={origin === value}
                onChange={() => setOrigin(value)}
              />
              {origin === value && (
                <motion.span layoutId="rm-origin-thumb" className="rm-origin-thumb" transition={{ duration: 0.35, ease }} />
              )}
              <span className="rm-origin-text">
                {label} <span className="rm-origin-count">{count}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="rm-kinds" role="group" aria-label="Route types">
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={!hiddenKinds.has(kind)}
              className={`rm-kind kind-${kind}${hiddenKinds.has(kind) ? ' is-off' : ''}`}
              onClick={() => toggleKind(kind)}
            >
              <span className="rm-kind-dot" aria-hidden="true" />
              {KIND_LABEL[kind]}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="rm-shell" {...reveal(2)}>
        <div className="rm-side">
          <div className="rm-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Filter destinations"
              placeholder="Filter destinations"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="rm-count" aria-live="polite">
            {listed.length} {listed.length === 1 ? 'destination' : 'destinations'}
          </p>
          <ul className="rm-list" onMouseLeave={() => setHovered(null)}>
            {listed.map(({ destination, kind }) => (
              <li key={destination.code}>
                <button
                  type="button"
                  className={`rm-item kind-${kind}${selectedCode === destination.code ? ' is-active' : ''}`}
                  aria-pressed={selectedCode === destination.code}
                  onMouseEnter={() => setHovered(destination.code)}
                  onClick={() => pick(destination.code)}
                >
                  <span className="rm-kind-dot" aria-hidden="true" />
                  <span className="rm-item-text">
                    <span className="rm-item-city">
                      {destination.city}
                      {destination.airport && listed.filter((r) => r.destination.city === destination.city).length > 1
                        ? ` ${destination.airport}`
                        : ''}
                    </span>
                    <span className="rm-item-country">{destination.country}</span>
                  </span>
                  <span className="rm-item-code">{destination.code}</span>
                </button>
              </li>
            ))}
          </ul>
          {listed.length === 0 && <p className="rm-empty">No direct flights match that.</p>}
        </div>

        <div ref={mapRef} className="rm-map">
          {nearMap && (
            <OptionalChunk
              failed={<p className="rm-map-failed">The map could not load, but every destination is in the list.</p>}
            >
              <WorldStage
                ref={stageRef}
                routes={visible}
                activeCodes={activeCodes}
                planeRouteId={planeRoute?.id ?? null}
                selectedCode={selectedCode}
                onPick={pick}
                onHover={setHovered}
                onPlaneLap={() => setLap((count) => count + 1)}
              />
            </OptionalChunk>
          )}
          <div className="rm-views">
            <button type="button" onClick={() => stageRef.current?.showEurope()}>
              Europe
            </button>
            <button type="button" onClick={() => stageRef.current?.showWorld()}>
              World
            </button>
          </div>
          <AnimatePresence>
            {selectedRoutes.length > 0 && (
              <RouteCard key={selectedCode} list={selectedRoutes} onClose={() => setPicked(null)} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p className="rm-note" {...reveal(3)}>
        Airline timetables as of autumn 2026. Routes change with the seasons, and flying times are estimates, so
        check the details when you book.
      </motion.p>
    </section>
  )
}
