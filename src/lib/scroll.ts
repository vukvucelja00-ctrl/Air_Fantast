import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let lenis: Lenis | null = null
let locks = 0

/** How long a jump to a section takes, in seconds. */
const JUMP_SECONDS = 1.2
/** The longest to wait for a jump to report back; frames barely run in a background tab. */
const JUMP_LIMIT_MS = 2000

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Moves to the element, honouring its scroll-margin-top, and reports once it has arrived.
 * Returns a function that cancels the report.
 */
export function scrollToElement(element: HTMLElement, onArrive?: () => void): () => void {
  let finished = false
  const arrive = () => {
    if (finished) return
    finished = true
    window.clearTimeout(timer)
    // If the animation was cut short, finish the job so nothing opens off screen.
    if (lenis) lenis.scrollTo(element, { immediate: true, force: true })
    else element.scrollIntoView({ block: 'start', behavior: 'auto' })
    onArrive?.()
  }
  const timer = window.setTimeout(arrive, JUMP_LIMIT_MS)

  if (lenis && !prefersReducedMotion()) {
    lenis.scrollTo(element, { duration: JUMP_SECONDS, force: true, onComplete: arrive })
  } else {
    arrive()
  }

  return () => {
    finished = true
    window.clearTimeout(timer)
  }
}

/** Holds the page still while a menu or sheet is open. Calls can overlap; each on needs an off. */
export function lockScroll(locked: boolean) {
  locks = Math.max(0, locks + (locked ? 1 : -1))
  if (locks > 0) lenis?.stop()
  else lenis?.start()
}

/**
 * Same-page links glide to their section instead of jumping. The address still updates and
 * `hashchange` still fires, which is how the Contact link opens the agent tab.
 */
function onLinkClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]')
  if (!link) return

  event.preventDefault()
  const hash = link.getAttribute('href') ?? '#'
  // Placeholder links, and sections that do not exist yet, stay put.
  const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null
  if (!target) return

  window.history.pushState(null, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  // Keyboard users carry on from the section they moved to.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  scrollToElement(target)
}

/** Turns on smooth scrolling for the page. Returns a function that turns it off again. */
export function startSmoothScroll(): () => void {
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.1,
    // Lists and panels with their own scrollbar scroll on their own, then hand over to the page.
    allowNestedScroll: true,
    // Cmd + wheel zooms the route map instead of moving the page. (Ctrl already does.)
    virtualScroll: ({ event }) => !(event as WheelEvent).metaKey,
  })
  if (locks > 0) lenis.stop()
  document.addEventListener('click', onLinkClick)

  return () => {
    document.removeEventListener('click', onLinkClick)
    lenis?.destroy()
    lenis = null
  }
}
