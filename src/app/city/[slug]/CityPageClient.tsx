'use client'

import { useEffect, useCallback } from 'react'
import axios from 'axios'
import { useMapStore } from '@/store/mapStore'
import FilterBar from '@/components/filters/FilterBar'
import MapControls from '@/components/map/MapControls'
import PropertyListPanel from '@/components/property/PropertyListPanel'
import dynamic from 'next/dynamic'
import { Map, List } from 'lucide-react'
import { useState } from 'react'

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400 font-medium">Loading map...</span>
    </div>
  ),
})

interface CityPageClientProps {
  cityName: string
  citySlug: string
  latitude: number
  longitude: number
  zoomLevel: number
}

export default function CityPageClient({
  cityName, citySlug, latitude, longitude, zoomLevel,
}: CityPageClientProps) {
  const { mapBounds, drawnPolygon, filters, setProperties, setIsLoading } = useMapStore()
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = { city: citySlug }

      if (drawnPolygon) {
        params.polygon = JSON.stringify(drawnPolygon)
      } else if (mapBounds) {
        params.bbox = `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}`
      }

      if (filters.minPrice !== null) params.minPrice = String(filters.minPrice)
      if (filters.maxPrice !== null) params.maxPrice = String(filters.maxPrice)
      if (filters.bedrooms !== null) params.bedrooms = String(filters.bedrooms)

      const res = await axios.get('/api/properties', { params })
      setProperties(res.data)
    } catch (e) {
      console.error('Error fetching properties:', e)
    } finally {
      setIsLoading(false)
    }
  }, [mapBounds, drawnPolygon, filters, citySlug, setProperties, setIsLoading])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-slate-800 text-base">
            Homes for Sale in <span className="text-emerald-600">{cityName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <FilterBar />
          {/* Mobile toggle */}
          <div className="flex md:hidden bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setMobileView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mobileView === 'map' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              <Map size={13} /> Map
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mobileView === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              <List size={13} /> List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map panel */}
        <div className={`relative flex-1 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          <MapComponent centerLat={latitude} centerLng={longitude} zoom={zoomLevel} />
          <MapControls />
        </div>

        {/* List panel */}
        <div className={`w-full md:w-[420px] lg:w-[480px] border-l border-slate-100 shrink-0 overflow-hidden ${mobileView === 'map' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <PropertyListPanel />
        </div>
      </div>
    </div>
  )
}
