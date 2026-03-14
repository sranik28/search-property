'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DEFAULT_MAP_STYLE } from '@/lib/mapbox'

interface Props {
  latitude: number
  longitude: number
  title: string
}

export default function PropertyDetailMap({ latitude, longitude, title }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return


    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [longitude, latitude],
      zoom: 15,
    })

    new maplibregl.Marker({ color: '#10b981' })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup().setText(title))
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude, title])

  return <div ref={mapContainerRef} className="w-full h-full" />
}
