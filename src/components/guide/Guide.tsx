import { ArrowUp, X } from 'lucide-react'
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
  type AnimationPlaybackControls,
} from 'motion/react'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { everyBeat } from '../../lib/beats'
import { guide, respond, type GuideNode, type GuideOption } from '../../lib/guide'
import { openHelpTopic } from '../../lib/helpBridge'
import { scrollToElement } from '../../lib/scroll'
import { requestRoute } from '../../lib/searchBridge'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { Eagle, type EagleMood } from './Eagle'
import './Guide.css'

/*
 * The site guide. A few seconds after the page opens, the eagle flies in from the left,
 * seen from the side and flapping, heads down to the bottom-right corner, flares its wings
 * with its feet out and lands, then turns to ask if they need a hand. After that it waits
 * there, one click from the chat.
 */

const QUESTION = 'Need help finding a flight?'
const LANDED_KEY = 'air-fantast-guide-landed'
/** Takes off this long after the page starts loading, wherever the visitor is on the page. */
const TAKE_OFF_MS = 3000
const FLIGHT_SECONDS = 4.2
const TYPING_MS = 800
const BUBBLE_STAYS_MS = 14000
const ease = [0.22, 1, 0.36, 1] as const

type Phase = 'waiting' | 'flying' | 'landing' | 'greeting' | 'resting'
type Wings = 'flying' | 'flaring'
type Message = { id: string; role: 'assistant' | 'user'; text: string }
type Path = { x: number[]; y: number[]; rotate: number[]; scale: number[] }

/** Share of the flight after which it brakes: wings up, feet out. */
const FLARE_AT = 0.84

/*
 * In from beyond the left edge, a little climb, then a long descent into the corner.
 * Across the screen it slows down the whole way, like a bird coming in to land. In profile,
 * a positive angle points the beak down: nose down on the descent, nose up for the flare.
 */
function flightPath(): Path {
  const w = window.innerWidth
  const h = window.innerHeight
  return {
    x: [-(w + 80), 0],
    y: [-h * 0.58, -h * 0.63, -h * 0.28, -24, 0],
    rotate: [-4, -3, 7, -16, 0],
    scale: [0.72, 1],
  }
}

const FLIGHT_TRANSITION = {
  duration: FLIGHT_SECONDS,
  x: { duration: FLIGHT_SECONDS, ease: [0.3, 0.05, 0.45, 1] },
  y: { duration: FLIGHT_SECONDS, times: [0, 0.2, 0.62, 0.9, 1], ease: ['easeOut', 'easeInOut', 'easeOut', 'easeIn'] },
  rotate: { duration: FLIGHT_SECONDS, times: [0, 0.2, 0.6, 0.9, 1], ease: 'easeInOut' },
  scale: { duration: FLIGHT_SECONDS, ease: 'easeOut' },
} as const

/** Keeps a scrolling box eased down to its newest content. Returns a function that stops it. */
function followContent(box: HTMLElement, inner: HTMLElement, instant: boolean): () => void {
  let controls: AnimationPlaybackControls | undefined
  const observer = new ResizeObserver(() => {
    const target = box.scrollHeight - box.clientHeight
    if (target <= box.scrollTop + 1) return
    controls?.stop()
    if (instant) box.scrollTop = target
    else controls = animate(box.scrollTop, target, { duration: 0.6, ease, onUpdate: (v) => (box.scrollTop = v) })
  })
  observer.observe(inner)
  return () => {
    observer.disconnect()
    controls?.stop()
  }
}

function alreadyLanded(): boolean {
  try {
    return sessionStorage.getItem(LANDED_KEY) === '1'
  } catch {
    return false
  }
}

function rememberLanded(): void {
  try {
    sessionStorage.setItem(LANDED_KEY, '1')
  } catch {
    // Blocked storage: it just flies in again on the next load.
  }
}

/** Types the greeting out one letter at a time. */
function Typed({ text, onDone }: { text: string; onDone: () => void }): ReactNode {
  const [count, setCount] = useState(0)
  const done = useRef(onDone)

  useEffect(() => {
    done.current = onDone
  }, [onDone])

  useEffect(
    () =>
      everyBeat(50, text.length, (beat) => {
        setCount(beat)
        if (beat >= text.length) done.current()
      }),
    [text],
  )

  return (
    <>
      {text.slice(0, count)}
      {count < text.length && <span className="guide-caret" aria-hidden="true" />}
    </>
  )
}

export default function Guide(): ReactNode {
  const reducedMotion = useReducedMotion()
  const roomy = useMediaQuery('(min-width: 640px)')
  const [phase, setPhase] = useState<Phase>(() => (alreadyLanded() ? 'resting' : 'waiting'))
  const [wings, setWings] = useState<Wings>('flying')
  const [path, setPath] = useState<Path | null>(null)
  const [open, setOpen] = useState(false)
  const [cheer, setCheer] = useState(false)
  const [asked, setAsked] = useState(false)

  // ---------- when to fly in ----------
  useEffect(() => {
    if (phase !== 'waiting') return
    const start = () => {
      rememberLanded()
      if (reducedMotion) {
        setPhase('greeting')
        return
      }
      setPath(flightPath())
      setWings('flying')
      setPhase('flying')
    }
    // Counted from the start of the page load, since this part of the page loads separately.
    const timer = window.setTimeout(start, Math.max(0, TAKE_OFF_MS - performance.now()))
    return () => window.clearTimeout(timer)
  }, [phase, reducedMotion])

  // Flaps the whole way, then raises its wings and puts its feet out to brake.
  useEffect(() => {
    if (phase !== 'flying') return
    const flare = window.setTimeout(() => setWings('flaring'), FLIGHT_SECONDS * 1000 * FLARE_AT)
    return () => window.clearTimeout(flare)
  }, [phase])

  useEffect(() => {
    if (phase !== 'greeting') return
    const fade = window.setTimeout(() => setPhase('resting'), BUBBLE_STAYS_MS)
    return () => window.clearTimeout(fade)
  }, [phase])

  useEffect(() => {
    if (!cheer) return
    const timer = window.setTimeout(() => setCheer(false), 1300)
    return () => window.clearTimeout(timer)
  }, [cheer])

  // ---------- the chat ----------
  const [messages, setMessages] = useState<Message[]>([])
  const [options, setOptions] = useState<{ key: string; list: GuideOption[] } | null>(null)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const nextId = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const scroller = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const newId = () => `guide-${(nextId.current += 1)}`

  const say = useCallback((reply: GuideNode) => {
    setOptions(null)
    setTyping(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const id = `guide-${(nextId.current += 1)}`
      setTyping(false)
      setMessages((list) => [...list, { id, role: 'assistant', text: reply.text }])
      setOptions({ key: id, list: reply.options })
    }, TYPING_MS)
  }, [])

  function openChat(): void {
    setPhase('resting')
    setOpen(true)
    setCheer(true)
    if (!asked) {
      setAsked(true)
      say(guide.start)
    }
  }

  function send(event: FormEvent): void {
    event.preventDefault()
    const text = draft.trim()
    if (!text || typing) return
    setDraft('')
    setMessages((list) => [...list, { id: newId(), role: 'user', text }])
    say(respond(text))
  }

  function choose(option: GuideOption): void {
    if (option.next) {
      setMessages((list) => [...list, { id: newId(), role: 'user', text: option.label }])
      say(guide[option.next])
      return
    }
    if (option.href) {
      window.location.href = option.href
      return
    }
    // Steps aside so it does not cover what it just showed; the conversation is kept for next time.
    setOpen(false)
    if (option.route) {
      requestRoute(option.route)
      return
    }
    if (option.help) openHelpTopic(option.help)
    const id = option.help ? 'contact' : option.section
    const target = id ? document.getElementById(id) : null
    if (target) scrollToElement(target)
  }

  // The chat eases after its content as that grows.
  useEffect(() => {
    if (!open || !scroller.current || !content.current) return
    return followContent(scroller.current, content.current, Boolean(reducedMotion))
  }, [open, reducedMotion])

  // Escape closes the chat; opening it puts the cursor in the field on larger screens.
  useEffect(() => {
    if (!open) return
    if (window.matchMedia('(pointer: fine)').matches) input.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (phase === 'waiting') return null

  const inAir = phase === 'flying'
  const mood: EagleMood = inAir
    ? wings
    : typing
      ? 'typing'
      : phase === 'greeting'
        ? 'waving'
        : cheer
          ? 'happy'
          : 'idle'

  return (
    <div className="guide">
      {/* ---------- chat ---------- */}
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Air Fantast guide"
            className="guide-chat"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease }}
          >
            <header className="guide-head">
              <span className="guide-avatar">
                <Eagle head pixel={2} mood={typing ? 'typing' : 'idle'} />
              </span>
              <span className="guide-title">
                <strong>Air Fantast guide</strong>
                <span>{typing ? 'Typing…' : 'Here to help you fly'}</span>
              </span>
              <button type="button" className="guide-close" onClick={() => setOpen(false)} aria-label="Close guide">
                <X size={17} aria-hidden="true" />
              </button>
            </header>

            <div ref={scroller} className="guide-scroll" data-lenis-prevent>
              <div ref={content} role="log" aria-live="polite" className="guide-log">
                {messages.map((message) => (
                  <motion.p
                    key={message.id}
                    className={`guide-msg guide-msg--${message.role}`}
                    initial={reducedMotion ? false : message.role === 'user' ? { opacity: 0, x: 24, scale: 0.94 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease }}
                  >
                    {message.text}
                  </motion.p>
                ))}
                {typing && (
                  <motion.div
                    className="guide-typing"
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    aria-label="The guide is typing"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={reducedMotion ? undefined : { y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.div>
                )}
                <AnimatePresence initial={false}>
                  {options && (
                    <motion.div
                      key={options.key}
                      className="guide-options"
                      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.45, ease }}
                    >
                      <div className="guide-options-inner">
                        {options.list.map((option, i) => (
                          <motion.button
                            key={option.label}
                            type="button"
                            className={`guide-option${option.next ? '' : ' guide-option--go'}`}
                            onClick={() => choose(option)}
                            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease, delay: 0.08 + i * 0.06 }}
                            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <form className="guide-form" onSubmit={send}>
              <input
                ref={input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                aria-label="Ask the guide"
                placeholder="Ask me something, like “Paris”"
                autoComplete="off"
              />
              <button type="submit" aria-label="Send" disabled={!draft.trim() || typing}>
                <ArrowUp size={17} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---------- greeting ---------- */}
      <AnimatePresence>
        {phase === 'greeting' && !open && (
          <Greeting reducedMotion={reducedMotion} onYes={openChat} onNo={() => setPhase('resting')} />
        )}
      </AnimatePresence>

      {/* ---------- the eagle ---------- */}
      <div className="guide-perch">
        {phase === 'landing' && !reducedMotion && <Feathers />}
        <motion.button
          type="button"
          className={`guide-eagle${inAir ? ' is-flying' : ''}`}
          initial={inAir && path ? { x: path.x[0], y: path.y[0], rotate: path.rotate[0], scale: path.scale[0] } : false}
          animate={
            inAir && path
              ? { x: path.x, y: path.y, rotate: path.rotate, scale: path.scale }
              : phase === 'landing'
                ? { x: 0, y: [0, 0, -5, 0], rotate: 0, scale: 1, scaleX: [1, 1.16, 0.95, 1], scaleY: [1, 0.82, 1.06, 1] }
                : { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 }
          }
          transition={
            inAir
              ? FLIGHT_TRANSITION
              : phase === 'landing'
                ? { duration: 0.6, times: [0, 0.3, 0.65, 1], ease: 'easeOut' }
                : { duration: 0.2 }
          }
          onAnimationComplete={() => {
            if (phase === 'flying') setPhase('landing')
            else if (phase === 'landing') setPhase('greeting')
          }}
          onClick={() => (open ? setOpen(false) : openChat())}
          aria-label={open ? 'Close guide' : 'Open guide'}
          aria-expanded={open}
          whileHover={phase === 'resting' && !reducedMotion ? { y: -4, scale: 1.05 } : undefined}
          whileTap={phase === 'resting' && !reducedMotion ? { scale: 0.93 } : undefined}
        >
          <Eagle mood={mood} pixel={roomy ? 4 : 3} />
        </motion.button>
      </div>
    </div>
  )
}

function Greeting({
  reducedMotion,
  onYes,
  onNo,
}: {
  reducedMotion: boolean | null
  onYes: () => void
  onNo: () => void
}): ReactNode {
  const [typed, setTyped] = useState(false)
  const finish = useCallback(() => setTyped(true), [])
  return (
    <motion.div
      className="guide-bubble"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <p className="guide-bubble-text">{reducedMotion ? QUESTION : <Typed text={QUESTION} onDone={finish} />}</p>
      <AnimatePresence initial={false}>
        {(typed || reducedMotion) && (
          <motion.div
            className="guide-bubble-actions"
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, ease }}
          >
            <div>
              <button type="button" className="guide-yes" onClick={onYes}>
                Yes, please
              </button>
              <button type="button" className="guide-no" onClick={onNo}>
                Not now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** Feathers shaken loose on landing, drifting out and down. */
function Feathers(): ReactNode {
  const pieces = [
    { x: -46, y: -34, c: '#ffffff', s: 6 },
    { x: -30, y: -50, c: '#a46a36', s: 5 },
    { x: -58, y: -14, c: '#7b4c28', s: 4 },
    { x: 46, y: -34, c: '#ffffff', s: 6 },
    { x: 30, y: -50, c: '#a46a36', s: 5 },
    { x: 58, y: -14, c: '#7b4c28', s: 4 },
  ]
  return (
    <span aria-hidden="true" className="guide-feathers">
      {pieces.map((piece, i) => (
        <motion.span
          key={i}
          style={{ width: piece.s, height: piece.s, background: piece.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: piece.x, y: [0, piece.y, piece.y + 26], opacity: [1, 1, 0], rotate: piece.x > 0 ? 90 : -90 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      ))}
    </span>
  )
}
