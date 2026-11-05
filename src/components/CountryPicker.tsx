import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { MAIN_SITE, countries, siteLabel } from '../lib/countries'
import './CountryPicker.css'

const STORAGE_KEY = 'air-fantast-country'
const ease = [0.22, 1, 0.36, 1] as const

function readSaved(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && countries.some((country) => country.code === saved)) return saved
  } catch {
    // Storage can be blocked; the default country is fine then.
  }
  return countries[0].code
}

function save(code: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // The choice just won't be remembered next visit.
  }
}

/** Flag button in the header. Choosing a country reveals the link to its Air Fantast site. */
export function CountryPicker() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState(readSaved)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()
  const country = countries.find((item) => item.code === code) ?? countries[0]

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="cp">
      <button
        ref={triggerRef}
        type="button"
        className={`cp-trigger${open ? ' is-open' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Country: ${country.name}. Change country`}
        onClick={() => setOpen(!open)}
      >
        <img className="cp-flag" src={country.flag} alt="" width={26} height={20} />
        <ChevronDown className="cp-chevron" size={15} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose your country"
            className="cp-panel"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
          >
            <p className="cp-title">Choose your country</p>

            <div className="cp-list" role="radiogroup" aria-label="Country">
              {countries.map((item) => {
                const selected = item.code === code
                return (
                  <label key={item.code} className={`cp-option${selected ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name="cp-country"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setCode(item.code)
                        save(item.code)
                      }}
                    />
                    {selected && (
                      <motion.span
                        layoutId="cp-thumb"
                        className="cp-thumb"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                    <img className="cp-flag" src={item.flag} alt="" width={26} height={20} loading="lazy" />
                    <span className="cp-name">{item.name}</span>
                  </label>
                )
              })}
            </div>

            <div className="cp-result" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={country.code}
                  className="cp-result-inner"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.26, ease }}
                >
                  <span className="cp-result-copy">
                    <span className="cp-result-label">Air Fantast {country.name}</span>
                    <span className="cp-result-site">
                      {country.url ? siteLabel(country.url) : 'Site link coming soon'}
                    </span>
                  </span>
                  <a
                    className="cp-go"
                    href={country.url ?? MAIN_SITE}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {country.url ? 'Visit site' : siteLabel(MAIN_SITE)}
                    <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden="true" />
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
