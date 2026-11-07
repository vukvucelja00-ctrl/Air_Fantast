import { motion, useReducedMotion, type TargetAndTransition, type Transition } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { everyBeat } from '../../lib/beats'

/*
 * The guide's mascot: a bald eagle drawn on a pixel grid, so it stays crisp at any
 * whole-number size. Its pupils follow the pointer, it blinks, and its wings have
 * three flight poses that the flying moods cycle through.
 */

export type EagleMood = 'idle' | 'typing' | 'happy' | 'waving' | 'flying' | 'gliding' | 'flaring'

const PALETTE: Record<string, string> = {
  W: '#ffffff', // head
  w: '#cfd9e8', // head in shadow
  D: '#3a2314', // darkest feathers, outlines
  B: '#5f3a1f', // body
  b: '#7b4c28', // lighter feathers
  h: '#a46a36', // wing highlights
  Y: '#ffc20e', // beak and feet
  y: '#d99a00', // beak in shadow
  T: '#ffc20e', // toes
  K: '#1d130b', // claws, and the pupil in profile
  g: '#3d4760', // brow in profile
  I: '#ffd84a', // iris in profile
}

const IRIS = '#ffd84a'
const PUPIL = '#0b0d14'
const BROW = '#3d4760'

const COLS = 20
const ROWS = 24

/* Perched, seen from the front, wings folded. */
const BODY = [
  '......WWWWWWWW......',
  '....WWWWWWWWWWWW....',
  '...WWWWWWWWWWWWWW...',
  '..WWWWWWWWWWWWWWWW..',
  '..WWWWWWWWWWWWWWWW..',
  '..WWWWWWWWWWWWWWWW..',
  '..WWWWWWWYYWWWWWWW..',
  '..wWWWWWYYYYWWWWWw..',
  '..wwWWWYYYYYYWWWww..',
  '...wwWWYYYYYYWWww...',
  '.DD.wwWWyYYyWWww.DD.',
  'DBBD.wwWWyyWWww.DBBD',
  'DBhBD.wwwwwwww.DBhBD',
  'DBhbBDDwwwwwwDDBbhBD',
  'DBhbBBBDwwwwDBBBbhBD',
  'DBhbBbBBDBBDBBbBbhBD',
  'DBhbBBbBBBBBBbBBbhBD',
  'DBhbBBBbBBBBbBBBbhBD',
  '.DhbBBBBbBBbBBBBbhD.',
  '.DhbBBBBBBBBBBBBbhD.',
  '..DhDBBBBBBBBBBDhD..',
  '..DD.DBBD..DBBD.DD..',
  '....TTyTT..TTyTT....',
  '....K.K.K..K.K.K....',
]

/* The left wing in each pose, drawn just left of the body; the right wing mirrors it. */
type Pose = 'up' | 'mid' | 'down'
const WINGS: Record<Pose, { top: number; rows: string[] }> = {
  up: {
    top: 0,
    rows: [
      'D.D...........',
      'DhDh..........',
      'DBBhh.........',
      '.DBBBhh.......',
      '.DBbBBBh......',
      '..DBBbBBh.....',
      '..DBbBBbBh....',
      '...DBBbBBBhh..',
      '...DDBBBbBBBhh',
      '....DBDBBBBBBB',
      '.....DDBBBBBBB',
      '.......DDBBBBB',
      '.........DDBBB',
    ],
  },
  mid: {
    top: 10,
    rows: [
      '.........hhhhh',
      '.....hhhhBBBBB',
      '..hhhBBBBbBBBB',
      '.hBBBbBBbBBBBB',
      'hBbBbBbBbBbBBB',
      'DBDBDBDBDBDBBB',
      'D.D.DBDBDBDBDD',
      '..D.D.D.D.D...',
    ],
  },
  down: {
    top: 11,
    rows: [
      '.........hhBBB',
      '.......hhBBBBB',
      '.....hhBBBBBBB',
      '....hBBBbBBBDD',
      '...hBBbBBBDD..',
      '...DBbBBDD....',
      '..DBBbBD......',
      '..DBbBD.......',
      '.DBBbD........',
      '.DBBD.........',
      'DhD...........',
      'D.D...........',
    ],
  },
}

const FLAP: Pose[] = ['up', 'mid', 'down', 'mid']

/*
 * In flight the eagle is seen from the side, heading right: white tail, brown body, white head,
 * hooked beak. Only the near wing is drawn, in front of the body. Frame: 34×26 cells.
 */
const SIDE_W = 34
const SIDE_BODY = {
  top: 9,
  rows: [
    '.......................WWWW.......',
    '.....................WgggWWW......',
    '....................WWWWIKWWYY....',
    'WW..........BBbBBBBWWWWWWWWYYYY...',
    'WWWW.....BBBBbBBBBBBBWWWWWW.YYYy..',
    'WWWWWWBBBBBbBBBBBBBBBBBWWW....yy..',
    'WWWWWBBBBBBBBBBBBBBBBBBBW.........',
    'WWWw..DBBBBbBBBBBBBBBBBD..........',
    'w.......DDBBBBBBBBBBDD............',
  ],
}
/** Feet tucked under the tail while cruising… */
const SIDE_TUCKED = { top: 18, rows: ['...........TTy.TTy'] }
/** …and lowered, talons forward, to land. */
const SIDE_LANDING_GEAR = {
  top: 18,
  rows: ['..............DBBD', '...............DTT', '..............TyTyT'],
}
const SIDE_WINGS: Record<Pose, { top: number; rows: string[] }> = {
  up: {
    top: 0,
    rows: [
      '..D.D.D',
      '..DhDhDh',
      '...DBhBhB',
      '...DBBbBBh',
      '....DBBbBBh',
      '....DBbBBBBh',
      '.....DBBbBBBh',
      '.....DBBBbBBBh',
      '......DBBBBbBBhh',
      '.......DBBBBBBBBh',
      '........DDBBBBBBBh',
      '..........DDBBBBBBh',
      '............DDBBBBBh',
    ],
  },
  mid: {
    top: 9,
    rows: [
      '......hhhhhhhhhhh',
      '...DDBBBbBBBBBBBBh',
      '.DDhDBbBBBBbBBBBBBh',
      'D.D.DDDBBBBBBBBBBBB',
    ],
  },
  down: {
    top: 13,
    rows: [
      '............DBBBBBBBh',
      '...........DBBBBBBBh',
      '..........DBBbBBBBh',
      '.........DBBbBBBh',
      '........DBBbBBBh',
      '.......DBBbBBh',
      '......DBbBBh',
      '.....DBbBh',
      '....DBBh',
      '...DhDh',
      '..D.D.D',
    ],
  },
}

function SideFlight({ pose, landing }: { pose: Pose; landing: boolean }): ReactNode {
  const gear = landing ? SIDE_LANDING_GEAR : SIDE_TUCKED
  const wing = SIDE_WINGS[pose]
  // Centred over the perched eagle's box, so the hand-over at touchdown stays in place.
  return (
    <g transform={`translate(${(COLS - SIDE_W) / 2} -1)`}>
      <Pixels rows={SIDE_BODY.rows} x={0} y={SIDE_BODY.top} />
      <Pixels rows={gear.rows} x={0} y={gear.top} />
      <Pixels rows={wing.rows} x={0} y={wing.top} />
    </g>
  )
}

/** Draws a grid of palette letters, joining runs of one colour into a single rect. */
function Pixels({ rows, x, y, mirror = false }: { rows: string[]; x: number; y: number; mirror?: boolean }): ReactNode {
  const rects: ReactNode[] = []
  rows.forEach((source, r) => {
    const row = mirror ? [...source].reverse().join('') : source
    let start = 0
    for (let c = 1; c <= row.length; c += 1) {
      if (c < row.length && row[c] === row[start]) continue
      const color = PALETTE[row[start]]
      if (color) {
        rects.push(<rect key={`${r}-${start}`} x={x + start} y={y + r} width={c - start} height={1} fill={color} />)
      }
      start = c
    }
  })
  return <>{rects}</>
}

function Wing({ pose, side }: { pose: Pose; side: 'left' | 'right' }): ReactNode {
  const wing = WINGS[pose]
  return side === 'left' ? (
    <Pixels rows={wing.rows} x={-wing.rows[0].length} y={wing.top} />
  ) : (
    <Pixels rows={wing.rows} x={COLS} y={wing.top} mirror />
  )
}

/* Each eye is 4×3 cells; a 2×2 pupil moves inside it a whole cell at a time. */
const EYES = [3, 13]
const BROWS: [number, number][][] = [
  [[3, 3], [4, 3], [5, 3], [6, 4], [7, 4]],
  [[16, 3], [15, 3], [14, 3], [13, 4], [12, 4]],
]

function Cells({ cells, fill }: { cells: [number, number][]; fill: string }): ReactNode {
  return (
    <>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
      ))}
    </>
  )
}

function Eyes({ mood, look, blink }: { mood: EagleMood; look: { x: number; y: number }; blink: boolean }): ReactNode {
  if (mood === 'happy') {
    // Smiling eyes: two little arches.
    return (
      <>
        {EYES.map((x) => (
          <Cells key={x} fill={PUPIL} cells={[[x, 6], [x + 1, 5], [x + 2, 5], [x + 3, 6]]} />
        ))}
      </>
    )
  }
  if (blink) {
    return (
      <>
        {EYES.map((x) => (
          <rect key={x} x={x} y={5} width={4} height={1} fill={BROW} />
        ))}
      </>
    )
  }
  const px = look.x + 1
  const py = look.y < 0 ? 0 : 1
  return (
    <>
      {EYES.map((x) => (
        <g key={x}>
          <rect x={x} y={4} width={4} height={3} fill={IRIS} />
          <rect x={x + px} y={4 + py} width={2} height={2} fill={PUPIL} />
          <rect x={x + px} y={4 + py} width={1} height={1} fill="#ffffff" />
        </g>
      ))}
      {BROWS.map((cells, i) => (
        <Cells key={i} fill={BROW} cells={cells} />
      ))}
    </>
  )
}

const BOB: Partial<Record<EagleMood, { animate: TargetAndTransition; transition: Transition }>> = {
  idle: { animate: { y: [0, -0.6, 0] }, transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
  waving: { animate: { y: [0, -0.6, 0] }, transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
  typing: { animate: { y: [0, -0.4, 0] }, transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } },
  happy: { animate: { y: [0, -2.5, 0, -1.2, 0] }, transition: { duration: 0.9, ease: 'easeOut' } },
}

/** Which wing poses to show, and how the body rises with each beat. */
function useWings(mood: EagleMood, reducedMotion: boolean | null) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (reducedMotion || (mood !== 'flying' && mood !== 'happy' && mood !== 'waving')) return
    // Slow, deep wingbeats in flight; quick excited ones when happy.
    const ms = mood === 'waving' ? 260 : mood === 'flying' ? 130 : 90
    const stop = everyBeat(ms, mood === 'happy' ? 8 : Infinity, setFrame)
    return () => {
      stop()
      setFrame(0)
    }
  }, [mood, reducedMotion])

  if (mood === 'flying') {
    const pose = reducedMotion ? 'mid' : FLAP[frame % FLAP.length]
    return { left: pose, right: pose, lift: pose === 'down' ? -1 : 0 }
  }
  if (mood === 'gliding') return { left: 'mid', right: 'mid', lift: 0 } as const
  if (mood === 'flaring') return { left: 'up', right: 'up', lift: 0 } as const
  if (mood === 'happy' && !reducedMotion && frame < 8) {
    const pose = FLAP[frame % FLAP.length]
    return { left: pose, right: pose, lift: pose === 'down' ? -1 : 0 }
  }
  // Waves the wing on the page side, since it sits in the right-hand corner.
  if (mood === 'waving') return { left: reducedMotion || frame % 2 === 0 ? 'up' : 'mid', right: null, lift: 0 } as const
  return { left: null, right: null, lift: 0 } as const
}

/**
 * `pixel` is the size of one grid cell in CSS pixels; whole numbers keep it sharp.
 * `head` crops to the head, for an avatar. While idle the eyes follow the pointer.
 */
export function Eagle({
  mood = 'idle',
  pixel = 3,
  head = false,
  className,
}: {
  mood?: EagleMood
  pixel?: number
  head?: boolean
  className?: string
}): ReactNode {
  const reducedMotion = useReducedMotion()
  const ref = useRef<SVGSVGElement>(null)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)
  const wings = useWings(head ? 'idle' : mood, reducedMotion)

  // Blinks at uneven intervals, like something alive.
  useEffect(() => {
    if (reducedMotion) return
    let timer: number
    const schedule = (): void => {
      timer = window.setTimeout(() => {
        setBlink(true)
        timer = window.setTimeout(() => {
          setBlink(false)
          schedule()
        }, 120)
      }, 1600 + Math.random() * 3400)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion) return
    if (mood === 'typing') {
      // Reads along what it is writing.
      const stop = everyBeat(260, Infinity, (beat) => setLook({ x: (beat % 3) - 1, y: 1 }))
      return () => {
        stop()
        setLook({ x: 0, y: 0 })
      }
    }
    if (mood !== 'idle' && mood !== 'waving') return
    const onMove = (event: PointerEvent): void => {
      const box = ref.current?.getBoundingClientRect()
      if (!box) return
      const dx = event.clientX - (box.left + box.width / 2)
      const dy = event.clientY - (box.top + box.height / 2)
      const next = { x: Math.abs(dx) < 30 ? 0 : Math.sign(dx), y: Math.abs(dy) < 30 ? 0 : Math.sign(dy) }
      setLook((prev) => (prev.x === next.x && prev.y === next.y ? prev : next))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mood, reducedMotion])

  const rows = head ? 12 : ROWS + 1
  const bob = BOB[mood]
  const inAir = mood === 'flying' || mood === 'gliding' || mood === 'flaring'

  return (
    <svg
      ref={ref}
      data-eagle={mood}
      aria-hidden="true"
      viewBox={`0 0 ${COLS} ${rows}`}
      width={COLS * pixel}
      height={rows * pixel}
      shapeRendering="crispEdges"
      className={className}
      style={{ overflow: head ? 'hidden' : 'visible', flex: 'none' }}
    >
      {!head && !inAir && <rect x={5} y={24} width={10} height={1} fill="#000814" opacity={0.35} />}
      <motion.g
        key={head ? 'head' : mood}
        initial={false}
        animate={reducedMotion || head || !bob ? undefined : bob.animate}
        transition={bob?.transition}
      >
        <g transform={`translate(0 ${wings.lift})`}>
          {inAir ? (
            <SideFlight pose={wings.left ?? 'mid'} landing={mood === 'flaring'} />
          ) : (
            <>
              {wings.left && <Wing pose={wings.left} side="left" />}
              {wings.right && <Wing pose={wings.right} side="right" />}
              <Pixels rows={head ? BODY.slice(0, 12) : BODY} x={0} y={0} />
              <Eyes mood={mood} look={look} blink={blink} />
            </>
          )}
        </g>
      </motion.g>
    </svg>
  )
}
