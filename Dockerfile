# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

# ─── Etapa 1: instalar dependencias (compartida por app y migrate) ───────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds

# ─── Etapa 2: construir la app ────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ─── Etapa alternativa: schema + seed (build con --target migrate) ───────────
# db:push aplica el schema de forma idempotente: crea la BD si no existe y no
# toca datos existentes; falla si un cambio implica pérdida de datos.
# El seed solo corre cuando el deploy pasa RUN_SEED=1 (primera creación de BD).
FROM base AS migrate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma.config.ts ./
COPY prisma/ ./prisma/
RUN pnpm db:generate
CMD ["sh", "-c", "pnpm db:push && if [ \"$RUN_SEED\" = \"1\" ]; then pnpm db:seed; else echo 'BD existente: seed omitido'; fi"]

# ─── Etapa final: imagen mínima de producción ─────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
