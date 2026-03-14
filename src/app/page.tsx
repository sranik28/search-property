import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MapPin, TrendingUp, Home, Search } from 'lucide-react'

export default async function HomePage() {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } })

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-40 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 text-emerald-300 text-sm font-medium mb-6">
            <TrendingUp size={14} />
            50+ Listings Available
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Find Your Dream<br />
            <span className="text-emerald-400">Home on the Map</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            Browse thousands of listings visually. Search by area, draw custom zones, and find the perfect home.
          </p>

          {/* City Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/city/${city.slug}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105"
              >
                <MapPin size={14} className="text-emerald-400 shrink-0" />
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-screen-lg mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: 'Search a City', desc: 'Pick any city to instantly load thousands of listings on an interactive map.' },
            { icon: MapPin, title: 'Explore on Map', desc: 'Click markers to preview properties. Draw custom areas to narrow your search.' },
            { icon: Home, title: 'View Details', desc: 'See full photo galleries, floor plans, and contact agents directly from any listing.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <Icon size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cities */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-screen-lg mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Browse by City</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cities.map((city) => (
              <Link key={city.id} href={`/city/${city.slug}`}>
                <div className="group bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{city.name}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">View listings →</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors">
                      <MapPin size={18} className="text-emerald-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}