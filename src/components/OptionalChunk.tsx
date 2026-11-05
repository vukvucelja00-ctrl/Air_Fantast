import { Component, Suspense, type ReactNode } from 'react'

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Wraps a lazily loaded part of the page. If it cannot load at all (a bad connection, or an
 * old tab after a new deploy), `failed` shows instead and the rest of the page keeps working.
 */
export function OptionalChunk({ failed = null, children }: { failed?: ReactNode; children: ReactNode }) {
  return (
    <Boundary fallback={failed}>
      <Suspense fallback={null}>{children}</Suspense>
    </Boundary>
  )
}
