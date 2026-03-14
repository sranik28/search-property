// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const CITIES = [
  { name: 'Dhaka', slug: 'dhaka', latitude: 23.8103, longitude: 90.4125, zoomLevel: 11 },
  { name: 'Chittagong', slug: 'chittagong', latitude: 22.3569, longitude: 91.7832, zoomLevel: 11 },
  { name: 'Sylhet', slug: 'sylhet', latitude: 24.8949, longitude: 91.8687, zoomLevel: 12 },
  { name: 'Rajshahi', slug: 'rajshahi', latitude: 24.3745, longitude: 88.6042, zoomLevel: 12 },
  { name: 'Khulna', slug: 'khulna', latitude: 22.8456, longitude: 89.5403, zoomLevel: 12 },
]

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800',
  'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}

function slugify(text: string, id: number): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + id
}

const STREET_NAMES = [
  'Banani Road 11', 'Gulshan Avenue', 'Dhanmondi 27', 'Uttara Sector 7', 'Mirpur DOHS',
  'Puran Dhaka Lane', 'Baridhara J Block', 'Bashundhara R/A', 'Mohammadpur Housing', 'Wari Street',
]

const PROPERTY_TYPES = [
  'Charming Ranch Home', 'Modern Family House', 'Luxury Estate', 'Cozy Cottage',
  'Contemporary Split-Level', 'Classic Colonial', 'Spacious Craftsman', 'Updated Bungalow',
  'Executive Home', 'Stunning Villa',
]

const DESCRIPTIONS = [
  'This beautifully updated home features an open floor plan, gourmet kitchen, and a spacious backyard. Perfect for entertaining and everyday living.',
  'Nestled in a quiet neighborhood, this property boasts hardwood floors throughout, a chef\'s kitchen, and a master suite with a spa-like bath.',
  'A rare find! This stunning home offers sweeping views, a modern kitchen with stainless steel appliances, and a large deck perfect for outdoor dining.',
  'Move-in ready! This well-maintained property includes a fully renovated kitchen, new roof, and updated HVAC. Situated on a large corner lot.',
  'Elegantly updated throughout, this home features soaring ceilings, custom built-ins, and a private backyard oasis with mature landscaping.',
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.property.deleteMany()
  await prisma.city.deleteMany()

  // Seed cities
  const createdCities = await Promise.all(
    CITIES.map((city) => prisma.city.create({ data: city }))
  )
  console.log(`✅ Created ${createdCities.length} cities`)

  // Seed properties (10 per city)
  const properties: any[] = []
  for (const city of createdCities) {
    for (let i = 0; i < 10; i++) {
      const beds = randInt(2, 5)
      const baths = [1, 1.5, 2, 2.5, 3][randInt(0, 4)]
      const sqft = randInt(1000, 4500)
      const price = Math.round(rand(120000, 1200000) / 1000) * 1000
      const streetNum = randInt(100, 9999)
      const street = STREET_NAMES[randInt(0, STREET_NAMES.length - 1)]
      const propType = PROPERTY_TYPES[randInt(0, PROPERTY_TYPES.length - 1)]
      const title = `${beds}BR ${propType}`
      const address = `${streetNum} ${street}, ${city.name}`
      const id = properties.length + 1
      const images = JSON.stringify([
        UNSPLASH_IMAGES[randInt(0, UNSPLASH_IMAGES.length - 1)],
        UNSPLASH_IMAGES[randInt(0, UNSPLASH_IMAGES.length - 1)],
        UNSPLASH_IMAGES[randInt(0, UNSPLASH_IMAGES.length - 1)],
      ])

      // Scatter markers within ~0.1 degrees of city center
      const latOffset = rand(-0.08, 0.08)
      const lngOffset = rand(-0.08, 0.08)

      properties.push({
        title,
        slug: slugify(title, id),
        price,
        city: city.name,
        citySlug: city.slug,
        address,
        latitude: city.latitude + latOffset,
        longitude: city.longitude + lngOffset,
        bedrooms: beds,
        bathrooms: baths,
        area_sqft: sqft,
        description: DESCRIPTIONS[randInt(0, DESCRIPTIONS.length - 1)],
        images,
        status: 'active',
      })
    }
  }

  await prisma.property.createMany({ data: properties })
  console.log(`✅ Created ${properties.length} properties`)
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
