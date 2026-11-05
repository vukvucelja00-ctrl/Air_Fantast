/** Lets other parts of the page fill in the flight search, such as the route map. */

export type RouteRequest = { from: string; to: string }

const EVENT = 'air-fantast:search-route'

export function requestRoute(detail: RouteRequest) {
  window.dispatchEvent(new CustomEvent<RouteRequest>(EVENT, { detail }))
}

export function onRouteRequest(listener: (request: RouteRequest) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<RouteRequest>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
