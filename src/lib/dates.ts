/** Calendar helpers. Every date is a local Date at midnight; weeks start on Monday. */

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

export const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime()

export const monthsBetween = (from: Date, to: Date) =>
  (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()

export const nightsBetween = (from: Date, to: Date) =>
  Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      86_400_000,
  )

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Six rows of seven days covering the month; days outside it are null. */
export function monthWeeks(month: Date): (Date | null)[][] {
  const first = startOfMonth(month)
  const leading = (first.getDay() + 6) % 7
  const weeks: (Date | null)[][] = []
  for (let week = 0; week < 6; week++) {
    const row: (Date | null)[] = []
    for (let day = 0; day < 7; day++) {
      const date = addDays(first, week * 7 + day - leading)
      row.push(date.getMonth() === first.getMonth() ? date : null)
    }
    weeks.push(row)
  }
  return weeks
}

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const monthTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
const fullDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatShort = (date: Date) => shortDate.format(date)
export const formatWeekday = (date: Date) => weekday.format(date)
export const formatMonth = (date: Date) => monthTitle.format(date)
export const formatFull = (date: Date) => fullDate.format(date)
