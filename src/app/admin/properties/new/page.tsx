import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PropertyForm from '@/components/admin/PropertyForm'
import { ChevronLeft } from 'lucide-react'

export default async function NewPropertyPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')

  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-lg mx-auto px-6 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Add New Property</h1>
        <PropertyForm cities={cities} />
      </div>
    </div>
  )
}
