import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, Plane } from 'lucide-react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { contact, mailtoLink } from '../lib/contact'
import { PLANE_PATH } from '../lib/planeShape'
import './Footer.css'

const YEAR = new Date().getFullYear()

const ease = [0.22, 1, 0.36, 1] as const

const links = [
  { label: 'Search flights', href: '#flight-search' },
  { label: 'Route map', href: '#routes' },
  { label: 'Why Air Fantast', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

/* The swoosh, in the units of its viewBox. The plane follows the middle of the band. */
const VIEW_WIDTH = 1440
const VIEW_HEIGHT = 140
const FLIGHT = { startY: 120, controlX: 900, controlY: 120, endY: 14 }
/** The plane waits off the left edge and carries on past the end of the band, so it crosses the whole screen. */
const FLY_START = -0.05
const FLY_OFF = 1.1
const FLIGHT_SECONDS = 2.2

function flightPoint(t: number) {
  const u = 1 - t
  return {
    x: 2 * u * t * FLIGHT.controlX + t * t * VIEW_WIDTH,
    y: u * u * FLIGHT.startY + 2 * u * t * FLIGHT.controlY + t * t * FLIGHT.endY,
    dx: 2 * u * FLIGHT.controlX + 2 * t * (VIEW_WIDTH - FLIGHT.controlX),
    dy: 2 * u * (FLIGHT.controlY - FLIGHT.startY) + 2 * t * (FLIGHT.endY - FLIGHT.controlY),
  }
}

/** The yellow band is drawn behind the plane; the SVG stretches, so its size is read on the fly. */
function SwooshFlight({ flight, boxRef }: { flight: MotionValue<number>; boxRef: RefObject<HTMLDivElement | null> }) {
  const scale = () => {
    const box = boxRef.current
    return { x: (box?.offsetWidth ?? VIEW_WIDTH) / VIEW_WIDTH, y: (box?.offsetHeight ?? VIEW_HEIGHT) / VIEW_HEIGHT }
  }

  const clipPath = useTransform(flight, (t) => {
    const hidden = Math.max(0, 100 - (flightPoint(t).x / VIEW_WIDTH) * 100)
    return `inset(0 ${hidden}% 0 0)`
  })
  const x = useTransform(flight, (t) => flightPoint(t).x * scale().x)
  const y = useTransform(flight, (t) => flightPoint(t).y * scale().y)
  const rotate = useTransform(flight, (t) => {
    const { dx, dy } = flightPoint(t)
    const { x: scaleX, y: scaleY } = scale()
    return (Math.atan2(dy * scaleY, dx * scaleX) * 180) / Math.PI
  })

  return (
    <>
      <motion.div className="ft-swoosh-reveal" style={{ clipPath }}>
        <SwooshBand />
      </motion.div>
      <motion.div className="ft-plane" style={{ x, y, rotate }}>
        <svg viewBox="0 0 60 56">
          <path d={PLANE_PATH} fill="currentColor" />
        </svg>
      </motion.div>
    </>
  )
}

function SwooshBand() {
  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} preserveAspectRatio="none">
      <path d="M0 120Q900 112 1440 0V28Q900 128 0 120Z" fill="var(--yellow)" />
    </svg>
  )
}

/** The brand's yellow swoosh along the top edge of the footer. */
function Swoosh() {
  const boxRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const flight = useMotionValue(FLY_START)

  const arrived = useInView(boxRef, { amount: 0.9, margin: '0px 0px -15% 0px' })
  const onScreen = useInView(boxRef)

  // The plane takes off once the swoosh is well on screen. A flight in progress keeps going
  // if the visitor scrolls back a little, and only leaving the swoosh behind sets up the next one.
  useEffect(() => {
    if (arrived && flight.get() === FLY_START) {
      animate(flight, FLY_OFF, { duration: FLIGHT_SECONDS, ease: [0.3, 0.1, 0.7, 1] })
    }
  }, [arrived, flight])

  useEffect(() => {
    if (!onScreen) flight.jump(FLY_START)
  }, [onScreen, flight])

  return (
    <div ref={boxRef} className="ft-swoosh" aria-hidden="true">
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} preserveAspectRatio="none">
        <path d="M0 120Q900 128 1440 28V140H0Z" fill="var(--navy-deep)" />
      </svg>
      {reducedMotion ? <SwooshBand /> : <SwooshFlight flight={flight} boxRef={boxRef} />}
    </div>
  )
}

/** There is no mailing list service yet, so signing up prepares an email to the agency. */
function UpdatesForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    window.location.href = mailtoLink(
      'Flight deals and updates',
      `Hello,\n\nPlease add ${email.trim()} to your list for flight deals and updates.`,
    )
    setSent(true)
  }

  return (
    <div className="ft-updates">
      <h2 className="ft-label">Get updates</h2>
      <form className="ft-form" onSubmit={onSubmit}>
        <label htmlFor="footer-email" className="sr-only">
          Your email address
        </label>
        <input
          id="footer-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" className="find-btn ft-send">
          <span className="find-btn-shine" aria-hidden="true" />
          <span className="find-btn-label">Get updates</span>
          <span className="find-btn-icon" aria-hidden="true">
            <Plane className="plane plane-a" size={15} strokeWidth={2.25} />
            <Plane className="plane plane-b" size={15} strokeWidth={2.25} />
          </span>
        </button>
      </form>
      <p className="ft-note" role="status">
        {sent
          ? `Your email app should open with the request ready to send. If it does not, write to ${contact.email}.`
          : 'Flight deals and travel news, straight to your inbox.'}
      </p>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="ft">
      <Swoosh />

      <div className="ft-body">
        <motion.div
          className="ft-inner"
          variants={group}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="ft-grid">
            <motion.div variants={item} className="ft-brand">
              <a href="/" className="ft-logo" aria-label="Air Fantast home">
                <img src="/air-fantast-logo-white.svg" alt="Air Fantast" width={227} height={60} />
              </a>
            </motion.div>

            <motion.nav variants={item} className="ft-col" aria-labelledby="ft-nav-title">
              <h2 id="ft-nav-title" className="ft-label">
                Navigation
              </h2>
              <ul className="ft-links">
                {links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="ft-link">
                      {link.label}
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>

            <motion.div variants={item} className="ft-col">
              <h2 className="ft-label">Who we are</h2>
              <p className="ft-about">Your flight-ticket agency in Novi Sad</p>
            </motion.div>

            <motion.div variants={item} className="ft-col">
              <h2 className="ft-label">Get in touch</h2>
              <ul className="ft-contact">
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
                {contact.phone && (
                  <li>
                    <Phone size={18} aria-hidden="true" />
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
                  </li>
                )}
                {contact.whatsapp && (
                  <li>
                    <MessageCircle size={18} aria-hidden="true" />
                    <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </li>
                )}
                <li>
                  <MapPin size={18} aria-hidden="true" />
                  <span>
                    {contact.street}, {contact.city}
                  </span>
                </li>
              </ul>
              {contact.socials.length > 0 && (
                <ul className="ft-socials">
                  {contact.socials.map((social) => (
                    <li key={social.href}>
                      <a href={social.href} target="_blank" rel="noreferrer">
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>

          <motion.div variants={item} className="ft-bottom">
            <div className="ft-legal">
              <p>© {YEAR} • Air Fantast • Novi Sad, Serbia</p>
              <p className="ft-legal-links">
                {/* TODO: point these at the real pages once the agency has them. */}
                <a href="#">Privacy Policy</a>
                <span aria-hidden="true">•</span>
                <a href="#">Terms of Service</a>
              </p>
            </div>
            <UpdatesForm />
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
