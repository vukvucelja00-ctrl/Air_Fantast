import type { Feature, FeatureCollection, Position } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import landUrl from 'world-atlas/land-50m.json?url'

let cache: Promise<HTMLCanvasElement> | null = null
let landCache: Promise<FeatureCollection | Feature> | null = null

/** Natural Earth land (1:50m) as GeoJSON, fetched once and shared by the globe and the route map. */
export function loadLand(): Promise<FeatureCollection | Feature> {
  landCache ??= fetchLand().catch((error: unknown) => {
    landCache = null
    throw error
  })
  return landCache
}

async function fetchLand(): Promise<FeatureCollection | Feature> {
  const response = await fetch(landUrl)
  if (!response.ok) throw new Error(`Land data failed to load (${response.status})`)
  const topology = (await response.json()) as Topology<{ land: GeometryCollection }>
  return feature(topology, topology.objects.land) as FeatureCollection | Feature
}

/**
 * Natural Earth land (1:50m) drawn white-on-black into an equirectangular canvas:
 * x = longitude −180…180, y = latitude 90…−90. Used as the land mask for the globe shader.
 * The data is fetched once, on demand, so it stays out of the main bundle.
 */
export function loadLandMask(width = 4096): Promise<HTMLCanvasElement> {
  cache ??= draw(width).catch((error: unknown) => {
    cache = null
    throw error
  })
  return cache
}

async function draw(width: number): Promise<HTMLCanvasElement> {
  const land = await loadLand()

  const height = width / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#fff'

  const sx = width / 360
  const sy = height / 180
  const ring = (points: Position[]) => {
    points.forEach(([lon, lat], i) => {
      const x = (lon + 180) * sx
      const y = (90 - lat) * sy
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
  }

  const features = 'features' in land ? land.features : [land]
  for (const { geometry } of features) {
    const polygons =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : []
    for (const polygon of polygons) {
      ctx.beginPath()
      polygon.forEach(ring)
      ctx.fill('evenodd')
    }
  }
  return canvas
}
