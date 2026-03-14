'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'

const PRICE_OPTIONS = [
  { label: 'Any', value: null },
  { label: '$100K', value: 100000 },
  { label: '$250K', value: 250000 },
  { label: '$500K', value: 500000 },
  { label: '$750K', value: 750000 },
  { label: '$1M', value: 1000000 },
]

const BEDROOM_OPTIONS = [
  { label: 'Any', value: null },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
]

export default function FilterBar() {
  const { filters, setFilters } = useMapStore()
  const [open, setOpen] = useState(false)

  const hasFilters =
    filters.minPrice !== null || filters.maxPrice !== null || filters.bedrooms !== null

  function clearFilters() {
    setFilters({ minPrice: null, maxPrice: null, bedrooms: null })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border ${
          hasFilters
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
        }`}
      >
        <SlidersHorizontal size={15} />
        Filters
        {hasFilters && (
          <span className="bg-white text-emerald-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl p-5 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Filter Properties</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Min Price
            </label>
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setFilters({ minPrice: opt.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filters.minPrice === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Max Price
            </label>
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value) + '-max'}
                  onClick={() => setFilters({ maxPrice: opt.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filters.maxPrice === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Bedrooms
            </label>
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value) + '-bed'}
                  onClick={() => setFilters({ bedrooms: opt.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filters.bedrooms === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  )
}
