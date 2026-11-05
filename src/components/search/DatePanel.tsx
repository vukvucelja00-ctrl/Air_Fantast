import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  WEEKDAYS,
  addDays,
  addMonths,
  dateKey,
  formatFull,
  formatMonth,
  formatShort,
  monthWeeks,
  monthsBetween,
  nightsBetween,
  sameDay,
  startOfMonth,
} from '../../lib/dates'
import { Panel } from './Panel'

/** How many months ahead flights can be chosen. */
const MONTHS_AHEAD = 11

const ease = [0.22, 1, 0.36, 1] as const

export function DatePanel({
  mode,
  isReturnTrip,
  depart,
  ret,
  today,
  isSheet,
  up,
  onPick,
  onClear,
  onClose,
}: {
  mode: 'depart' | 'return'
  isReturnTrip: boolean
  depart: Date | null
  ret: Date | null
  today: Date
  isSheet: boolean
  up: boolean
  onPick: (date: Date) => void
  onClear: () => void
  onClose: () => void
}) {
  const reducedMotion = useReducedMotion()
  const firstMonth = startOfMonth(today)
  const lastMonth = addMonths(firstMonth, MONTHS_AHEAD)
  const lastDay = addDays(addMonths(lastMonth, 1), -1)
  const count = isSheet ? 1 : 2
  const latestView = addMonths(lastMonth, 1 - count)

  const initial = mode === 'return' ? (ret ?? depart ?? today) : (depart ?? today)
  const clampView = (month: Date) => {
    if (monthsBetween(firstMonth, month) < 0) return firstMonth
    if (monthsBetween(latestView, month) > 0) return latestView
    return month
  }

  const [view, setView] = useState(() => clampView(startOfMonth(initial)))
  const [direction, setDirection] = useState(1)
  const [hovered, setHovered] = useState<Date | null>(null)
  const [focusDate, setFocusDate] = useState(initial)
  const moveFocus = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${dateKey(focusDate)}"]`)?.focus()
  }, [focusDate, view])

  const goTo = (next: Date, dir: number) => {
    setDirection(dir)
    setView(clampView(next))
  }

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const step = steps[event.key]
    if (!step) return
    event.preventDefault()
    const next = addDays(focusDate, step)
    if (next < today || next > lastDay) return
    moveFocus.current = true
    setFocusDate(next)
    const offset = monthsBetween(view, next)
    if (offset < 0 || offset >= count) goTo(startOfMonth(offset < 0 ? next : addMonths(next, 1 - count)), offset < 0 ? -1 : 1)
  }

  const previewEnd =
    isReturnTrip && mode === 'return' && !ret && depart && hovered && hovered > depart ? hovered : null
  const rangeEnd = isReturnTrip ? (ret ?? previewEnd) : null

  const months = Array.from({ length: count }, (_, index) => addMonths(view, index))
  const focusVisible = months.some((month) => monthsBetween(month, focusDate) === 0)
  const tabDate = focusVisible ? focusDate : (monthWeeks(view).flat().find((d) => d && d >= today) ?? today)

  const summary =
    depart && ret && isReturnTrip
      ? `${formatShort(depart)} – ${formatShort(ret)}, ${nightsBetween(depart, ret)} ${nightsBetween(depart, ret) === 1 ? 'night' : 'nights'}`
      : depart
        ? isReturnTrip
          ? `${formatShort(depart)} – choose your return`
          : formatShort(depart)
        : 'No dates yet'

  return (
    <Panel
      title={mode === 'depart' ? 'Choose your departure' : 'Choose your return'}
      variant="dates"
      isSheet={isSheet}
      up={up}
      onClose={onClose}
    >
      <div className="fs-cal-nav">
        <button
          type="button"
          className="fs-cal-arrow"
          aria-label="Previous month"
          disabled={monthsBetween(firstMonth, view) <= 0}
          onClick={() => goTo(addMonths(view, -1), -1)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="fs-cal-arrow"
          aria-label="Next month"
          disabled={monthsBetween(latestView, view) >= 0}
          onClick={() => goTo(addMonths(view, 1), 1)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="fs-cal-window" ref={gridRef} onKeyDown={onGridKey} onMouseLeave={() => setHovered(null)}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={dateKey(view)}
            className="fs-cal-months"
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: reducedMotion ? 0 : dir * 48, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: reducedMotion ? 0 : dir * -48, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease }}
          >
            {months.map((month) => (
              <div key={dateKey(month)} className="fs-cal-month">
                <p className="fs-cal-title">{formatMonth(month)}</p>
                <div role="grid" aria-label={formatMonth(month)} className="fs-cal-grid">
                  <div role="row" className="fs-cal-row">
                    {WEEKDAYS.map((day) => (
                      <span key={day} role="columnheader" className="fs-cal-weekday">
                        {day}
                      </span>
                    ))}
                  </div>
                  {monthWeeks(month).map((week, weekIndex) => (
                    <div key={weekIndex} role="row" className="fs-cal-row">
                      {week.map((date, dayIndex) => {
                        if (!date) return <span key={dayIndex} role="gridcell" className="fs-day-cell" />
                        const disabled = date < today || date > lastDay
                        const isStart = sameDay(date, depart)
                        const isEnd = sameDay(date, ret) && isReturnTrip
                        const isPreview = sameDay(date, previewEnd)
                        const inRange = !!depart && !!rangeEnd && date > depart && date < rangeEnd
                        const classes = [
                          'fs-day-cell',
                          inRange && 'in-range',
                          isStart && rangeEnd && rangeEnd > depart! && 'range-start',
                          (isEnd || isPreview) && depart && date > depart && 'range-end',
                        ]
                          .filter(Boolean)
                          .join(' ')
                        const dayClasses = [
                          'fs-day',
                          (isStart || isEnd) && 'is-selected',
                          isPreview && 'is-preview',
                          sameDay(date, today) && 'is-today',
                        ]
                          .filter(Boolean)
                          .join(' ')
                        return (
                          <span key={dayIndex} role="gridcell" className={classes}>
                            <button
                              type="button"
                              data-date={dateKey(date)}
                              className={dayClasses}
                              disabled={disabled}
                              tabIndex={sameDay(date, tabDate) ? 0 : -1}
                              aria-label={formatFull(date)}
                              aria-pressed={isStart || isEnd}
                              onMouseEnter={() => setHovered(date)}
                              onFocus={() => {
                                setHovered(date)
                                setFocusDate(date)
                              }}
                              onClick={() => onPick(date)}
                            >
                              {date.getDate()}
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fs-panel-foot">
        <span className="fs-cal-summary" aria-live="polite">
          {summary}
        </span>
        <span className="fs-panel-actions">
          <button type="button" className="fs-text-btn" onClick={onClear} disabled={!depart && !ret}>
            Clear
          </button>
          <button type="button" className="fs-done-btn" onClick={onClose}>
            Done
          </button>
        </span>
      </div>
    </Panel>
  )
}
