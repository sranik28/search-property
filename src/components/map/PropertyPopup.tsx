'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Property } from '@/store/mapStore'
import { formatPrice } from '@/lib/mapbox'
import { BedDouble, Bath, Maximize2, X } from 'lucide-react'

interface PropertyPopupProps {
  property: Property
  onClose: () => void
}

export default function PropertyPopup({ property, onClose }: PropertyPopupProps) {
  return (
    <div className="property-popup bg-white rounded-2xl shadow-2xl overflow-hidden w-[300px]">
      <div className="relative h-40 w-full">
        {property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <span className="text-slate-400 text-sm">No Image</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow hover:bg-white transition-colors"
        >
          <X size={14} className="text-slate-600" />
        </button>
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold text-emerald-600">
          {property.status === 'active' ? 'For Sale' : property.status}
        </div>
      </div>
      <div className="p-4">
        <div className="text-2xl font-bold text-slate-800 mb-1">
          {formatPrice(property.price)}
        </div>
        <div className="text-sm text-slate-500 mb-3 truncate">{property.address}</div>
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1.5">
            <BedDouble size={16} className="text-emerald-500" />
            <span>{property.bedrooms} bd</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath size={16} className="text-emerald-500" />
            <span>{property.bathrooms} ba</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 size={16} className="text-emerald-500" />
            <span>{property.area_sqft.toLocaleString()} sqft</span>
          </div>
        </div>
        <Link
          href={`/property/${property.slug}`}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors duration-200"
        >
          View Property
        </Link>
      </div>
    </div>
  )
}
