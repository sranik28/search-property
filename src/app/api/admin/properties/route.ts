import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      title,
      price,
      city,
      citySlug,
      address,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      area_sqft,
      description,
      images,
      status,
      plotNumber,
      boundary,
    } = body

    const slug = slugify(title) + '-' + Date.now()

    const property = await prisma.property.create({
      data: {
        title,
        slug,
        price: parseFloat(price),
        city,
        citySlug,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseFloat(bathrooms),
        area_sqft: parseInt(area_sqft),
        description,
        images: JSON.stringify(images || []),
        status: status || 'active',
        plotNumber,
        boundary,
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
