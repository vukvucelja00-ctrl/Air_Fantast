import { Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { CABINS, type Cabin, type Passengers } from '../../lib/travellers'
import { Panel } from './Panel'

/** Most airlines take up to nine seated passengers on one booking. */
const MAX_SEATS = 9

const ROWS: { key: keyof Passengers; label: string; hint: string }[] = [
  { key: 'adults', label: 'Adults', hint: '12 years and over' },
  { key: 'children', label: 'Children', hint: '2 to 11 years' },
  { key: 'infants', label: 'Infants', hint: 'Under 2, on a lap' },
]

const ease = [0.22, 1, 0.36, 1] as const

export function TravellersPanel({
  passengers,
  cabin,
  isSheet,
  up,
  onPassengers,
  onCabin,
  onClose,
}: {
  passengers: Passengers
  cabin: Cabin
  isSheet: boolean
  up: boolean
  onPassengers: (next: Passengers) => void
  onCabin: (next: Cabin) => void
  onClose: () => void
}) {
  const seats = passengers.adults + passengers.children

  const canAdd = (key: keyof Passengers) =>
    key === 'infants' ? passengers.infants < passengers.adults : seats < MAX_SEATS
  const canRemove = (key: keyof Passengers) => passengers[key] > (key === 'adults' ? 1 : 0)

  const change = (key: keyof Passengers, delta: number) => {
    const next = { ...passengers, [key]: passengers[key] + delta }
    // Each infant travels on an adult's lap.
    next.infants = Math.min(next.infants, next.adults)
    onPassengers(next)
  }

  return (
    <Panel title="Travellers and cabin" variant="travellers" isSheet={isSheet} up={up} onClose={onClose}>
      <div className="fs-pax">
        {ROWS.map(({ key, label, hint }) => (
          <div key={key} className="fs-pax-row">
            <span>
              <span className="fs-pax-label">{label}</span>
              <span className="fs-pax-hint">{hint}</span>
            </span>
            <span className="fs-stepper" role="group" aria-label={label}>
              <button
                type="button"
                aria-label={`Remove one, ${label.toLowerCase()}`}
                disabled={!canRemove(key)}
                onClick={() => change(key, -1)}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="fs-stepper-value" aria-live="polite">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={passengers[key]}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.22, ease }}
                  >
                    {passengers[key]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <button
                type="button"
                aria-label={`Add one, ${label.toLowerCase()}`}
                disabled={!canAdd(key)}
                onClick={() => change(key, 1)}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}
      </div>

      <p className="fs-cabin-title">Cabin</p>
      <div className="fs-cabins" role="radiogroup" aria-label="Cabin">
        {CABINS.map((name) => (
          <label key={name} className={`fs-cabin${cabin === name ? ' is-active' : ''}`}>
            <input
              type="radio"
              name="fs-cabin"
              className="sr-only"
              checked={cabin === name}
              onChange={() => onCabin(name)}
            />
            {cabin === name && (
              <motion.span layoutId="fs-cabin-thumb" className="fs-cabin-thumb" transition={{ duration: 0.3, ease }} />
            )}
            <span className="fs-cabin-text">{name}</span>
          </label>
        ))}
      </div>

      <div className="fs-panel-foot">
        <span className="fs-cal-summary">{seats >= MAX_SEATS ? `Up to ${MAX_SEATS} seats per booking` : ''}</span>
        <span className="fs-panel-actions">
          <button type="button" className="fs-done-btn" onClick={onClose}>
            Done
          </button>
        </span>
      </div>
    </Panel>
  )
}
