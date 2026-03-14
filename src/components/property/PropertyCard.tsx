'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Property } from '@/store/mapStore'
import { formatPrice } from '@/lib/mapbox'
import { BedDouble, Bath, Maximize2, MapPin } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  isHighlighted?: boolean
}

export default function PropertyCard({ property, isHighlighted }: PropertyCardProps) {
  return (
    <Link href={`/property/${property.slug}`}>
      <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${
        isHighlighted ? 'border-emerald-500 shadow-md scale-[1.01]' : 'border-transparent'
      }`}>
        <div className="relative h-44">
          {property.images[0] ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm">No Image</span>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            For Sale
          </div>
        </div>
        <div className="p-4">
          <div className="text-xl font-bold text-slate-800 mb-1">{formatPrice(property.price)}</div>
          <h3 className="font-semibold text-slate-700 mb-1 line-clamp-1">{property.title}</h3>
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
            <MapPin size={12} />
            <span className="line-clamp-1">{property.address}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <BedDouble size={15} className="text-emerald-500" />
              <span>{property.bedrooms} bd</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath size={15} className="text-emerald-500" />
              <span>{property.bathrooms} ba</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 size={15} className="text-emerald-500" />
              <span>{property.area_sqft.toLocaleString()} sqft</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
