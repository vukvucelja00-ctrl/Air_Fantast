const BASE_RADIUS = 2.4

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Planet radius in screen heights, as the horizon shader draws it. */
export function planetRadius(width: number, height: number, curvature: number): number {
  const c = Number.isFinite(curvature) ? curvature : 1
  return (BASE_RADIUS / clamp(c, 0.08, 6)) * clamp(width / Math.max(height, 1) / 1.6, 0.42, 1)
}

/** Vertical position of the top of the planet, as a fraction of the height from the top. */
export function planetHorizon(horizon: number): number {
  return clamp(Number.isFinite(horizon) ? horizon : 0.72, 0.15, 1.1)
}

/** The planet's circle in CSS pixels, measured from the top left of its container. */
export function planetCircle(width: number, height: number, horizon: number, curvature: number) {
  const radius = planetRadius(width, height, curvature) * height
  return { cx: width / 2, cy: planetHorizon(horizon) * height + radius, radius }
}
