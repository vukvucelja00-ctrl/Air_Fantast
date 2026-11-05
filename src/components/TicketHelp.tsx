import {
  ArrowRight,
  Banknote,
  Check,
  ClipboardList,
  Copy,
  FileSearch,
  Hash,
  Headset,
  MailCheck,
  MapPin,
  MessageCircle,
  PencilLine,
  Phone,
  Plane,
  ReceiptText,
  Repeat2,
  RotateCcw,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { contact, mailtoLink } from '../lib/contact'
import './TicketHelp.css'

type TopicId = 'refund' | 'change' | 'contact'
type Step = { icon: LucideIcon; title: string; text: string }
type Topic = {
  id: TopicId
  icon: LucideIcon
  title: string
  text: string
  action: string
  subject: string
  body: string
  steps?: Step[]
}

const bookingDetails = 'Booking reference (PNR):\nPassenger surname:\n\n'

/** Only the channels the agency has filled in, so the card never promises one that is missing. */
const channelSummary = `${[contact.phone && 'Phone', contact.phone ? 'email' : 'Email', contact.whatsapp && 'WhatsApp']
  .filter(Boolean)
  .join(', ')} or our office`

const topics: Topic[] = [
  {
    id: 'refund',
    icon: RotateCcw,
    title: 'Request a refund',
    text: 'Get your money back for a ticket you bought',
    action: 'Send request',
    subject: 'Refund request',
    body: bookingDetails,
    steps: [
      { icon: Hash, title: 'Booking reference', text: 'Send us your PNR code and the passenger’s surname.' },
      { icon: FileSearch, title: 'Fare check', text: 'An agent checks the fare rules and refund fees.' },
      { icon: MailCheck, title: 'Your offer', text: 'You receive the exact refund amount by email.' },
      { icon: Banknote, title: 'Payout', text: 'The money goes back to your card or bank account.' },
    ],
  },
  {
    id: 'change',
    icon: Repeat2,
    title: 'Change a ticket',
    text: 'Travel date, passenger name or route',
    action: 'Send request',
    subject: 'Ticket change request',
    body: `${bookingDetails}What I would like to change:\n`,
    steps: [
      { icon: Hash, title: 'Booking reference', text: 'Send us your PNR code and the passenger’s surname.' },
      { icon: PencilLine, title: 'Your change', text: 'Tell us the new date, the corrected name or the new route.' },
      { icon: ReceiptText, title: 'Options and price', text: 'An agent sends the options and any difference in price.' },
      { icon: TicketCheck, title: 'New ticket', text: 'Once you confirm, your updated ticket arrives by email.' },
    ],
  },
  {
    id: 'contact',
    icon: Headset,
    title: 'Talk to an agent',
    text: channelSummary,
    action: 'Write to us',
    subject: 'Question about my booking',
    body: bookingDetails,
  },
]

const ease = [0.22, 1, 0.36, 1] as const

const CONTACT_HASH = '#contact'

function Steps({ steps }: { steps: Step[] }) {
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref} className="th-journey">
      {/* A plane flies the route as the steps appear. */}
      <div className="th-track" aria-hidden="true">
        <motion.span
          className="th-track-fill"
          initial={{ width: reducedMotion ? '100%' : '0%' }}
          animate={{ width: inView ? '100%' : reducedMotion ? '100%' : '0%' }}
          transition={{ duration: 1.5, ease: [0.45, 0, 0.2, 1] }}
        >
          <span className="th-track-plane">
            <Plane size={16} strokeWidth={2.25} />
          </span>
        </motion.span>
      </div>

      <ol className="th-steps">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <motion.li
            key={title}
            className="th-step"
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.12 + index * 0.16, ease }}
          >
            <span className="th-step-icon">
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className="th-step-count">
              Step {index + 1} of {steps.length}
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

function Channels() {
  const channels: { icon: LucideIcon; title: string; text: string; href?: string }[] = [
    ...(contact.phone
      ? [{ icon: Phone, title: 'Call us', text: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` }]
      : []),
    ...(contact.whatsapp
      ? [
          {
            icon: MessageCircle,
            title: 'WhatsApp',
            text: contact.whatsapp,
            href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`,
          },
        ]
      : []),
    { icon: MapPin, title: 'Visit our office', text: `${contact.street}, ${contact.city}` },
    {
      icon: ClipboardList,
      title: 'Have this ready',
      text: 'Your PNR code and the passenger’s surname help an agent find your ticket straight away.',
    },
  ]

  return (
    <ul className="th-channels">
      {channels.map(({ icon: Icon, title, text, href }, index) => (
        <motion.li
          key={title}
          className="th-channel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.08, ease }}
        >
          <span className="th-step-icon">
            <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <span>
            <h3>{title}</h3>
            {href ? (
              <a href={href} className="th-channel-link">
                {text}
              </a>
            ) : (
              <p>{text}</p>
            )}
          </span>
        </motion.li>
      ))}
    </ul>
  )
}

function CopyEmail() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let next: 'copied' | 'failed' = 'copied'
    try {
      await navigator.clipboard.writeText(contact.email)
    } catch {
      next = 'failed'
    }
    setState(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Could not copy' : 'Copy'

  return (
    <button type="button" className={`th-copy${state === 'copied' ? ' is-done' : ''}`} onClick={copy}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="th-copy-inner"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.22, ease }}
        >
          {state === 'copied' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {label}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function TicketHelp() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState<TopicId>(() =>
    window.location.hash === CONTACT_HASH ? 'contact' : 'refund',
  )
  const tabs = useRef<Partial<Record<TopicId, HTMLButtonElement | null>>>({})
  const topic = topics.find((item) => item.id === active) ?? topics[0]

  // The header's Contact link lands here with the agent tab open.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === CONTACT_HASH) setActive('contact')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !back) return
    event.preventDefault()
    const next = topics[(index + (forward ? 1 : -1) + topics.length) % topics.length]
    setActive(next.id)
    tabs.current[next.id]?.focus()
  }

  const reveal = (index: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.8, delay: index * 0.07, ease },
  })

  return (
    <section id="contact" className="th" aria-labelledby="th-title">
      <motion.header className="th-head" {...reveal(0)}>
        <p className="section-eyebrow">Already have a ticket?</p>
        <h2 id="th-title" className="section-title">
          Sort it all out in one place
        </h2>
        <p className="section-text">Choose what you need and see straight away how it works.</p>
      </motion.header>

      <motion.div className="th-tabs" role="tablist" aria-label="Ticket help" {...reveal(1)}>
        {topics.map(({ id, icon: Icon, title, text }, index) => {
          const selected = id === active
          return (
            <button
              key={id}
              ref={(element) => {
                tabs.current[id] = element
              }}
              type="button"
              role="tab"
              id={`th-tab-${id}`}
              aria-selected={selected}
              aria-controls="th-panel"
              tabIndex={selected ? 0 : -1}
              className={`th-tab${selected ? ' is-active' : ''}`}
              onClick={() => setActive(id)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {selected && (
                <motion.span layoutId="th-tab-thumb" className="th-tab-thumb" transition={{ duration: 0.45, ease }} />
              )}
              <span className="th-tab-icon">
                <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="th-tab-copy">
                <span className="th-tab-title">{title}</span>
                <span className="th-tab-text">{text}</span>
              </span>
              <ArrowRight className="th-tab-arrow" size={18} aria-hidden="true" />
            </button>
          )
        })}
      </motion.div>

      <motion.div
        id="th-panel"
        role="tabpanel"
        aria-labelledby={`th-tab-${active}`}
        className="th-panel"
        {...reveal(2)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            className="th-panel-body"
            initial={reducedMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
            transition={{ duration: 0.28, ease }}
          >
            {topic.steps ? <Steps steps={topic.steps} /> : <Channels />}
          </motion.div>
        </AnimatePresence>

        <div className="th-action">
          <div className="th-action-email">
            <span className="th-action-label">Send your request to</span>
            <span className="th-action-row">
              <a href={`mailto:${contact.email}`} className="th-email">
                {contact.email}
              </a>
              <CopyEmail />
            </span>
          </div>

          {/* Shares the shine and plane take-off of the other yellow buttons. */}
          <a href={mailtoLink(topic.subject, topic.body)} className="find-btn th-send">
            <span className="find-btn-shine" aria-hidden="true" />
            <span className="find-btn-label">{topic.action}</span>
            <span className="find-btn-icon" aria-hidden="true">
              <Plane className="plane plane-a" size={15} strokeWidth={2.25} />
              <Plane className="plane plane-b" size={15} strokeWidth={2.25} />
            </span>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
