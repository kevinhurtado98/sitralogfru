import { PrismaClient } from '@prisma/client'

function buildUrl(): string | null {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
  if (!DB_HOST) return null
  return `sqlserver://${DB_HOST}:${DB_PORT ?? 1433};database=${DB_NAME};user=${DB_USER};password=${DB_PASSWORD};encrypt=false;trustServerCertificate=true`
}

function createPrismaClient() {
  const url = buildUrl()
  return url
    ? new PrismaClient({ datasources: { db: { url } } })
    : new PrismaClient()
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
