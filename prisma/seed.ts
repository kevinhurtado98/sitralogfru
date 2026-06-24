import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import bcrypt from "bcryptjs";

const adapter = new PrismaMssql({
  server: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Roles ───────────────────────────────────────────────────────────────
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: "ADMIN" },
    update: {},
    create: { nombre: "ADMIN", descripcion: "Acceso total al sistema" },
  });

  await prisma.rol.upsert({
    where: { nombre: "ASISTENTE" },
    update: {},
    create: { nombre: "ASISTENTE", descripcion: "Acceso estándar al sistema" },
  });

  // ─── Usuario admin ───────────────────────────────────────────────────────
  const hash = await bcrypt.hash("12345678", 12);

  await prisma.user.upsert({
    where: { email: "admin@fruchincha.pe" },
    update: {},
    create: {
      nombres: "Administrador",
      apellidos: "",
      email: "admin@fruchincha.pe",
      password: hash,
      rolId: rolAdmin.id,
    },
  });

  console.log("Seed completado: roles + admin@fruchincha.pe / 12345678");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
