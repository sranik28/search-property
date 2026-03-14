export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export const MAP_STYLES = {
  osm: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  } as mapboxgl.Style,
}

export const DEFAULT_MAP_STYLE = MAP_STYLES.osm

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`
  }
  if (price >= 1_000) {
    return `$${Math.round(price / 1_000)}K`
  }
  return `$${price.toLocaleString()}`
}

export function getBoundsFromViewport(map: mapboxgl.Map) {
  const bounds = map.getBounds()
  if (!bounds) return null
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}
