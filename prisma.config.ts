import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// En local carga .env; en Vercel las vars ya están inyectadas → no-op
config()

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

export default defineConfig({
  datasource: {
    url: DB_HOST
      ? `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD ?? '')}@${DB_HOST}:${DB_PORT ?? 3306}/${DB_NAME}`
      : undefined,
  },
})
