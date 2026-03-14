import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/mapbox'
import { BedDouble, Bath, Maximize2, MapPin, ChevronLeft, Phone, Mail } from 'lucide-react'
import PropertyDetailMap from '@/components/map/PropertyDetailMap'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const property = await prisma.property.findUnique({ where: { slug } })
  return {
    title: property ? `${property.title} – EstateMap` : 'Property Not Found',
    description: property?.description?.slice(0, 160),
  }
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params
  const rawProperty = await prisma.property.findUnique({ where: { slug } })

  if (!rawProperty) notFound()

  const property = {
    ...rawProperty,
    images: JSON.parse(rawProperty.images as string || '[]') as string[],
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={property.citySlug ? `/city/${property.citySlug}` : '/'}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to {property.city} listings
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100">
            {property.images.length > 0 ? (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 md:h-[420px]">
                {/* Main image */}
                <div className="col-span-3 row-span-2 relative">
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover rounded-l-2xl"
                    priority
                  />
                </div>
                {/* Thumbnails */}
                <div className="col-span-1 row-span-1 relative">
                  {property.images[1] && (
                    <Image
                      src={property.images[1]}
                      alt={`${property.title} 2`}
                      fill
                      className="object-cover rounded-tr-2xl"
                    />
                  )}
                </div>
                <div className="col-span-1 row-span-1 relative">
                  {property.images[2] && (
                    <Image
                      src={property.images[2]}
                      alt={`${property.title} 3`}
                      fill
                      className="object-cover rounded-br-2xl"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400">No images available</div>
            )}
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: BedDouble, label: 'Bedrooms', value: `${property.bedrooms}` },
              { icon: Bath, label: 'Bathrooms', value: `${property.bathrooms}` },
              { icon: Maximize2, label: 'Square Feet', value: property.area_sqft.toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center">
                <Icon size={22} className="text-emerald-600 mx-auto mb-2" />
                <div className="font-bold text-slate-800 text-lg">{value}</div>
                <div className="text-slate-400 text-xs">{label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">About This Home</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-100" style={{ height: 300 }}>
            <PropertyDetailMap
              latitude={property.latitude}
              longitude={property.longitude}
              title={property.title}
            />
          </div>
        </div>

        {/* Right column – Sticky sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sticky top-24">
            {/* Price */}
            <div className="text-3xl font-extrabold text-slate-800 mb-1">
              {formatPrice(property.price)}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
              For Sale
            </div>
            <h1 className="text-lg font-bold text-slate-800 mb-2">{property.title}</h1>
            <div className="flex items-start gap-1.5 text-slate-500 text-sm mb-6">
              <MapPin size={15} className="shrink-0 mt-0.5 text-emerald-500" />
              {property.address}
            </div>

            {/* Contact form */}
            <form className="space-y-3">
              <h3 className="font-bold text-slate-700">Contact Agent</h3>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <textarea
                rows={3}
                placeholder={`I'm interested in ${property.title}...`}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Send Message
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
              <a href="tel:+1234567890" className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-emerald-400 transition-colors">
                <Phone size={14} /> Call
              </a>
              <a href="mailto:agent@estate.com" className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-emerald-400 transition-colors">
                <Mail size={14} /> Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
