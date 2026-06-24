#!/bin/sh
set -e

echo "→ Aplicando schema..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "→ Ejecutando seed..."
node prisma/seed.cjs

echo "→ Iniciando sitralogfru..."
exec node server.js
