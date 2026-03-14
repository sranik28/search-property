import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PropertyForm from '@/components/admin/PropertyForm'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPropertyPage({ params }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')

  const { id } = await params
  const [property, cities] = await Promise.all([
    prisma.property.findUnique({ where: { id: parseInt(id) } }),
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!property) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-lg mx-auto px-6 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Property</h1>
        <PropertyForm
          initialData={JSON.parse(JSON.stringify(property))}
          cities={cities}
          isEdit
          propertyId={property.id}
        />
      </div>
    </div>
  )
}
