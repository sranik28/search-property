import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const {
      title, price, city, citySlug, address,
      latitude, longitude, bedrooms, bathrooms,
      area_sqft, description, images, status,
      plotNumber, boundary,
    } = body

    const property = await prisma.property.update({
      where: { id: parseInt(id) },
      data: {
        title,
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

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.property.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
