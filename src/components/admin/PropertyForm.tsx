'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Upload, X, MapPin, Save } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, FeatureGroup } from 'react-leaflet'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { DEFAULT_TILE_LAYER, DEFAULT_ATTRIBUTION, GOOGLE_SUBDOMAINS } from '@/lib/mapbox'

// Fix for default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface City {
  id: number
  name: string
  slug: string
}

interface PropertyFormProps {
  initialData?: Record<string, unknown>
  cities: City[]
  isEdit?: boolean
  propertyId?: number
}

// Map Helper Component
function MapHandler({ 
  onLocationSelect, 
  onBoundaryUpdate, 
  onMapClick,
  initialBoundary,
  markerPos,
  onMarkerDrag
}: { 
  onLocationSelect: (lat: number, lng: number) => void,
  onBoundaryUpdate: (boundary: string) => void,
  onMapClick: (lat: number, lng: number) => void,
  initialBoundary?: string,
  markerPos: [number, number],
  onMarkerDrag: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    // Initialize Geoman
    map.pm.addControls({
      position: 'topleft',
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      drawMarker: false,
      drawPolyline: false,
      cutPolygon: false,
    })

    if (initialBoundary && initialBoundary !== 'null') {
      try {
        const boundaryData = JSON.parse(initialBoundary)
        if (boundaryData && boundaryData.coordinates) {
          // GeoJSON [lng, lat] to Leaflet [lat, lng]
          const latLngs = boundaryData.coordinates[0].map((c: number[]) => [c[1], c[0]])
          const polygon = L.polygon(latLngs).addTo(map)
          map.fitBounds(polygon.getBounds(), { padding: [20, 20] })
        }
      } catch (e) {
        console.error('Failed to parse boundary', e)
      }
    }

    map.on('pm:create', (e: any) => {
      const layer = e.layer
      const geojson = layer.toGeoJSON()
      onBoundaryUpdate(JSON.stringify(geojson.geometry))
      
      // Remove other polygons if we only want one
      map.eachLayer((l: any) => {
        if (l instanceof L.Polygon && l !== layer) {
          map.removeLayer(l)
        }
      })
    })

    map.on('pm:remove', () => {
      onBoundaryUpdate('null')
    })

    map.on('pm:update', (e: any) => {
      const layer = e.layer
      const geojson = layer.toGeoJSON()
      onBoundaryUpdate(JSON.stringify(geojson.geometry))
    })

    return () => {
      map.off('pm:create')
      map.off('pm:remove')
      map.off('pm:update')
    }
  }, [map, initialBoundary, onBoundaryUpdate])

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })

  return (
    <>
      <Marker 
        position={markerPos} 
        draggable={true} 
        icon={defaultIcon}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target
            const position = marker.getLatLng()
            onMarkerDrag(position.lat, position.lng)
          }
        }}
      />
    </>
  )
}

export default function PropertyForm({ initialData, cities, isEdit, propertyId }: PropertyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [images, setImages] = useState<string[]>(() => {
    const initialImages = initialData?.images;
    if (Array.isArray(initialImages)) return initialImages;
    if (typeof initialImages === 'string') {
      try {
        return JSON.parse(initialImages);
      } catch {
        return [];
      }
    }
    return [];
  })

  const [formData, setFormData] = useState({
    title: (initialData?.title as string) || '',
    price: String(initialData?.price || ''),
    city: (initialData?.city as string) || '',
    citySlug: (initialData?.citySlug as string) || '',
    address: (initialData?.address as string) || '',
    latitude: String(initialData?.latitude || '23.8103'),
    longitude: String(initialData?.longitude || '90.4125'),
    bedrooms: String(initialData?.bedrooms || ''),
    bathrooms: String(initialData?.bathrooms || ''),
    area_sqft: String(initialData?.area_sqft || ''),
    description: (initialData?.description as string) || '',
    status: (initialData?.status as string) || 'active',
    plotNumber: (initialData?.plotNumber as string) || '',
    boundary: (initialData?.boundary as string) || 'null',
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`)
      setResults(res.data)
      if (res.data?.[0]) {
        const first = res.data[0]
        selectLocation(first.lat, first.lon, first.display_name)
      }
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setIsSearching(false)
    }
  }

  const selectLocation = (lat: string, lon: string, displayName: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: parseFloat(lat).toFixed(6),
      longitude: parseFloat(lon).toFixed(6),
    }))
    setResults([])
    setSearchQuery(displayName)
  }

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }))
  }, [])

  const handleBoundaryUpdate = useCallback((boundary: string) => {
    setFormData(prev => ({ ...prev, boundary }))
  }, [])

  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
  const labelClass = 'block text-sm font-semibold text-slate-600 mb-1.5'

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'citySlug') {
      const city = cities.find((c) => c.slug === value)
      if (city) setFormData((prev) => ({ ...prev, citySlug: value, city: city.name }))
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setUploadingImages(true)
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await axios.post('/api/admin/upload', fd)
          return res.data.url as string
        })
      )
      setImages((prev) => [...prev, ...uploads])
    } catch {
      setError('Image upload failed')
    } finally {
      setUploadingImages(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...formData, images }
      if (isEdit && propertyId) {
        await axios.put(`/api/admin/properties/${propertyId}`, payload)
      } else {
        await axios.post('/api/admin/properties', payload)
      }
      router.push('/admin')
    } catch {
      setError('Failed to save property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const markerPos = useMemo((): [number, number] => [
    parseFloat(formData.latitude) || 23.8103,
    parseFloat(formData.longitude) || 90.4125
  ], [formData.latitude, formData.longitude])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-4">Basic Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="3BR Modern Home in Downtown..." required />
          </div>
          <div>
            <label className={labelClass}>Price ($)</label>
            <input name="price" type="number" value={formData.price} onChange={handleChange} className={inputClass} placeholder="349000" required />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <select name="citySlug" value={formData.citySlug} onChange={handleChange} className={inputClass} required>
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Full Address</label>
            <input name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="House 12, Road 5, Banani, Dhaka" required />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-4">Property Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Bedrooms</label>
            <input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className={inputClass} placeholder="3" required />
          </div>
          <div>
            <label className={labelClass}>Bathrooms</label>
            <input name="bathrooms" type="number" step="0.5" value={formData.bathrooms} onChange={handleChange} className={inputClass} placeholder="2" required />
          </div>
          <div>
            <label className={labelClass}>Area (sqft)</label>
            <input name="area_sqft" type="number" value={formData.area_sqft} onChange={handleChange} className={inputClass} placeholder="1850" required />
          </div>
          <div>
            <label className={labelClass}>Plot Number</label>
            <input name="plotNumber" value={formData.plotNumber} onChange={handleChange} className={inputClass} placeholder="A-101" />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className={labelClass}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass} rows={4} placeholder="Describe the property..." required />
          </div>
        </div>
      </div>

      {/* Location Picker */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-1">Location</h2>
        <p className="text-sm text-slate-400 mb-4 flex items-center gap-1.5">
          <MapPin size={13} /> Search for an address or click on the map
        </p>

        {/* Address Search */}
        <div className="relative mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Search address (e.g. Banani 11, Dhaka)"
                className={inputClass}
              />
              {isSearching && (
                <div className="absolute right-3 top-3.5 animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 rounded-xl transition-colors"
            >
              Search
            </button>
          </div>

          {results.length > 0 && (
            <div className="absolute z-[1001] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {results.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectLocation(res.lat, res.lon, res.display_name)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                >
                  {res.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Latitude</label>
            <input name="latitude" value={formData.latitude} onChange={handleChange} className={inputClass} placeholder="23.8103" required />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input name="longitude" value={formData.longitude} onChange={handleChange} className={inputClass} placeholder="90.4125" required />
          </div>
        </div>
        
        <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 relative">
          {isMounted && (
            <MapContainer
              center={markerPos}
              zoom={12}
              className="w-full h-full"
            >
              <TileLayer url={DEFAULT_TILE_LAYER} subdomains={GOOGLE_SUBDOMAINS} attribution={DEFAULT_ATTRIBUTION} />
              <MapHandler 
                onLocationSelect={(lat, lon) => setFormData(p => ({...p, latitude: lat.toFixed(6), longitude: lon.toFixed(6)}))}
                onBoundaryUpdate={handleBoundaryUpdate}
                onMapClick={handleMapClick}
                onMarkerDrag={handleMapClick}
                initialBoundary={formData.boundary}
                markerPos={markerPos}
              />
            </MapContainer>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-4">Images</h2>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors bg-slate-50 hover:bg-emerald-50">
          <Upload size={20} className="text-slate-400 mb-2" />
          <span className="text-sm text-slate-500">
            {uploadingImages ? 'Uploading...' : 'Click to upload images'}
          </span>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          <Save size={16} />
          {loading ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
