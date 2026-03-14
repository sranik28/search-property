import { create } from 'zustand'

export interface Property {
  id: number
  title: string
  slug: string
  price: number
  city: string
  address: string
  latitude: number
  longitude: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
  description: string
  images: string[]
  plotNumber?: string
  boundary?: string
  status: string
  createdAt: string
}

export interface City {
  id: number
  name: string
  slug: string
  latitude: number
  longitude: number
  zoomLevel: number
}

interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

interface MapStore {
  properties: Property[]
  selectedProperty: Property | null
  hoveredPropertyId: number | null
  mapBounds: MapBounds | null
  isDrawMode: boolean
  drawnPolygon: number[][] | null
  isLoading: boolean
  flyToLocation: { lat: number; lng: number; zoom: number } | null
  filters: {
    minPrice: number | null
    maxPrice: number | null
    bedrooms: number | null
  }

  setProperties: (props: Property[]) => void
  setSelectedProperty: (prop: Property | null) => void
  setHoveredPropertyId: (id: number | null) => void
  setMapBounds: (bounds: MapBounds | null) => void
  setIsDrawMode: (val: boolean) => void
  setDrawnPolygon: (polygon: number[][] | null) => void
  setIsLoading: (val: boolean) => void
  setFlyToLocation: (location: { lat: number; lng: number; zoom: number } | null) => void
  setFilters: (filters: Partial<MapStore['filters']>) => void
}

export const useMapStore = create<MapStore>((set) => ({
  properties: [],
  selectedProperty: null,
  hoveredPropertyId: null,
  mapBounds: null,
  isDrawMode: false,
  drawnPolygon: null,
  isLoading: false,
  flyToLocation: null,
  filters: {
    minPrice: null,
    maxPrice: null,
    bedrooms: null,
  },

  setProperties: (props) => set({ properties: props }),
  setSelectedProperty: (prop) => set({ selectedProperty: prop }),
  setHoveredPropertyId: (id) => set({ hoveredPropertyId: id }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setIsDrawMode: (val) => set({ isDrawMode: val }),
  setDrawnPolygon: (polygon) => set({ drawnPolygon: polygon }),
  setIsLoading: (val) => set({ isLoading: val }),
  setFlyToLocation: (loc) => set({ flyToLocation: loc }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}))
