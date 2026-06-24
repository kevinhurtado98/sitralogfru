# SITRALOGFRU

Sistema de gestión de **Comprobantes (facturas)** y **Requerimientos** de áreas internas, con auditoría, alertas automáticas por correo, reportes y exportación a Excel.

Construido con **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM** sobre **SQL Server**, **NextAuth v5** y **Resend** para el envío de correos.

---

## Tabla de contenidos

1. [¿Qué problema resuelve?](#qué-problema-resuelve)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Módulos del sistema](#módulos-del-sistema)
5. [Mapa de rutas](#mapa-de-rutas)
6. [Modelo de datos](#modelo-de-datos)
7. [Autenticación y roles](#autenticación-y-roles)
8. [Auditoría](#auditoría)
9. [Correos y alertas automáticas](#correos-y-alertas-automáticas)
10. [Exportación a Excel](#exportación-a-excel)
11. [Reportes e indicadores](#reportes-e-indicadores)
12. [Variables de entorno](#variables-de-entorno)
13. [Scripts disponibles](#scripts-disponibles)
14. [Puesta en marcha local](#puesta-en-marcha-local)
15. [Despliegue](#despliegue)

---

## ¿Qué problema resuelve?

SITRALOGFRU centraliza dos flujos de trabajo de una empresa (los correos de alerta apuntan al dominio `fruchincha.com.pe`):

- **Comprobantes (facturas de proveedores):** registro del ciclo de vida de una factura — carga desde XML (SUNAT/UBL) o registro manual, cálculo de vencimiento y semana de pago, registro contable, notas de crédito/débito, y alertas cuando una factura vence sin pagarse.
- **Requerimientos:** solicitudes de compra o servicio creadas por distintas áreas de la empresa, asignadas a un responsable, con seguimiento de estado y cálculo automático de días de retraso cuando no se atienden a tiempo.

Sobre estos dos flujos se apoyan módulos transversales de **autenticación con roles**, **auditoría de todas las acciones**, **alertas automáticas por correo**, **reportes con gráficos** y **exportación a Excel**.

---

## Stack tecnológico

| Categoría                    | Tecnología                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| Framework                    | Next.js 16 (App Router) + React 19 + TypeScript                           |
| Base de datos                | SQL Server, vía Prisma ORM (`@prisma/client`, `@prisma/adapter-mssql`)    |
| Autenticación                | NextAuth v5 (beta) con `Credentials` provider, sesiones JWT               |
| Hash de contraseñas          | bcryptjs                                                                  |
| Validación                   | Zod + React Hook Form                                                     |
| UI                           | Radix UI, Tailwind CSS v4, Lucide / Tabler icons, Sonner (toasts), Motion |
| Correos                      | Resend + React Email (`@react-email/components`, `@react-email/tailwind`) |
| Excel                        | ExcelJS                                                                   |
| PDF                          | `@react-pdf/renderer`                                                     |
| Gráficos                     | Recharts                                                                  |
| Parsing XML (facturas SUNAT) | fast-xml-parser                                                           |
| Fechas                       | date-fns                                                                  |
| Gestor de paquetes           | pnpm                                                                      |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/             # Página de login (pública)
│   ├── (dashboard)/              # Todas las rutas protegidas
│   │   ├── dashboard/            # Indicadores / KPIs
│   │   ├── comprobantes/         # Listado, alta XML, alta manual, detalle
│   │   ├── requerimientos/       # Listado, alta, detalle/seguimiento
│   │   ├── reportes/             # Reportes con gráficos
│   │   ├── auditoria/            # Bitácora de acciones
│   │   ├── configuracion/        # Usuarios, áreas, correos de prueba (admin)
│   │   └── perfil/               # Cambio de contraseña
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth
│       ├── comprobantes/         # Subida de XML, export Excel
│       ├── requerimientos/       # Export Excel, subida de imagen de evidencia
│       ├── reportes/             # Ejecución de reportes / export PDF
│       ├── cron/                 # Jobs diarios (facturas y requerimientos)
│       └── health/                # Health check
├── components/                   # Componentes de UI por módulo (client components)
├── emails/                        # Plantillas React Email
├── lib/
│   ├── actions/                  # Server Actions (mutaciones de datos)
│   ├── auth.ts                   # Configuración de NextAuth
│   ├── email.ts                  # Envío de correos vía Resend
│   ├── excel.ts                  # Generación de archivos .xlsx
│   ├── xml-parser.ts             # Parser de XML SUNAT/UBL
│   ├── semana-pago.ts            # Cálculo de semana/viernes de pago
│   ├── reportes.ts               # Lógica de reportes (server-only)
│   ├── reportes-catalogo.ts      # Catálogo de reportes (compartido cliente/servidor)
│   ├── prisma.ts                 # Cliente Prisma singleton
│   └── types.ts                  # Enums propios (SQL Server no soporta enum nativo en Prisma)
└── types/next-auth.d.ts          # Tipado extendido de la sesión

prisma/
├── schema.prisma                 # Modelo de datos
└── seed.ts                       # Seed de roles + usuario administrador
```

---

## Módulos del sistema

### 1. Autenticación

- `src/lib/auth.ts`, `src/lib/actions/auth.ts`, `src/components/auth/LoginForm.tsx`
- Login por correo + contraseña, sesión JWT de 8 horas, contraseña hasheada con bcrypt.
- Dos roles: **ADMIN** (acceso total, incluida configuración) y **ASISTENTE** (operación diaria).

### 2. Comprobantes (facturas)

- `src/lib/actions/comprobantes.ts`, `src/app/api/comprobantes/upload`, `src/lib/xml-parser.ts`, `src/lib/semana-pago.ts`
- Alta de facturas por **carga de XML** (parseo SUNAT/UBL, valida que no sea nota de crédito/débito, evita duplicados por serie+número) o por **registro manual**.
- Calcula automáticamente: estado (`PENDIENTE` / `POR_VENCER` / `VENCIDA` / `PAGADA`), semana de pago y viernes de abono, monto neto (monto − retención − detracción).
- Permite asociar **notas de crédito** y **notas de débito** a una factura, marcar registro contable y fecha de pago.

### 3. Requerimientos

- `src/lib/actions/requerimientos.ts`
- Solicitudes de compra/servicio creadas por un área, asignadas a un responsable, con prioridad (`ALTA`/`MEDIA`) y fecha estimada de atención.
- Estados: `PENDIENTE` → `ATENDIDO_TOTAL` / `ATENDIDO_PARCIAL` / `GESTION_REALIZADA` / `NO_ATENDIDO`.
- Cada cambio de estado queda en un **historial** con observación e, opcionalmente, una imagen de evidencia.
- Un cron diario marca como `NO_ATENDIDO` los requerimientos que vencieron su plazo y calcula los días de retraso.

### 4. Auditoría

- Modelo `AuditLog`. Cada Server Action relevante (crear/editar/eliminar facturas, requerimientos, usuarios, áreas, login, etc.) registra quién, qué módulo, qué acción y los datos antes/después.
- Vista filtrable en `/auditoria`.

### 5. Correos y alertas

- `src/lib/email.ts` + plantillas en `src/emails/` (React Email, enviadas vía Resend).
- Tres tipos de correo: bienvenida (al crear usuario), facturas vencidas y requerimientos sin atender — ver detalle [más abajo](#correos-y-alertas-automáticas).

### 6. Reportes e indicadores

- `src/lib/reportes.ts` (ejecución, server-only) y `src/lib/reportes-catalogo.ts` (catálogo de reportes disponibles).
- Dashboard con KPIs de facturas y requerimientos, y vista de reportes con tabla + gráfico (Recharts) y exportación a PDF.

### 7. Exportación a Excel

- `src/lib/excel.ts` genera archivos `.xlsx` con ExcelJS, usado en exportación de comprobantes y de requerimientos.

### 8. Configuración (solo ADMIN)

- `src/lib/actions/usuarios.ts`, `areas.ts`, `responsables.ts`
- CRUD de usuarios (con contraseña por defecto y opción de enviar correo de bienvenida), áreas (con color y código de centro de costo) y responsables por área (correo de contacto para alertas).
- Vista de "correos de prueba" para verificar el envío de cada plantilla.

### 9. Perfil

- `src/lib/actions/perfil.ts`: cambio de contraseña propia, validando la contraseña actual.

---

## Mapa de rutas

### Páginas

| Ruta                                | Acceso          | Descripción                               |
| ----------------------------------- | --------------- | ----------------------------------------- |
| `/login`                            | Público         | Inicio de sesión                          |
| `/`                                 | Privado         | Redirige a `/dashboard`                   |
| `/dashboard`                        | Privado         | KPIs e indicadores generales              |
| `/comprobantes`                     | Privado         | Listado y filtros de facturas             |
| `/comprobantes/nuevo`               | Privado         | Alta de factura por XML                   |
| `/comprobantes/nuevo-manual`        | Privado         | Alta de factura manual                    |
| `/comprobantes/[id]`                | Privado         | Detalle, edición, notas de crédito/débito |
| `/requerimientos`                   | Privado         | Listado y filtros de requerimientos       |
| `/requerimientos/nuevo`             | Privado         | Alta de requerimiento                     |
| `/requerimientos/[id]`              | Privado         | Detalle, cambio de estado, historial      |
| `/reportes`                         | Privado         | Selección y visualización de reportes     |
| `/auditoria`                        | Privado         | Bitácora de acciones del sistema          |
| `/configuracion`                    | Privado (ADMIN) | Panel de configuración                    |
| `/configuracion/gestionar-usuarios` | Privado (ADMIN) | CRUD de usuarios                          |
| `/configuracion/gestionar-areas`    | Privado (ADMIN) | CRUD de áreas                             |
| `/configuracion/correos-prueba`     | Privado (ADMIN) | Envío de correos de prueba                |
| `/perfil`                           | Privado         | Cambio de contraseña                      |

### API

| Endpoint                            | Método   | Descripción                                                           |
| ----------------------------------- | -------- | --------------------------------------------------------------------- |
| `/api/auth/[...nextauth]`           | GET/POST | Manejo de sesión (NextAuth)                                           |
| `/api/comprobantes/upload`          | POST     | Carga y parseo de XML de factura                                      |
| `/api/comprobantes/export`          | GET      | Exporta facturas filtradas a Excel                                    |
| `/api/requerimientos/export`        | GET      | Exporta requerimientos a Excel                                        |
| `/api/requerimientos/upload-imagen` | POST     | Sube imagen de evidencia de un requerimiento                          |
| `/api/reportes/[tipo]`              | GET      | Ejecuta un reporte y devuelve datos para tabla/gráfico                |
| `/api/reportes/exportar-pdf`        | POST     | Exporta un reporte a PDF                                              |
| `/api/cron/facturas`                | GET      | Job diario: recalcula estado de facturas y alerta de vencidas         |
| `/api/cron/requerimientos`          | GET      | Job diario: marca requerimientos no atendidos y alerta a responsables |
| `/api/email-preview/[tipo]`         | GET      | Previsualización HTML de una plantilla de correo                      |
| `/api/health`                       | GET      | Health check                                                          |

---

## Modelo de datos

Definido en [`prisma/schema.prisma`](prisma/schema.prisma). Motor: **SQL Server**.

- **`Rol`** — catálogo de roles (`ADMIN`, `ASISTENTE`).
- **`User`** — usuarios del sistema (nombres, correo, contraseña hasheada, rol, activo).
- **`Area`** — áreas de la empresa (nombre, color, código de centro de costo).
- **`Responsable`** — personas responsables de atender requerimientos por área (con correo para alertas).
- **`Factura`** — comprobante de proveedor: serie/número (únicos), montos, retención/detracción, moneda, tipo (compra/servicio), estado, forma de pago, semana y viernes de pago, registro contable, XML asociado.
- **`NotaCredito`** / **`NotaDebito`** — documentos asociados a una factura (cascade delete).
- **`Requerimiento`** — solicitud de un área: prioridad, tipo, descripción, estado, días de retraso, fecha estimada de atención, creador y quien la atendió.
- **`HistorialEstadoRequerimiento`** — registro de cada cambio de estado de un requerimiento (observación, imagen de evidencia, quién lo registró).
- **`AuditLog`** — bitácora general: usuario, módulo, acción, entidad afectada, datos antes/después (JSON).

Notas de implementación:

- Los montos usan `Decimal(12,2)` por precisión contable.
- SQL Server no soporta `enum` en Prisma, por lo que los estados (`estado`, `tipo`, `prioridad`, etc.) son `String` validados en código — ver [`src/lib/types.ts`](src/lib/types.ts).

---

## Autenticación y roles

- **NextAuth v5**, provider `Credentials`, sesión **JWT de 8 horas**.
- Login: `src/lib/actions/auth.ts` valida con Zod, busca el usuario por correo, verifica que esté `activo` y compara la contraseña con `bcrypt.compare`.
- La sesión expone `user.id` y `user.role` (nombre del rol) para autorizar vistas y acciones.
- **Roles:**
  - `ADMIN`: acceso a todos los módulos, incluida la sección de Configuración (usuarios, áreas, correos de prueba).
  - `ASISTENTE`: operación diaria (comprobantes, requerimientos, reportes, auditoría, perfil), sin acceso a Configuración.
- Cambio de contraseña en `/perfil` (revalida la contraseña actual). Un admin puede resetear la contraseña de un usuario al valor por defecto desde Configuración.

---

## Auditoría

Cada acción relevante (alta/edición/eliminación de facturas y requerimientos, cambios de estado, CRUD de usuarios/áreas/responsables, login) escribe un registro en `AuditLog` con:

- quién la realizó (`userId`),
- en qué módulo (`COMPROBANTES`, `REQUERIMIENTOS`, `USUARIOS`, `AUTH`, `CONFIGURACION`),
- qué acción (texto descriptivo),
- la entidad afectada,
- los datos antes y después (JSON).

Consultable y filtrable desde `/auditoria`.

---

## Correos y alertas automáticas

Proveedor: **Resend**. Plantillas en `src/emails/` (React Email), funciones de envío en [`src/lib/email.ts`](src/lib/email.ts).

| Correo                                                           | Cuándo se dispara                                                                  | Destinatario                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Bienvenida (`BienvenidaEmail.tsx`)                               | Al crear un usuario, si se marca la opción de enviar correo                        | El nuevo usuario                                                             |
| Facturas vencidas (`FacturasVencidasEmail.tsx`)                  | Diariamente, vía `GET /api/cron/facturas`, si existen facturas en estado `VENCIDA` | Dirección configurada (por defecto, la del responsable de cuentas por pagar) |
| Requerimientos sin atender (`RequerimientosPendientesEmail.tsx`) | Diariamente, vía `GET /api/cron/requerimientos`                                    | Cada responsable, con sus propios requerimientos `NO_ATENDIDO`               |

Los dos cron jobs están programados en [`vercel.json`](vercel.json) para ejecutarse a las **13:00 UTC** todos los días. Desde `/configuracion/correos-prueba` se puede disparar manualmente cada plantilla para verificar el envío.

---

## Exportación a Excel

`src/lib/excel.ts` expone `generarExcel()` (ExcelJS): genera un workbook con encabezado en negrita y devuelve un `Buffer` listo para descargar. Se usa en:

- `GET /api/comprobantes/export` — exporta facturas según los filtros activos (búsqueda, estado, rango de fechas, semana de pago, registro contable).
- `GET /api/requerimientos/export` — exporta requerimientos según los filtros activos.

---

## Reportes e indicadores

- **Dashboard** (`/dashboard`): KPIs de facturas (totales, vencidas, por vencer, pagadas, pendientes de registro contable) y de requerimientos (por estado, prioridad alta sin atender).
- **Reportes** (`/reportes`): catálogo de reportes predefinidos en `src/lib/reportes-catalogo.ts` (p. ej. facturas vencidas, facturas por vencer, facturas sin registro contable, facturas por forma de pago, requerimientos por estado/prioridad, requerimientos urgentes sin atender), ejecutados vía `GET /api/reportes/[tipo]` y mostrados con tabla + gráfico (Recharts). Exportables a PDF.

---

## Variables de entorno

Ver [`.env.example`](.env.example).

| Variable         | Descripción                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| `DB_HOST`        | Host del servidor SQL Server                                                  |
| `DB_PORT`        | Puerto de conexión (por defecto `1433`)                                       |
| `DB_USER`        | Usuario de la base de datos                                                   |
| `DB_PASSWORD`    | Contraseña de la base de datos                                                |
| `DB_NAME`        | Nombre de la base de datos                                                    |
| `AUTH_SECRET`    | Secreto para firmar los JWT de sesión (generar con `openssl rand -base64 32`) |
| `AUTH_URL`       | URL base de la aplicación (`http://localhost:3000` en desarrollo)             |
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para el envío de correos              |
| `RESEND_FROM`    | Dirección remitente de los correos enviados por la app                        |

> Nota: el comentario "Base de datos MySQL" en `.env.example` está desactualizado — el proyecto usa **SQL Server** (`provider = "sqlserver"` en `prisma/schema.prisma`).

---

## Scripts disponibles

| Script             | Comando                         | Descripción                                                     |
| ------------------ | ------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`         | `next dev`                      | Servidor de desarrollo                                          |
| `pnpm build`       | `prisma generate && next build` | Genera el cliente Prisma y compila la app                       |
| `pnpm start`       | `next start`                    | Sirve la build de producción                                    |
| `pnpm lint`        | `eslint`                        | Linter                                                          |
| `pnpm db:generate` | `prisma generate`               | Genera el cliente Prisma a partir del schema                    |
| `pnpm db:migrate`  | `prisma migrate dev`            | Crea y aplica una migración en desarrollo                       |
| `pnpm db:push`     | `prisma db push`                | Sincroniza el schema con la base de datos sin generar migración |
| `pnpm db:seed`     | `tsx prisma/seed.ts`            | Crea los roles base y el usuario administrador                  |
| `pnpm db:studio`   | `prisma studio`                 | Interfaz web para explorar la base de datos                     |

---

## Puesta en marcha local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# completar DB_*, AUTH_SECRET, AUTH_URL, RESEND_API_KEY, RESEND_FROM

# 3. Generar el cliente Prisma y sincronizar el schema con la base de datos
pnpm db:generate
pnpm db:push

# 4. Crear roles y usuario administrador inicial
pnpm db:seed

# 5. Levantar el servidor de desarrollo
pnpm dev
```

La app queda disponible en `http://localhost:3000`, redirigiendo a `/login`.

---

## Despliegue

- **Docker** ([`Dockerfile`](Dockerfile)): build multi-stage (`deps` → `builder` → `runner`) sobre `node:22-alpine`, salida `standalone` de Next.js, usuario no-root, puerto `3000`.
- **Vercel Crons** ([`vercel.json`](vercel.json)): ejecuta `/api/cron/facturas` y `/api/cron/requerimientos` todos los días a las 13:00 UTC.
- **CI/CD** ([`.github/workflows/`](.github/workflows/)): al hacer push a `main` se construye y publica la imagen Docker en GitHub Container Registry y se despliega por SSH a un VPS, aplicando schema (`db:push`) y seed contra la base de datos de destino.

> ⚠️ El workflow de despliegue actual **recrea la base de datos** en cada deploy (`DROP DATABASE` + `CREATE DATABASE` + `db:push` + `db:seed`). Tenerlo en cuenta antes de desplegar a un entorno con datos que se quieran conservar.
