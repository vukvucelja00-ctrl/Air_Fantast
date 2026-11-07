import { airports, type Airport } from './airports'
import { contact } from './contact'
import type { HelpTopic } from './helpBridge'
import { KIND_LABEL, ORIGINS, routes, type OriginCode } from './routes'

/*
 * What the eagle can say for now: a small tree of answers, written from the same data the
 * page uses, plus direct-flight answers for any city in the route list. A live assistant
 * can replace this later and keep the same actions.
 */

export type GuideOption = {
  label: string
  /** Next answer in the tree. */
  next?: string
  /** A section of the page, by id. */
  section?: string
  /** A tab of the "Already have a ticket?" section. */
  help?: HelpTopic
  /** Fills in the flight search. */
  route?: { from: string; to: string }
  /** An outside link, such as an email address. */
  href?: string
}

export type GuideNode = { text: string; options: GuideOption[] }

/** Lower case without accents, so "Beč", "Bec" and "BEC" all match. */
const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Whether the text has a word starting with `word`, so "letovi" counts for "let". */
const startsWord = (input: string, word: string) => new RegExp(`(^|[^\\p{L}])${escape(word)}`, 'u').test(input)

/* Words a typed question can point to an answer with, in English and Serbian, without accents. */
const KEYWORDS: [string, string[]][] = [
  ['ticket', ['refund', 'cancel', 'change my', 'reschedul', 'my ticket', 'my booking', 'reservation', 'povrat', 'otkaz', 'izmen', 'promen', 'rezervacij', 'imam kart', 'moja kart', 'moju kart']],
  ['cost', ['price', 'cost', 'fare', 'cheap', 'how much', 'cen', 'kost', 'koliko', 'jeftin', 'para']],
  ['human', ['agent', 'person', 'human', 'talk', 'contact', 'email', 'mail', 'call', 'phone', 'office', 'address', 'kontakt', 'covek', 'poziv', 'telefon', 'adres', 'kancelarij', 'razgovar', 'pozovi']],
  ['routes', ['direct', 'destination', 'route', 'map', 'where can', 'direkt', 'destinacij', 'ruta', 'mapa', 'gde mog', 'kuda']],
  ['about', ['why', 'about', 'who are', 'agency', 'zasto', 'o vama', 'ko ste', 'agencij']],
  ['search', ['flight', 'fly', 'book', 'search', 'ticket', 'let', 'kart', 'putuj', 'avion', 'pretrag']],
  ['start', ['hi', 'hello', 'hey', 'help', 'zdravo', 'cao', 'pomoc', 'pozdrav', 'dobar dan']],
]

const BACK: GuideOption = { label: 'Something else', next: 'start' }
const MAP: GuideOption = { label: 'Show the route map', section: 'routes' }
const SEARCH: GuideOption = { label: 'Open flight search', section: 'flight-search' }

const TOPICS: GuideOption[] = [
  { label: 'Find a flight', next: 'search' },
  { label: 'Where can I fly direct?', next: 'routes' },
  { label: 'I already have a ticket', next: 'ticket' },
  { label: 'Talk to an agent', next: 'human' },
]

const routeCount = (origin: OriginCode) => routes.filter((route) => route.origin === origin).length
const destinationCount = new Set(routes.map((route) => route.destination.code)).size

const phoneLine = contact.phone ? `, call ${contact.phone}` : ''

export const guide: Record<string, GuideNode> = {
  start: {
    text: 'Hi, I’m the Air Fantast eagle. I can help you find a flight or sort out a ticket you already have. What do you need?',
    options: TOPICS,
  },
  unknown: {
    text: 'I’m still learning, so I can’t answer that one yet. Try one of these, or ask one of our agents.',
    options: TOPICS,
  },
  search: {
    text: 'Tell me a city and I’ll check for direct flights from Serbia, or open the search and pick your dates.',
    options: [SEARCH, MAP, BACK],
  },
  routes: {
    text: `There are direct flights from Serbia to ${destinationCount} destinations: ${routeCount('BEG')} routes from Belgrade, ${routeCount('INI')} from Niš and ${routeCount('KVO')} from Kraljevo. Type a city and I’ll check it for you.`,
    options: [MAP, BACK],
  },
  ticket: {
    text: 'No problem. I can show you how to get a refund or change your ticket, or put you in touch with an agent.',
    options: [
      { label: 'Get a refund', help: 'refund' },
      { label: 'Change my ticket', help: 'change' },
      { label: 'Talk to an agent', next: 'human' },
    ],
  },
  cost: {
    text: 'Fares change with the date and the seats left, so I can’t quote one here. Pick your dates in the search, or ask an agent for an exact price.',
    options: [
      SEARCH,
      { label: 'Ask for a price', href: `mailto:${contact.email}?subject=${encodeURIComponent('Fare quote')}` },
      BACK,
    ],
  },
  human: {
    text: `Of course. Write to ${contact.email}${phoneLine}, or visit our office at ${contact.street}, ${contact.city}.`,
    options: [
      { label: 'Email us', href: `mailto:${contact.email}` },
      { label: 'Show contact details', help: 'contact' },
      BACK,
    ],
  },
  about: {
    text: 'Air Fantast is a flight-ticket agency from Novi Sad, with tickets to anywhere in the world. Here’s why people book with us.',
    options: [{ label: 'Why book with us', section: 'about' }, BACK],
  },
}

/* ---------- Cities ---------- */

const SERBIAN = new Set<string>(Object.keys(ORIGINS))
const ORIGIN_ORDER: OriginCode[] = ['BEG', 'INI', 'KVO']

/** Every name an airport can be typed by, longest first so "Banja Luka" wins over shorter names. */
const places = airports
  .flatMap((airport) =>
    [...airport.city.split('/'), ...(airport.aliases ?? [])].map((name) => ({ name: plain(name.trim()), airport })),
  )
  .filter((place) => place.name.length >= 3)
  .sort((a, b) => b.name.length - a.name.length)

/* City names that are also everyday English words count only when written with a capital. */
const EVERYDAY_WORDS = new Set(['nice', 'split'])

function findPlace(input: string, raw: string): Airport | null {
  const found = places
    .filter((place) =>
      EVERYDAY_WORDS.has(place.name)
        ? new RegExp(`(^|[^\\p{L}])${place.airport.city}([^\\p{L}]|$)`, 'u').test(raw)
        : startsWord(input, place.name),
    )
    .map((place) => place.airport)
  // "From Novi Sad to Rome": the destination is the place outside Serbia.
  return found.find((airport) => !SERBIAN.has(airport.code)) ?? found[0] ?? null
}

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

function fromSerbia(origin: OriginCode): GuideNode {
  const served = routes.filter((route) => route.origin === origin)
  const examples = served.slice(0, 5).map((route) => route.destination.city)
  return {
    text: `From ${ORIGINS[origin].city} there are direct flights to ${served.length} destinations, including ${list(examples)}. Tell me where you’d like to go.`,
    options: [MAP, BACK],
  }
}

function toPlace(airport: Airport): GuideNode {
  const direct = routes
    .filter((route) => route.destination.code === airport.code)
    .sort((a, b) => ORIGIN_ORDER.indexOf(a.origin) - ORIGIN_ORDER.indexOf(b.origin))

  if (direct.length === 0) {
    return {
      text: `I don’t see a direct flight from Serbia to ${airport.city} in our route list, but we can still get you there with a connection.`,
      options: [
        { label: `Search Belgrade → ${airport.city}`, route: { from: 'BEG', to: airport.code } },
        { label: 'Ask an agent', next: 'human' },
        BACK,
      ],
    }
  }

  const ways = direct.map((route) => {
    const kind = route.kind === 'scheduled' ? '' : ` (${KIND_LABEL[route.kind].toLowerCase()})`
    return `from ${ORIGINS[route.origin].city} with ${list(route.airlines)}${kind}`
  })
  const first = direct[0]
  return {
    text: `Yes, you can fly direct to ${airport.city}: ${list(ways)}.`,
    options: [
      { label: `Search ${ORIGINS[first.origin].city} → ${airport.city}`, route: { from: first.origin, to: airport.code } },
      MAP,
      BACK,
    ],
  }
}

/** The answer to a typed message. A city comes first, since "flights to Paris" also says "flights". */
export function respond(text: string): GuideNode {
  const input = plain(text)
  const place = findPlace(input, text)
  if (place) return SERBIAN.has(place.code) && place.code in ORIGINS ? fromSerbia(place.code as OriginCode) : toPlace(place)
  for (const [node, words] of KEYWORDS) {
    if (words.some((word) => startsWord(input, word))) return guide[node]
  }
  return guide.unknown
}
