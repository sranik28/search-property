'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { DEFAULT_MAP_STYLE, formatPrice } from '@/lib/mapbox'
import { useMapStore, Property } from '@/store/mapStore'
import PropertyPopup from './PropertyPopup'
import { createRoot } from 'react-dom/client'

interface MapComponentProps {
  centerLat: number
  centerLng: number
  zoom: number
}

export default function MapComponent({ centerLat, centerLng, zoom }: MapComponentProps) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const markersRef = useRef<Record<number, maplibregl.Marker>>({})
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null)

  const {
    properties,
    hoveredPropertyId,
    isDrawMode,
    setMapBounds,
    setSelectedProperty,
    setDrawnPolygon,
    setIsDrawMode,
    flyToLocation,
    setFlyToLocation,
  } = useMapStore()

  const fetchBoundsProperties = useCallback(() => {
    if (!mapRef.current) return
    const bounds = mapRef.current.getBounds()
    if (!bounds) return
    setMapBounds({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    })
  }, [setMapBounds])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [centerLng, centerLat],
      zoom,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'simple_select',
    })
    drawRef.current = draw
    map.addControl(draw as any)

    map.on('load', () => {
      // Add clustering source safely
      if (!map.getSource('properties')) {
        map.addSource('properties', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        })
      }

      // Add cluster layers safely
      if (!map.getLayer('clusters')) {
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'properties',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#10b981', 10, '#f59e0b', 30, '#ef4444'],
            'circle-radius': ['step', ['get', 'point_count'], 24, 10, 30, 30, 38],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff',
          },
        })
      }

      if (!map.getLayer('cluster-count')) {
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'properties',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 13,
          },
          paint: { 'text-color': '#fff' },
        })
      }

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        if (!features.length) return
        const clusterId = features[0].properties?.cluster_id
        const source = map.getSource('properties') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((z) => {
          const geom = features[0].geometry as GeoJSON.Point
          map.easeTo({ center: geom.coordinates as [number, number], zoom: z ?? 12 })
        }).catch(err => console.error('Cluster expansion error', err))
      })

      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
      
      updateMapData()
    })

    map.on('style.load', () => {
      // Re-initialize sources/layers on style load if they are missing
      updateMapData()
    })

    map.on('moveend', fetchBoundsProperties)
    map.on('zoomend', fetchBoundsProperties)

    // Draw events
    map.on('draw.create', (e: any) => {
      const polygon = e.features[0]?.geometry as GeoJSON.Polygon
      if (polygon?.coordinates?.[0]) {
        setDrawnPolygon(polygon.coordinates[0] as number[][])
        setIsDrawMode(false)
      }
    })
    map.on('draw.delete', () => {
      setDrawnPolygon(null)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePropertyInteraction = useCallback((property: Property) => {
    const map = mapRef.current
    if (!map) return
    if (popupRef.current) popupRef.current.remove()
    setSelectedProperty(property)

    const popupNode = document.createElement('div')
    if (popupRootRef.current) popupRootRef.current.unmount()
    const root = createRoot(popupNode)
    popupRootRef.current = root
    root.render(
      <PropertyPopup 
        property={property} 
        onClose={() => { if (popupRef.current) popupRef.current.remove(); setSelectedProperty(null) }} 
      />
    )

    const popup = new maplibregl.Popup({ offset: 15, closeButton: false, maxWidth: '320px' })
      .setLngLat([property.longitude, property.latitude])
      .setDOMContent(popupNode)
      .addTo(map)

    popupRef.current = popup
  }, [setSelectedProperty])

  // Central update function
  const updateMapData = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      console.log('Map style not loaded yet, skipping update.')
      return
    }

    console.log('Updating map data for', properties.length, 'properties')

    // 1. Update Plot Boundaries
    if (!map.getSource('plot-boundaries')) {
      map.addSource('plot-boundaries', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })

      map.addLayer({
        id: 'plot-layer-fill',
        type: 'fill',
        source: 'plot-boundaries',
        paint: {
          'fill-color': '#d9d2c2', // Beige/Tan
          'fill-opacity': 0.6,
        }
      })

      map.addLayer({
        id: 'plot-layer-outline',
        type: 'line',
        source: 'plot-boundaries',
        paint: {
          'line-color': '#8c7e6d', // Darker Tan
          'line-width': 2,
        }
      })

      map.addLayer({
        id: 'plot-layer-label',
        type: 'symbol',
        source: 'plot-boundaries',
        layout: {
          'text-field': ['get', 'plotNumber'],
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-justify': 'center',
          'text-anchor': 'center',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#3e362e',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5
        }
      })

      map.on('click', 'plot-layer-fill', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const propId = feature.properties?.id
        const property = properties.find(p => p.id === propId)
        if (property) handlePropertyInteraction(property)
      })

      map.on('mouseenter', 'plot-layer-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'plot-layer-fill', () => { map.getCanvas().style.cursor = '' })
    }

    const plotFeatures = properties
      .filter(p => p.boundary && p.boundary !== 'null' && p.boundary !== '[]')
      .map(p => {
        try {
          const geom = typeof p.boundary === 'string' ? JSON.parse(p.boundary) : p.boundary
          return {
            type: 'Feature',
            geometry: geom,
            properties: { id: p.id, plotNumber: p.plotNumber || '', title: p.title }
          }
        } catch { return null }
      })
      .filter((f): f is any => f !== null)

    console.log('Rendering plots:', plotFeatures.length, plotFeatures)

    const plotSource = map.getSource('plot-boundaries') as maplibregl.GeoJSONSource
    if (plotSource) plotSource.setData({ type: 'FeatureCollection', features: plotFeatures })

    // 2. Update Clustering Source
    const clusterSource = map.getSource('properties') as maplibregl.GeoJSONSource
    if (clusterSource) {
      const features = properties.map((p) => ({
        type: 'Feature',
        properties: { id: p.id, price: p.price },
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] } as GeoJSON.Point,
      }))
      clusterSource.setData({ type: 'FeatureCollection', features: features as any })
    }

    // 3. Update Price Markers
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    properties.forEach((property: Property) => {
      const el = document.createElement('div')
      el.className = 'price-marker'
      el.innerHTML = `<span>${formatPrice(property.price)}</span>`
      el.addEventListener('click', () => handlePropertyInteraction(property))
      el.addEventListener('mouseenter', () => handlePropertyInteraction(property))

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map)
      markersRef.current[property.id] = marker
    })
  }, [properties, handlePropertyInteraction])

  // React to data changes
  useEffect(() => {
    updateMapData()
  }, [updateMapData])

  // React to flyToLocation
  useEffect(() => {
    if (flyToLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyToLocation.lng, flyToLocation.lat],
        zoom: flyToLocation.zoom,
      })
      setFlyToLocation(null)
    }
  }, [flyToLocation, setFlyToLocation])

  // Highlight hovered marker
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement()
      if (parseInt(id) === hoveredPropertyId) {
        el.classList.add('marker-hovered')
      } else {
        el.classList.remove('marker-hovered')
      }
    })
  }, [hoveredPropertyId])

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-none" />
  )
}
