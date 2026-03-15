'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEFAULT_TILE_LAYER, DEFAULT_ATTRIBUTION, GOOGLE_SUBDOMAINS } from '@/lib/mapbox'

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface Props {
  latitude: number
  longitude: number
  title: string
}

export default function PropertyDetailMap({ latitude, longitude, title }: Props) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="w-full h-full bg-slate-50 animate-pulse" />

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        className="w-full h-full"
      >
        <TileLayer
          url={DEFAULT_TILE_LAYER}
          subdomains={GOOGLE_SUBDOMAINS}
          attribution={DEFAULT_ATTRIBUTION}
        />
        <Marker 
          position={[latitude, longitude]} 
          icon={defaultIcon}
        >
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
