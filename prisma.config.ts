import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

config()

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

export default defineConfig({
  datasource: {
    url: `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD ?? '')}@${DB_HOST}:${DB_PORT ?? 3306}/${DB_NAME}`,
  },
})
