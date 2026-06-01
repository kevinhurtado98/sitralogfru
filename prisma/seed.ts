import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMssql } from '@prisma/adapter-mssql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMssql({
  server:   process.env.DB_HOST ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 1433),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options:  { encrypt: false, trustServerCertificate: true },
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where:  { email: 'admin@fruchincha.pe' },
    update: {},
    create: {
      nombres:   'Administrador',
      apellidos: '',
      email:     'admin@fruchincha.pe',
      password:  hash,
      rol:       'ADMIN',
    },
  })

  console.log('Seed completado: admin@fruchincha.pe / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
