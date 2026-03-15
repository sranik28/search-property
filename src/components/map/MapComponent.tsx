'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, ZoomControl, ScaleControl } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import { DEFAULT_TILE_LAYER, DEFAULT_ATTRIBUTION, GOOGLE_SUBDOMAINS, formatPrice, formatLeafletBounds } from '@/lib/mapbox'
import { useMapStore, Property } from '@/store/mapStore'
import PropertyPopup from './PropertyPopup'

interface MapComponentProps {
  centerLat: number
  centerLng: number
  zoom: number
}

// Custom hook to handle map events
function MapEvents({ onMoveEnd }: { onMoveEnd: (bounds: any) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onMoveEnd(map.getBounds())
    },
    zoomend: () => {
      onMoveEnd(map.getBounds())
    },
  })
  return null
}

// Controller for flyTo actions
function MapController() {
  const map = useMapEvents({})
  const { flyToLocation, setFlyToLocation } = useMapStore()

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo([flyToLocation.lat, flyToLocation.lng], flyToLocation.zoom, {
        animate: true,
        duration: 1.5
      })
      setFlyToLocation(null)
    }
  }, [flyToLocation, map, setFlyToLocation])

  return null
}

export default function MapComponent({ centerLat, centerLng, zoom }: MapComponentProps) {
  const {
    properties,
    hoveredPropertyId,
    setMapBounds,
    setSelectedProperty,
  } = useMapStore()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleMoveEnd = useCallback((bounds: any) => {
    setMapBounds(formatLeafletBounds(bounds))
  }, [setMapBounds])

  // Create custom DivIcon for price markers
  const createPriceIcon = useCallback((price: number, isHovered: boolean) => {
    return L.divIcon({
      className: `price-marker-container`,
      html: `<div class="price-marker ${isHovered ? 'marker-hovered' : ''}"><span>${formatPrice(price)}</span></div>`,
      iconSize: [60, 30],
      iconAnchor: [30, 30],
    })
  }, [])

  const plotFeatures = useMemo(() => {
    return properties
      .filter(p => p.boundary && p.boundary !== 'null' && p.boundary !== '[]')
      .map(p => {
        try {
          const geom = typeof p.boundary === 'string' ? JSON.parse(p.boundary) : p.boundary
          // Leaflet expects [lat, lng] for points in polygons
          // GeoJSON is [lng, lat], so we need to flip them
          const latLngs = geom.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])
          return {
            id: p.id,
            latLngs,
            plotNumber: p.plotNumber,
            property: p
          }
        } catch { return null }
      })
      .filter((f): f is any => f !== null)
  }, [properties])

  if (!isMounted) return <div className="w-full h-full bg-slate-50 animate-pulse" />

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url={DEFAULT_TILE_LAYER}
          subdomains={GOOGLE_SUBDOMAINS}
          attribution={DEFAULT_ATTRIBUTION}
        />
        
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" />
        
        <MapEvents onMoveEnd={handleMoveEnd} />
        <MapController />

        {/* Plot Boundaries */}
        {plotFeatures.map((plot) => (
          <Polygon
            key={`plot-${plot.id}`}
            positions={plot.latLngs}
            pathOptions={{
              color: '#8c7e6d',
              fillColor: '#d9d2c2',
              fillOpacity: 0.6,
              weight: 2,
            }}
            eventHandlers={{
              click: () => setSelectedProperty(plot.property),
              mouseover: (e) => e.target.setStyle({ fillOpacity: 0.8, weight: 3 }),
              mouseout: (e) => e.target.setStyle({ fillOpacity: 0.6, weight: 2 }),
            }}
          >
            <Popup offset={[0, -10]}>
              <PropertyPopup 
                property={plot.property} 
                onClose={() => setSelectedProperty(null)} 
              />
            </Popup>
          </Polygon>
        ))}

        {/* Property Markers with Clustering */}
        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          maxClusterRadius={50}
        >
          {properties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              icon={createPriceIcon(property.price, hoveredPropertyId === property.id)}
              eventHandlers={{
                click: () => setSelectedProperty(property),
              }}
            >
              <Popup offset={[0, -20]} maxWidth={320}>
                <PropertyPopup 
                  property={property} 
                  onClose={() => setSelectedProperty(null)} 
                />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
