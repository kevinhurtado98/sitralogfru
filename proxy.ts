import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith('/login')
  const isDashboardRoute =
    pathname.startsWith('/comprobantes') ||
    pathname.startsWith('/requerimientos') ||
    pathname.startsWith('/auditoria') ||
    pathname.startsWith('/indicadores')

  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/indicadores', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
