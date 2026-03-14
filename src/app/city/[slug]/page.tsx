import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CityPageClient from './CityPageClient'

interface CityPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CityPageProps) {
  const { slug } = await params
  const city = await prisma.city.findUnique({ where: { slug } })
  return {
    title: city ? `Homes for Sale in ${city.name} – EstateMap` : 'City Not Found',
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params
  const city = await prisma.city.findUnique({ where: { slug } })

  if (!city) {
    notFound()
  }

  return (
    <CityPageClient
      cityName={city.name}
      citySlug={city.slug}
      latitude={city.latitude}
      longitude={city.longitude}
      zoomLevel={city.zoomLevel}
    />
  )
}
