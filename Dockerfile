FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ─── Etapa 1: instalar dependencias ──────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds

# ─── Etapa 2: construir la app ────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compilar seed.ts → seed.cjs para no necesitar tsx en producción
RUN node_modules/.bin/esbuild prisma/seed.ts \
    --bundle --platform=node --format=cjs \
    --outfile=prisma/seed.cjs \
    --external:@prisma/client \
    --external:@prisma/adapter-mssql
RUN pnpm run build

# ─── Etapa 3: imagen final mínima ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# App Next.js standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

# Prisma CLI + cliente para migraciones y seed al arrancar
# (.prisma ya no existe en Prisma 7.x — el cliente está en @prisma/client)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma   ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma  ./prisma/schema.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.cjs       ./prisma/seed.cjs

COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
