import { X } from 'lucide-react'
import { motion, useReducedMotion, type Transition } from 'motion/react'
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const ease = [0.22, 1, 0.36, 1] as const
const POP: Transition = { duration: 0.32, ease }
const SHEET: Transition = { duration: 0.42, ease }

const FOCUSABLE = 'a[href],button:not(:disabled),input:not(:disabled),[tabindex="0"]'

/**
 * The shell around every picker: a popover anchored to its field on larger screens,
 * a bottom sheet (portalled to the body, with a scrim) on phones. Takes focus when it
 * opens, keeps Tab inside and closes on Escape.
 */
export function Panel({
  title,
  variant,
  isSheet,
  up,
  onClose,
  children,
}: {
  title: string
  variant: 'airport' | 'dates' | 'travellers'
  isSheet: boolean
  up: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const panel = ref.current
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true })
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !ref.current) return
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === ref.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const offset = up ? 10 : -10
  const motionProps = isSheet
    ? {
        initial: reducedMotion ? { opacity: 0 } : { y: '100%' },
        animate: reducedMotion ? { opacity: 1 } : { y: 0 },
        exit: reducedMotion ? { opacity: 0 } : { y: '100%' },
        transition: SHEET,
      }
    : {
        initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: offset, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: offset / 2, scale: 0.98 },
        transition: POP,
      }

  const panel = (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={title}
      aria-modal={isSheet || undefined}
      tabIndex={-1}
      data-fs-popover
      className={`fs-panel fs-panel--${variant}${up ? ' is-up' : ''}${isSheet ? ' fs-sheet' : ''}`}
      onKeyDown={onKeyDown}
      {...motionProps}
    >
      <div className="fs-panel-head">
        <span className="fs-panel-title">{title}</span>
        {isSheet && (
          <button type="button" className="fs-panel-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  )

  if (!isSheet) return panel

  return createPortal(
    <>
      <motion.div
        className="fs-scrim"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
      {panel}
    </>,
    document.body,
  )
}
