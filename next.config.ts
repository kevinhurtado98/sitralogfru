import type { NextConfig } from 'next'
import pkg from './package.json'

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/.pnpm/**/@prisma+client*/**',
      './node_modules/.pnpm/**/@prisma+engines*/**',
    ],
  },
  env: {
    // Disponible en cliente y servidor como process.env.NEXT_PUBLIC_APP_VERSION
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
}

export default nextConfig
