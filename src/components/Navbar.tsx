'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Home, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useMapStore } from '@/store/mapStore'

export default function Navbar() {
  const [search, setSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const { setFlyToLocation } = useMapStore()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return

    setIsSearching(true)
    try {
      // 1. Try to see if it's a known city slug in our DB
      const res = await axios.get('/api/cities')
      const cities = res.data
      const matchedCity = cities.find((c: any) => 
        c.name.toLowerCase() === search.trim().toLowerCase() || 
        c.slug === search.trim().toLowerCase()
      )

      if (matchedCity) {
        router.push(`/city/${matchedCity.slug}`)
        setFlyToLocation({ lat: matchedCity.latitude, lng: matchedCity.longitude, zoom: matchedCity.zoomLevel })
        setSearch('')
        return
      }

      // 2. Otherwise, use geocoding to find the area
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search + ', Bangladesh')}&limit=1`)
      if (geoRes.data?.[0]) {
        const result = geoRes.data[0]
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)

        // Try to find the nearest city in our DB to redirect to the right page
        // For simplicity, if we are already on a city page, just fly there. 
        // If not, we go to the first city page as a default map view.
        if (!window.location.pathname.startsWith('/city/')) {
          router.push(`/city/dhaka`)
        }
        
        setTimeout(() => {
          setFlyToLocation({ lat, lng: lon, zoom: 15 })
        }, 500)
        setSearch('')
      }
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg hidden sm:block">EstateMap</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/city/andalusia" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors">
            Buy
          </Link>
          <Link href="/admin/login" className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
            Admin
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 px-4 py-3 bg-white">
          <Link href="/city/andalusia" className="block py-2 text-sm font-medium text-slate-600">Buy</Link>
          <Link href="/admin/login" className="block py-2 text-sm font-semibold text-emerald-600">Admin</Link>
        </div>
      )}
    </nav>
  )
}
