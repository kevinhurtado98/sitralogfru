import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, string> = {}

  // Verificar conexión a la BD
  try {
    const count = await prisma.user.count()
    checks.db = `OK — ${count} usuario(s) en la BD`
  } catch (e) {
    checks.db = `ERROR — ${e instanceof Error ? e.message : String(e)}`
  }

  // Verificar que AUTH_SECRET esté seteado
  checks.auth_secret = process.env.AUTH_SECRET
    ? `OK — seteado (${process.env.AUTH_SECRET.length} chars)`
    : 'ERROR — no seteado'

  // Verificar que AUTH_URL esté seteado
  checks.auth_url = process.env.AUTH_URL ?? process.env.VERCEL_URL ?? 'no seteado'

  // Verificar variables de BD
  checks.db_host = process.env.DB_HOST ?? 'no seteado'
  checks.db_name = process.env.DB_NAME ?? 'no seteado'
  checks.db_user = process.env.DB_USER ?? 'no seteado'
  checks.db_password = process.env.DB_PASSWORD ? `seteado (${process.env.DB_PASSWORD.length} chars)` : 'no seteado'

  return NextResponse.json(checks)
}
