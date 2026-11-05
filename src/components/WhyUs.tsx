import { Headset, LifeBuoy, MapPin, ReceiptText, Route, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { PointerEvent } from 'react'
import { contact } from '../lib/contact'
import './WhyUs.css'

type Reason = { icon: LucideIcon; title: string; text: string }

const lead: Reason = {
  icon: Headset,
  title: 'A real person on your booking',
  text: 'Talk to an agent who knows your trip by name, not a chatbot or a call centre queue. From the first search to the day you land, you know exactly who to ask.',
}

const reasons: Reason[] = [
  {
    icon: Route,
    title: 'We compare for you',
    text: 'Tell us where you want to go and we find the routes and fares that suit your trip.',
  },
  {
    icon: ReceiptText,
    title: 'Clear prices',
    text: 'Taxes, baggage and fare rules explained before you pay, with no surprises at the airport.',
  },
  {
    icon: LifeBuoy,
    title: 'Help when plans change',
    text: 'Refunds, new dates and name corrections are handled by us, so you are never left alone with an airline.',
  },
  {
    icon: MapPin,
    title: 'A local office',
    text: `A registered agency you can visit in person, at ${contact.street} in Novi Sad.`,
  },
]

const ease = [0.22, 1, 0.36, 1] as const

/** Lets the card's glow follow the pointer. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--why-x', `${event.clientX - box.left}px`)
  event.currentTarget.style.setProperty('--why-y', `${event.clientY - box.top}px`)
}

export function WhyUs() {
  const reducedMotion = useReducedMotion()
  const reveal = (index: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.8, delay: index * 0.07, ease },
  })

  return (
    <section id="about" className="why" aria-labelledby="why-title">
      <motion.header className="why-head" {...reveal(0)}>
        <p className="section-eyebrow">Why Air Fantast</p>
        <h2 id="why-title" className="section-title">
          More than a ticket
        </h2>
        <p className="section-text">Booking with us means someone is looking after your trip, not just selling you a seat.</p>
      </motion.header>

      <div className="why-grid">
        <motion.article className="why-lead" {...reveal(1)}>
          <span className="why-lead-icon">
            <lead.icon size={30} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="why-lead-copy">
            <h3>{lead.title}</h3>
            <p>{lead.text}</p>
          </div>
        </motion.article>

        {reasons.map(({ icon: Icon, title, text }, index) => (
          <motion.article key={title} className="why-card" onPointerMove={trackPointer} {...reveal(index + 2)}>
            <span className="why-card-icon">
              <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
