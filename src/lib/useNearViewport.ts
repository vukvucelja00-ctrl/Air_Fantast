import { useEffect, useState, type RefObject } from 'react'

/** Turns true, and stays true, once the element comes within `margin` of the screen. */
export function useNearViewport(ref: RefObject<Element | null>, margin = '800px'): boolean {
  const [near, setNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || near) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
      },
      { rootMargin: margin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, margin, near])

  return near
}
