'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, DEFAULT_MAP_STYLE } from '@/lib/mapbox'

interface Props {
  latitude: number
  longitude: number
  title: string
}

export default function PropertyDetailMap({ latitude, longitude, title }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [longitude, latitude],
      zoom: 15,
    })

    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup().setText(title))
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude, title])

  return <div ref={mapContainerRef} className="w-full h-full" />
}
