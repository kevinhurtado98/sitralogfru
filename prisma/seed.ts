import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
const prisma = new PrismaClient({ adapter })

const AREAS_DATA = [
  { nombre: 'Certificaciones', color: '#E1F5EE', tc: '#0F6E56', responsables: [{ nombres: 'Yannina', apellidos: 'Levano',  correo: 'ylevano@fruchincha.com.pe'  }] },
  { nombre: 'Mantenimiento',   color: '#FAEEDA', tc: '#633806', responsables: [{ nombres: 'Wladimir', apellidos: '',        correo: 'wladimir@fruchincha.com.pe' }] },
  { nombre: 'Sistemas',        color: '#E6F1FB', tc: '#0C447C', responsables: [{ nombres: 'Victor',   apellidos: '',        correo: 'victor@fruchincha.com.pe'   }] },
  { nombre: 'Saneamiento',     color: '#FBEAF0', tc: '#72243E', responsables: [{ nombres: 'Maria',    apellidos: 'Moreno',  correo: 'mmoreno@fruchincha.com.pe'  }] },
  { nombre: 'Logística',       color: '#E6F1FB', tc: '#0C447C', responsables: [{ nombres: 'K.',       apellidos: 'Hurtado', correo: 'khurtado@fruchincha.com.pe' }] },
  { nombre: 'Almacén',         color: '#EAF3DE', tc: '#27500A', responsables: [{ nombres: 'R.',       apellidos: 'Torres',  correo: 'rtorres@fruchincha.com.pe'  }] },
  { nombre: 'Compras',         color: '#FAEEDA', tc: '#633806', responsables: [{ nombres: 'M.',       apellidos: 'Ríos',    correo: 'mrios@fruchincha.com.pe'    }] },
  { nombre: 'Operaciones',     color: '#f0ede8', tc: '#6b6b65', responsables: [{ nombres: 'J.',       apellidos: 'Vargas',  correo: 'jvargas@fruchincha.com.pe'  }] },
]

async function main() {
  const hash = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@fruchincha.pe' },
    update: {},
    create: {
      nombres: 'Administrador',
      apellidos: '',
      email: 'admin@fruchincha.pe',
      password: hash,
      rol: 'ADMIN',
    },
  })

  for (const a of AREAS_DATA) {
    const area = await prisma.area.upsert({
      where:  { nombre: a.nombre },
      update: { color: a.color, tc: a.tc },
      create: { nombre: a.nombre, color: a.color, tc: a.tc },
    })
    for (const r of a.responsables) {
      await prisma.responsable.upsert({
        where:  { correo: r.correo },
        update: { nombres: r.nombres, apellidos: r.apellidos, areaId: area.id },
        create: { nombres: r.nombres, apellidos: r.apellidos, correo: r.correo, areaId: area.id },
      })
    }
  }

  console.log('Seed completado: admin@fruchincha.pe / admin123 + áreas y responsables')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
