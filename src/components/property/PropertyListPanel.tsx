'use client'

import { useRef, useEffect } from 'react'
import { useMapStore, Property } from '@/store/mapStore'
import PropertyCard from './PropertyCard'
import { Building2 } from 'lucide-react'

export default function PropertyListPanel() {
  const { properties, hoveredPropertyId, isLoading, setHoveredPropertyId } = useMapStore()
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<number, HTMLDivElement>>({})

  // Scroll to highlighted card when hoveredPropertyId changes from external source
  useEffect(() => {
    if (hoveredPropertyId && cardRefs.current[hoveredPropertyId]) {
      cardRefs.current[hoveredPropertyId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [hoveredPropertyId])

  return (
    <div ref={listRef} className="h-full overflow-y-auto bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-500">
          {isLoading ? (
            <span className="animate-pulse">Loading properties...</span>
          ) : (
            <>
              <span className="text-slate-800 text-base">{properties.length}</span> properties found
            </>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="p-4 grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Building2 size={40} className="mb-3 opacity-40" />
          <p className="font-semibold">No properties found</p>
          <p className="text-sm mt-1">Try adjusting your search area or filters</p>
        </div>
      ) : (
        <div className="p-4 grid gap-4">
          {properties.map((property: Property) => (
            <div
              key={property.id}
              ref={(el) => { if (el) cardRefs.current[property.id] = el }}
              onMouseEnter={() => setHoveredPropertyId(property.id)}
              onMouseLeave={() => setHoveredPropertyId(null)}
            >
              <PropertyCard property={property} isHighlighted={hoveredPropertyId === property.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
