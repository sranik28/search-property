import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [px, py] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bbox = searchParams.get('bbox')
    const polygon = searchParams.get('polygon')

    const where: Record<string, unknown> = { status: 'active' }

    if (city) where.citySlug = city
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice)
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice)
    }
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) }

    let properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Filter by bounding box
    if (bbox) {
      const [west, south, east, north] = bbox.split(',').map(Number)
      properties = properties.filter(
        (p: any) =>
          p.longitude >= west &&
          p.longitude <= east &&
          p.latitude >= south &&
          p.latitude <= north
      )
    }

    // Filter by drawn polygon
    if (polygon) {
      const coords = JSON.parse(polygon) as [number, number][]
      properties = properties.filter((p: any) =>
        pointInPolygon([p.longitude, p.latitude], coords)
      )
    }

    const processedProperties = properties.map(p => ({
      ...p,
      images: JSON.parse(p.images as string || '[]') as string[]
    }))

    return NextResponse.json(processedProperties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}
