import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

config()

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

export default defineConfig({
  datasource: {
    url: DB_HOST
      ? `sqlserver://${DB_HOST}:${DB_PORT ?? 1433};database=${DB_NAME};user=${DB_USER};password=${DB_PASSWORD};encrypt=false;trustServerCertificate=true`
      : undefined,
  },
})
