import maplibregl from 'maplibre-gl'

export const DEFAULT_MAP_STYLE: any = {
  version: 8,
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export function formatPrice(price: number): string {
  if (price >= 100000) return `${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `${(price / 1000).toFixed(1)}k`
  return String(price)
}

export function getBoundsFromViewport(map: maplibregl.Map) {
  const bounds = map.getBounds()
  if (!bounds) return null
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}
