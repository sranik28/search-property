import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL?.startsWith('file:')
          ? `file:${path.join(process.cwd(), 'prisma/dev.db')}`
          : process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma/dev.db')}`,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
