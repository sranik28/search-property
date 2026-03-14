import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/mapbox'
import { Plus, Home, Pencil, Trash2 } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')

  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <h1 className="font-bold text-slate-800 text-lg">EstateMap Admin</h1>
        </div>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} />
          Add Property
        </Link>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Properties', value: properties.length },
            { label: 'Active Listings', value: properties.filter(p => p.status === 'active').length },
            { label: 'Cities', value: cities.length },
            { label: 'Total Value', value: `$${(properties.reduce((s, p) => s + p.price, 0) / 1_000_000).toFixed(1)}M` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="text-2xl font-extrabold text-slate-800">{value}</div>
              <div className="text-sm text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Properties</h2>
            <span className="text-sm text-slate-400">{properties.length} listings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">City</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Beds</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 max-w-xs truncate">{property.title}</div>
                      <div className="text-xs text-slate-400 truncate">{property.address}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{formatPrice(property.price)}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{property.city}</td>
                    <td className="px-6 py-4 text-slate-600">{property.bedrooms}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        property.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/properties/${property.id}/edit`}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                        >
                          <Pencil size={15} />
                        </Link>
                        <Link
                          href={`/admin/properties/${property.id}/delete`}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
