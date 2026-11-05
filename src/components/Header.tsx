import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Globe,
  MapPin,
  Palmtree,
  Plane,
  Route,
  Search,
  Sun,
  Ticket,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useAnimate, useReducedMotion, type Transition } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { lockScroll } from '../lib/scroll'
import { CountryPicker } from './CountryPicker'
import './Header.css'

type MenuItem = { label: string; description: string; icon: LucideIcon }

const menus = {
  flights: [
    { label: 'One-way', description: 'Simple trips at the best fares', icon: ArrowRight },
    { label: 'Return', description: 'Out and back in one booking', icon: ArrowLeftRight },
    { label: 'Multi-city', description: 'Several stops, one itinerary', icon: Route },
    { label: 'Last-minute deals', description: 'Seats leaving soon', icon: Clock },
  ],
  destinations: [
    { label: 'Europe', description: 'City breaks and weekend escapes', icon: MapPin },
    { label: 'Summer holidays', description: 'Beaches and islands', icon: Sun },
    { label: 'Exotic trips', description: 'Long-haul made easy', icon: Palmtree },
    { label: 'Worldwide', description: 'Anywhere you want to go', icon: Globe },
  ],
} satisfies Record<string, MenuItem[]>

type MenuKey = keyof typeof menus

type NavLink = { label: string; href: string; menu?: MenuKey }

const navLinks: NavLink[] = [
  { label: 'Flights', href: '#flights', menu: 'flights' },
  { label: 'Destinations', href: '#destinations', menu: 'destinations' },
  { label: 'Special offers', href: '#offers' },
  { label: 'About us', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const ease = [0.22, 1, 0.36, 1] as const
const EASE_OUT: Transition = { duration: 0.45, ease }
const EASE_IN: Transition = { duration: 0.2, ease: [0.4, 0, 1, 1] }
const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 36 }

/* Intro: each group drops in, then staggers its children. */
const introGroup = (delay: number) => ({
  hidden: { opacity: 0, y: -18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease, delay, delayChildren: delay + 0.2, staggerChildren: 0.055 },
  },
})
const introItem = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

function Burger({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="burger">
      <motion.span
        initial={false}
        animate={open ? { top: '50%', y: '-50%', rotate: 45 } : { top: 0, y: 0, rotate: 0 }}
        transition={EASE_OUT}
      />
      <motion.span
        initial={false}
        animate={open ? { top: '50%', y: '-50%', rotate: -45 } : { top: '100%', y: '-100%', rotate: 0 }}
        transition={EASE_OUT}
      />
    </span>
  )
}

/** Yellow submit button: a shine sweeps across it now and then, and the plane takes off on hover. */
function FindButton() {
  return (
    <button type="submit" className="find-btn">
      <span className="find-btn-shine" aria-hidden="true" />
      <span className="find-btn-label">Find ticket</span>
      <span className="find-btn-icon" aria-hidden="true">
        <Plane className="plane plane-a" size={15} strokeWidth={2.25} />
        <Plane className="plane plane-b" size={15} strokeWidth={2.25} />
      </span>
    </button>
  )
}

function TicketSearch({
  id,
  inputRef,
  variant,
}: {
  id: string
  inputRef: RefObject<HTMLInputElement | null>
  variant: 'header' | 'panel'
}) {
  const [value, setValue] = useState('')
  const [scope, animate] = useAnimate<HTMLFormElement>()
  const reducedMotion = useReducedMotion()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) {
      inputRef.current?.focus()
      if (!reducedMotion) animate(scope.current, { x: [0, -7, 7, -4, 4, 0] }, { duration: 0.4 })
      return
    }
    // TODO: connect to the booking lookup once the backend exists.
  }

  return (
    <form ref={scope} role="search" className={`ticket-search ticket-search--${variant}`} onSubmit={onSubmit}>
      <label htmlFor={id} className="sr-only">
        Booking code or ticket number
      </label>
      <Ticket className="ticket-search-icon" size={18} aria-hidden="true" />
      <input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={variant === 'panel' ? 'Booking code' : 'Booking code or ticket no.'}
        autoComplete="off"
        spellCheck={false}
      />
      <FindButton />
    </form>
  )
}

function Dropdown({ open, menuKey, onNavigate }: { open: boolean; menuKey: MenuKey; onNavigate: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dropdown-panel"
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: EASE_OUT }}
          exit={{ opacity: 0, y: 8, scale: 0.97, transition: EASE_IN }}
        >
          <motion.div
            className="dropdown-card"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.035 } } }}
          >
            {menus[menuKey].map(({ label, description, icon: Icon }) => (
              <motion.a
                key={label}
                href="#"
                className="dropdown-item"
                onClick={onNavigate}
                variants={{
                  hidden: { opacity: 0, x: -6 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease } },
                }}
              >
                <span className="dropdown-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="dropdown-label">{label}</span>
                  <span className="dropdown-desc">{description}</span>
                </span>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Desktop links. A frosted thumb glides to the hovered link; Flights and Destinations open their
 * menu on hover (closing waits a beat so a pointer cutting a corner does not drop it) or on click.
 */
function NavRow() {
  const [hover, setHover] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const rowRef = useRef<HTMLUListElement>(null)
  const reducedMotion = useReducedMotion()

  const show = (key: MenuKey) => {
    window.clearTimeout(timer.current)
    setOpenMenu(key)
  }
  const close = () => {
    window.clearTimeout(timer.current)
    setOpenMenu(null)
  }
  const closeSoon = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpenMenu(null), 140)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  const openLabel = navLinks.find((link) => link.menu && link.menu === openMenu)?.label ?? null
  const shown = hover ?? openLabel

  return (
    <ul ref={rowRef} className="nav-row" onMouseLeave={() => setHover(null)}>
      {navLinks.map((link) => {
        const menu = link.menu
        const isOpen = !!menu && openMenu === menu
        const hoverProps = {
          onMouseEnter: () => setHover(link.label),
          onFocus: () => setHover(link.label),
          onBlur: () => setHover(null),
        }
        return (
          <motion.li
            key={link.label}
            variants={introItem}
            className="nav-item"
            onMouseEnter={menu ? () => show(menu) : undefined}
            onMouseLeave={menu ? closeSoon : undefined}
          >
            <AnimatePresence>
              {shown === link.label && (
                <motion.span
                  layoutId="nav-thumb"
                  className="nav-thumb"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.18 } }}
                  transition={reducedMotion ? { duration: 0 } : SPRING}
                />
              )}
            </AnimatePresence>
            {menu ? (
              <button
                type="button"
                className="nav-link"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => (isOpen ? close() : show(menu))}
                {...hoverProps}
              >
                {link.label}
                <ChevronDown className="nav-chevron" size={15} aria-hidden="true" />
              </button>
            ) : (
              <a href={link.href} className="nav-link" {...hoverProps}>
                {link.label}
              </a>
            )}
            {menu && <Dropdown open={isOpen} menuKey={menu} onNavigate={close} />}
          </motion.li>
        )
      })}
    </ul>
  )
}

function MobilePanel({
  open,
  onClose,
  inputRef,
}: {
  open: boolean
  onClose: () => void
  inputRef: RefObject<HTMLInputElement | null>
}) {
  const reducedMotion = useReducedMotion()
  const [expanded, setExpanded] = useState<MenuKey | null>(null)

  const item = (i: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0, transition: { ...EASE_OUT, delay: 0.08 + i * 0.045 } },
          exit: { opacity: 0, transition: { duration: 0.12 } },
        }

  return (
    <AnimatePresence onExitComplete={() => setExpanded(null)}>
      {open && (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label="Close menu"
            className="m-scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="m-panel"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: EASE_OUT }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -6, transition: EASE_IN }}
          >
            <motion.div {...item(0)}>
              <TicketSearch id="ticket-mobile" inputRef={inputRef} variant="panel" />
            </motion.div>

            <nav aria-label="Mobile" className="m-nav">
              {navLinks.map((link, i) => {
                const menu = link.menu
                const isExpanded = !!menu && expanded === menu
                return (
                  <motion.div key={link.label} className="m-row" {...item(i + 1)}>
                    {menu ? (
                      <>
                        <button
                          type="button"
                          className="m-link"
                          aria-expanded={isExpanded}
                          onClick={() => setExpanded(isExpanded ? null : menu)}
                        >
                          {link.label}
                          <span className={`m-chevron${isExpanded ? ' is-open' : ''}`}>
                            <ChevronDown size={18} aria-hidden="true" />
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              className="m-sub"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1, transition: EASE_OUT }}
                              exit={{ height: 0, opacity: 0, transition: EASE_IN }}
                            >
                              <div className="m-sub-inner">
                                {menus[menu].map(({ label, icon: Icon }) => (
                                  <a key={label} href="#" className="m-sub-link" onClick={onClose}>
                                    <span className="m-sub-icon">
                                      <Icon size={16} aria-hidden="true" />
                                    </span>
                                    {label}
                                  </a>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <a href={link.href} className="m-link" onClick={onClose}>
                        {link.label}
                        <ArrowUpRight className="m-arrow" size={18} aria-hidden="true" />
                      </a>
                    )}
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Header() {
  const reducedMotion = useReducedMotion()
  const [condensed, setCondensed] = useState(false)
  const [open, setOpen] = useState(false)
  const desktopInput = useRef<HTMLInputElement>(null)
  const mobileInput = useRef<HTMLInputElement>(null)
  const focusTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The mobile panel has no place on desktop.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1241px)')
    const onChange = () => {
      if (media.matches) setOpen(false)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(focusTimer.current), [])

  const openSearch = () => {
    setOpen(true)
    window.clearTimeout(focusTimer.current)
    focusTimer.current = window.setTimeout(() => mobileInput.current?.focus(), reducedMotion ? 0 : 280)
  }

  return (
    <>
      <header className={`hdr${condensed ? ' is-condensed' : ''}`}>
        <motion.div
          className="hdr-pill"
          variants={introGroup(0.1)}
          initial={reducedMotion ? false : 'hidden'}
          animate="show"
        >
          <motion.a variants={introItem} href="/" className="hdr-logo" aria-label="Air Fantast home">
            <img src="/air-fantast-logo-navy.svg" alt="Air Fantast" />
          </motion.a>
          <motion.span variants={introItem} className="hdr-divider" aria-hidden="true" />
          <NavRow />
          <motion.button
            variants={introItem}
            type="button"
            className="hdr-burger"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Burger open={open} />
          </motion.button>
        </motion.div>

        <motion.div
          className="hdr-right"
          variants={introGroup(0.3)}
          initial={reducedMotion ? false : 'hidden'}
          animate="show"
        >
          <motion.div variants={introItem}>
            <CountryPicker />
          </motion.div>
          <motion.div variants={introItem} className="hdr-search">
            <TicketSearch id="ticket-header" inputRef={desktopInput} variant="header" />
          </motion.div>
          <motion.button
            variants={introItem}
            type="button"
            className="hdr-search-btn"
            onClick={openSearch}
            aria-label="Find your ticket"
          >
            <Search size={20} strokeWidth={2.25} aria-hidden="true" />
          </motion.button>
        </motion.div>
      </header>

      <MobilePanel open={open} onClose={() => setOpen(false)} inputRef={mobileInput} />
    </>
  )
}
