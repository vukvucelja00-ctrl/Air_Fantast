import { ArrowRight } from 'lucide-react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { lazy, useRef, useState } from 'react'
import { useMediaQuery } from '../lib/useMediaQuery'
import { FlightOverlay } from './FlightOverlay'
import { OptionalChunk } from './OptionalChunk'
import './Hero.css'

// Three.js is by far the largest download, so the headline does not wait for it.
const EarthHorizon = lazy(() => import('./EarthHorizon'))

const easeOut = [0.16, 1, 0.3, 1] as const

type Word = { text: string; style?: 'brand' | 'soft' }

/** Two lines of the headline. `brand` words take the yellow gradient, `soft` words go light italic. */
const headline: Word[][] = [
  [{ text: 'Fly' }, { text: 'anywhere.', style: 'brand' }],
  [{ text: 'Feel', style: 'soft' }, { text: 'fantastic.' }],
]

/** Word-by-word blur-in, line after line. */
function Headline() {
  const reducedMotion = useReducedMotion()
  return (
    <h1 className="hero-title" aria-label={headline.flat().map((w) => w.text).join(' ')}>
      {headline.map((line, lineIndex) => (
        <span key={lineIndex} aria-hidden="true" className="hero-line">
          {line.map((word, wordIndex) => {
            const before = headline.slice(0, lineIndex).reduce((n, l) => n + l.length, 0)
            const delay = 0.55 + (before + wordIndex) * 0.12
            return (
              <motion.span
                key={word.text}
                className={`hero-word${word.style ? ` hero-word--${word.style}` : ''}`}
                initial={reducedMotion ? false : { opacity: 0, y: '0.35em', filter: 'blur(14px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, delay, ease: easeOut }}
              >
                {word.text}
              </motion.span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

/**
 * Opening scene: the headline over a turning Earth at sunrise.
 * Scrolling away lifts the headline in a blur and lets the planet sink.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const horizon = isDesktop ? 0.6 : 0.55
  const curvature = isDesktop ? 0.9 : 1.1
  const [paused, setPaused] = useState(false)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPaused(v > 0.98))

  const textY = useTransform(scrollYProgress, [0, 0.5], ['0vh', '-12vh'])
  const textScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.94])
  const textOpacity = useTransform(scrollYProgress, [0.04, 0.38], [1, 0])
  const textBlur = useTransform(scrollYProgress, [0.04, 0.38], ['blur(0px)', 'blur(14px)'])
  const earthY = useTransform(scrollYProgress, [0, 1], ['0vh', '22vh'])
  const earthScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  return (
    <section ref={ref} className="hero">
      <motion.div className="hero-earth" style={{ y: earthY, scale: earthScale }}>
        <OptionalChunk>
          <EarthHorizon
            colors={['#ffc20e', '#3d7bff']}
            backgroundColor="#000c22"
            horizon={horizon}
            curvature={curvature}
            parallax={0}
            sunPosition={0.12}
            spread={1.4}
            atmosphere={1.15}
            thickness={1.2}
            stars={0.7}
            airglow={0.7}
            clouds={0.6}
            bloom={0.7}
            grain={0.2}
            spin={0.7}
            longitude={30}
            axisTilt={32}
            oceanColor="#00265a"
            landColor="#1b4f98"
            cityColor="#ffc20e"
            cityLights={1.2}
            paused={paused}
            dpr={isDesktop ? 2 : 1.5}
          >
            <FlightOverlay horizon={horizon} curvature={curvature} />
          </EarthHorizon>
        </OptionalChunk>
      </motion.div>

      {/* Keep the top calm so the headline sits on clean space. */}
      <div className="hero-vignette" aria-hidden="true" />

      <motion.div
        className="hero-content"
        style={{ y: textY, scale: textScale, opacity: textOpacity, filter: textBlur }}
      >
        <motion.a
          href="#routes"
          className="hero-badge"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: easeOut }}
        >
          <span className="hero-badge-dot" aria-hidden="true">
            <span />
          </span>
          Flights to anywhere in the world
          <ArrowRight size={14} className="hero-badge-arrow" aria-hidden="true" />
        </motion.a>

        <Headline />
      </motion.div>

      <div className="hero-fade" aria-hidden="true" />
    </section>
  )
}
