'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { Upload, X, MapPin, Save } from 'lucide-react'
import { MAPBOX_TOKEN, DEFAULT_MAP_STYLE } from '@/lib/mapbox'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

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
    latitude: String(initialData?.latitude || ''),
    longitude: String(initialData?.longitude || ''),
    bedrooms: String(initialData?.bedrooms || ''),
    bathrooms: String(initialData?.bathrooms || ''),
    area_sqft: String(initialData?.area_sqft || ''),
    description: (initialData?.description as string) || '',
    status: (initialData?.status as string) || 'active',
    plotNumber: (initialData?.plotNumber as string) || '',
    boundary: (initialData?.boundary as string) || 'null',
  })

  // Map location picker
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`)
      setResults(res.data)
      // Auto-select first result if found
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
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    setFormData((prev) => ({
      ...prev,
      latitude: latNum.toFixed(6),
      longitude: lonNum.toFixed(6),
    }))

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lonNum, latNum], zoom: 16 })
      
      if (markerRef.current) {
        markerRef.current.setLngLat([lonNum, latNum])
      } else {
        markerRef.current = new mapboxgl.Marker({ color: '#10b981', draggable: true })
          .setLngLat([lonNum, latNum])
          .addTo(mapRef.current)
      }
    }
    setResults([])
    setSearchQuery(displayName)
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [
        formData.longitude ? parseFloat(formData.longitude) : 90.4125,
        formData.latitude ? parseFloat(formData.latitude) : 23.8103,
      ],
      zoom: 10,
    })

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'simple_select',
    })
    map.addControl(draw)

    map.on('load', () => {
      if (formData.boundary && formData.boundary !== 'null') {
        try {
          const boundaryData = JSON.parse(formData.boundary)
          if (boundaryData) {
            draw.add({
              type: 'Feature',
              geometry: boundaryData,
              properties: {},
            })
          }
        } catch (e) {
          console.error('Failed to parse boundary', e)
        }
      }
    })

    const updateBoundary = () => {
      const data = draw.getAll()
      if (data.features.length > 0) {
        setFormData(prev => ({ ...prev, boundary: JSON.stringify(data.features[0].geometry) }))
      } else {
        setFormData(prev => ({ ...prev, boundary: 'null' }))
      }
    }

    map.on('draw.create', updateBoundary)
    map.on('draw.update', updateBoundary)
    map.on('draw.delete', updateBoundary)

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }))
      if (markerRef.current) markerRef.current.setLngLat([lng, lat])
      else {
        markerRef.current = new mapboxgl.Marker({ color: '#10b981', draggable: true })
          .setLngLat([lng, lat])
          .addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLngLat()
          setFormData((prev) => ({
            ...prev,
            latitude: pos.lat.toFixed(6),
            longitude: pos.lng.toFixed(6),
          }))
        })
      }
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
  const labelClass = 'block text-sm font-semibold text-slate-600 mb-1.5'

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
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
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
        <div ref={mapContainerRef} className="w-full h-72 rounded-xl overflow-hidden border border-slate-200" />
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
