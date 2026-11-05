import { ArrowLeftRight, CalendarDays, Plane, PlaneLanding, PlaneTakeoff, Users, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { airports, type Airport } from '../../lib/airports'
import { formatShort, formatWeekday, startOfDay } from '../../lib/dates'
import type { Cabin, Passengers } from '../../lib/travellers'
import { lockScroll, scrollToElement } from '../../lib/scroll'
import { onRouteRequest } from '../../lib/searchBridge'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { AirportPanel } from './AirportPanel'
import { DatePanel } from './DatePanel'
import { TravellersPanel } from './TravellersPanel'
import './FlightSearch.css'

type PanelName = 'from' | 'to' | 'depart' | 'return' | 'travellers'
type Trip = 'return' | 'oneway'

const TRIPS: { value: Trip; label: string }[] = [
  { value: 'return', label: 'Return' },
  { value: 'oneway', label: 'One way' },
]

/** Rough panel heights, for deciding whether a popover opens above or below its field. */
const PANEL_HEIGHT: Record<PanelName, number> = { from: 440, to: 440, depart: 470, return: 470, travellers: 450 }
/** Keeps upward popovers clear of the fixed header. */
const HEADER_SPACE = 90

const ease = [0.22, 1, 0.36, 1] as const

function Field({
  label,
  icon: Icon,
  value,
  sub,
  isOpen,
  isHovered,
  dimmed,
  triggerRef,
  onHover,
  onClick,
  children,
}: {
  label: string
  icon: LucideIcon
  value: string | null
  sub: string
  isOpen: boolean
  isHovered: boolean
  dimmed?: boolean
  triggerRef: (element: HTMLButtonElement | null) => void
  onHover: (hovering: boolean) => void
  onClick: () => void
  children?: ReactNode
}) {
  return (
    <div
      className={`fs-field${isOpen ? ' is-open' : ''}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <AnimatePresence>
        {(isHovered || isOpen) && (
          <motion.span
            layoutId="fs-thumb"
            className="fs-thumb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          />
        )}
      </AnimatePresence>
      <button
        ref={triggerRef}
        type="button"
        className="fs-trigger"
        data-fs-trigger
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={onClick}
      >
        <span className="fs-label">
          <Icon size={14} aria-hidden="true" />
          {label}
        </span>
        <span className="fs-value-clip">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value ?? 'empty'}
              className={`fs-value${value && !dimmed ? '' : ' is-empty'}`}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              {value ?? 'Add'}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="fs-sub">{sub}</span>
      </button>
      {children}
    </div>
  )
}

export function FlightSearch() {
  const [today] = useState(() => startOfDay(new Date()))
  const [trip, setTrip] = useState<Trip>('return')
  const [from, setFrom] = useState<Airport | null>(() => airports.find((a) => a.code === 'BEG') ?? null)
  const [to, setTo] = useState<Airport | null>(null)
  const [depart, setDepart] = useState<Date | null>(null)
  const [ret, setRet] = useState<Date | null>(null)
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 })
  const [cabin, setCabin] = useState<Cabin>('Economy')
  const [direct, setDirect] = useState(false)

  const [open, setOpen] = useState<PanelName | null>(null)
  const [up, setUp] = useState(false)
  const [hovered, setHovered] = useState<PanelName | null>(null)
  const [swaps, setSwaps] = useState(0)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const triggers = useRef<Partial<Record<PanelName, HTMLButtonElement | null>>>({})
  const submitRef = useRef<HTMLButtonElement>(null)
  const [cardScope, animateCard] = useAnimate<HTMLFormElement>()
  const reducedMotion = useReducedMotion()
  const isSheet = !useMediaQuery('(min-width: 720px)')

  const isReturn = trip === 'return'

  const openPanel = (name: PanelName) => {
    const anchor = triggers.current[name]
    if (anchor && !isSheet) {
      const rect = anchor.getBoundingClientRect()
      const need = PANEL_HEIGHT[name] + 16
      setUp(window.innerHeight - rect.bottom < need && rect.top - HEADER_SPACE > need)
    }
    setOpen(name)
  }

  const closePanel = () => {
    const name = open
    setOpen(null)
    if (name) triggers.current[name]?.focus({ preventScroll: true })
  }

  const finishPanels = () => {
    setOpen(null)
    submitRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target?.closest('[data-fs-popover],[data-fs-trigger]')) setOpen(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // A bottom sheet owns the screen while it is open.
  useEffect(() => {
    if (!open || !isSheet) return
    lockScroll(true)
    return () => {
      lockScroll(false)
    }
  }, [open, isSheet])

  const pickAirport = (side: 'from' | 'to', airport: Airport) => {
    if (side === 'from') {
      setFrom(airport)
      if (to) continueToDates()
      else openPanel('to')
    } else {
      setTo(airport)
      if (from) continueToDates()
      else openPanel('from')
    }
  }

  // Both ends chosen: carry on to the dates unless they are already set.
  const continueToDates = () => {
    if (!depart) openPanel('depart')
    else if (isReturn && !ret) openPanel('return')
    else finishPanels()
  }

  // The route map asks for a route: fill it in, bring the form into view and carry on to the dates.
  const continueRef = useRef(continueToDates)
  const cancelRouteWait = useRef<(() => void) | undefined>(undefined)
  useEffect(() => {
    continueRef.current = continueToDates
  })
  useEffect(() => {
    const stop = onRouteRequest(({ from: fromCode, to: toCode }) => {
      setFrom(airports.find((airport) => airport.code === fromCode) ?? null)
      setTo(airports.find((airport) => airport.code === toCode) ?? null)
      setOpen(null)
      cancelRouteWait.current?.()
      // Lands just under the header (see the card's scroll-margin), which leaves the calendar room below.
      if (!cardScope.current) return
      cancelRouteWait.current = scrollToElement(cardScope.current, () => continueRef.current())
    })
    return () => {
      stop()
      cancelRouteWait.current?.()
    }
  }, [cardScope])

  const swap = () => {
    setFrom(to)
    setTo(from)
    setSwaps((count) => count + 1)
  }

  const pickDate = (date: Date) => {
    if (open === 'depart') {
      setDepart(date)
      if (ret && ret < date) setRet(null)
      if (isReturn) openPanel('return')
      else finishPanels()
      return
    }
    if (!depart || date < depart) {
      // A date before the departure starts the trip over from that day.
      setDepart(date)
      setRet(null)
      return
    }
    setRet(date)
    finishPanels()
  }

  const clearDates = () => {
    setDepart(null)
    setRet(null)
    openPanel('depart')
  }

  const seats = passengers.adults + passengers.children + passengers.infants
  const travellers = seats === 1 ? '1 traveller' : `${seats} travellers`

  const summary =
    from && to && depart && (!isReturn || ret)
      ? [
          `${from.city} (${from.code}) → ${to.city} (${to.code})`,
          isReturn && ret ? `${formatShort(depart)} – ${formatShort(ret)}` : `${formatShort(depart)}, one way`,
          travellers,
          cabin,
          ...(direct ? ['Direct only'] : []),
        ].join(' · ')
      : null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    // Takes the traveller straight to whatever is still missing.
    const missing: PanelName | null = !from
      ? 'from'
      : !to
        ? 'to'
        : !depart
          ? 'depart'
          : isReturn && !ret
            ? 'return'
            : null
    if (missing) {
      if (!reducedMotion) animateCard(cardScope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 })
      openPanel(missing)
      return
    }
    // The summary stands in until a flight results page exists to send this search to.
    setSubmitted(summary)
  }

  const fieldProps = (name: PanelName) => ({
    isOpen: open === name,
    isHovered: hovered === name,
    triggerRef: (element: HTMLButtonElement | null) => {
      triggers.current[name] = element
    },
    onHover: (hovering: boolean) => setHovered(hovering ? name : null),
    onClick: () => (open === name ? closePanel() : openPanel(name)),
  })

  const dateOpen = open === 'depart' || open === 'return'

  return (
    <section id="flight-search" className="fs-section" aria-label="Search flights">
      <motion.form
        ref={cardScope}
        className="fs-card"
        onSubmit={onSubmit}
        noValidate
        initial={reducedMotion ? false : { opacity: 0, y: 36, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1, delay: 1.15, ease }}
      >
        <div className="fs-toolbar">
          <div className="fs-trips" role="radiogroup" aria-label="Trip type">
            {TRIPS.map(({ value, label }) => (
              <label key={value} className={`fs-trip${trip === value ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="fs-trip"
                  className="sr-only"
                  checked={trip === value}
                  onChange={() => setTrip(value)}
                />
                {trip === value && (
                  <motion.span layoutId="fs-trip-thumb" className="fs-trip-thumb" transition={{ duration: 0.35, ease }} />
                )}
                <span className="fs-trip-text">{label}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={direct}
            className={`fs-switch${direct ? ' is-on' : ''}`}
            onClick={() => setDirect(!direct)}
          >
            <span className="fs-switch-track" aria-hidden="true">
              <motion.span layout className="fs-switch-dot" transition={{ duration: 0.28, ease }} />
            </span>
            Direct flights only
          </button>
        </div>

        <div className="fs-grid">
          <div className="fs-route">
            <Field
              label="From"
              icon={PlaneTakeoff}
              value={from?.city ?? null}
              sub={from ? `${from.code} · ${from.country}` : 'Where from?'}
              {...fieldProps('from')}
            >
              <AnimatePresence>
                {open === 'from' && (
                  <AirportPanel
                    title="Flying from"
                    excludeCode={to?.code}
                    isSheet={isSheet}
                    up={up}
                    onSelect={(airport) => pickAirport('from', airport)}
                    onClose={closePanel}
                  />
                )}
              </AnimatePresence>
            </Field>

            <motion.button
              type="button"
              className="fs-swap"
              aria-label="Swap origin and destination"
              disabled={!from && !to}
              animate={{ rotate: swaps * 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.45, ease }}
              onClick={swap}
            >
              <ArrowLeftRight size={16} strokeWidth={2.25} aria-hidden="true" />
            </motion.button>

            <Field
              label="To"
              icon={PlaneLanding}
              value={to?.city ?? null}
              sub={to ? `${to.code} · ${to.country}` : 'Where to?'}
              {...fieldProps('to')}
            >
              <AnimatePresence>
                {open === 'to' && (
                  <AirportPanel
                    title="Flying to"
                    excludeCode={from?.code}
                    isSheet={isSheet}
                    up={up}
                    onSelect={(airport) => pickAirport('to', airport)}
                    onClose={closePanel}
                  />
                )}
              </AnimatePresence>
            </Field>
          </div>

          <div className="fs-dates">
            <Field
              label="Departure"
              icon={CalendarDays}
              value={depart ? formatShort(depart) : null}
              sub={depart ? formatWeekday(depart) : 'Choose a date'}
              {...fieldProps('depart')}
            />
            <Field
              label="Return"
              icon={CalendarDays}
              value={isReturn ? (ret ? formatShort(ret) : null) : 'One way'}
              dimmed={!isReturn}
              sub={isReturn ? (ret ? formatWeekday(ret) : 'Choose a date') : 'Add a return'}
              {...fieldProps('return')}
              onClick={() => {
                if (!isReturn) {
                  setTrip('return')
                  openPanel('return')
                } else if (open === 'return') closePanel()
                else openPanel('return')
              }}
            />
            <AnimatePresence>
              {dateOpen && (
                <DatePanel
                  mode={open === 'return' ? 'return' : 'depart'}
                  isReturnTrip={isReturn}
                  depart={depart}
                  ret={ret}
                  today={today}
                  isSheet={isSheet}
                  up={up}
                  onPick={pickDate}
                  onClear={clearDates}
                  onClose={closePanel}
                />
              )}
            </AnimatePresence>
          </div>

          <Field
            label="Travellers"
            icon={Users}
            value={travellers}
            sub={cabin}
            {...fieldProps('travellers')}
          >
            <AnimatePresence>
              {open === 'travellers' && (
                <TravellersPanel
                  passengers={passengers}
                  cabin={cabin}
                  isSheet={isSheet}
                  up={up}
                  onPassengers={setPassengers}
                  onCabin={setCabin}
                  onClose={closePanel}
                />
              )}
            </AnimatePresence>
          </Field>

          {/* Shares the shine and take-off animation of the header's Find ticket button. */}
          <button ref={submitRef} type="submit" className="find-btn fs-submit">
            <span className="find-btn-shine" aria-hidden="true" />
            <span className="find-btn-label">Search flights</span>
            <span className="find-btn-icon" aria-hidden="true">
              <Plane className="plane plane-a" size={18} strokeWidth={2.25} />
              <Plane className="plane plane-b" size={18} strokeWidth={2.25} />
            </span>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {submitted && submitted === summary && (
            <motion.div
              className="fs-summary-wrap"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <p className="fs-summary" role="status">
                {submitted}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </section>
  )
}
