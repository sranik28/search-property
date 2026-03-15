export const DEFAULT_TILE_LAYER = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
export const GOOGLE_SUBDOMAINS = ['mt0', 'mt1', 'mt2', 'mt3']
export const DEFAULT_ATTRIBUTION = '&copy; Google Maps'

export function formatPrice(price: number): string {
  if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`
  if (price >= 100000) return `${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `${(price / 1000).toFixed(1)}k`
  return String(price)
}

// Leaflet bounds are already easy to get from the map instance, 
// so we might not need a helper like getBoundsFromViewport here,
// but let's keep it if we want to format it the same way.
export function formatLeafletBounds(bounds: any) {
  if (!bounds) return null
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}
