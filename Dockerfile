FROM node:20-slim AS base

# Installer openssl pour Prisma et nettoyer le cache apt
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Dépendances uniquement
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Installer les dépendances selon le gestionnaire de packages disponible
RUN if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
    else npm i; \
    fi

# Build de l'application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configuration des variables d'environnement pour la production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Générer le prisma client
RUN npx prisma generate

# Set DATABASE_URL for build time
ENV DATABASE_URL="file:/app/db/croner.db"
ENV DOCKER_CONTAINER="true"

# Ensure database directory exists
RUN mkdir -p /app/db

# Initialize the database schema
RUN npx prisma db push --accept-data-loss

# Build de l'application
RUN npm run docker:build

# Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /app nextjs && \
    mkdir -p /app/db && \
    chown -R nextjs:nodejs /app

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* /app/yarn.lock* /app/pnpm-lock.yaml* ./

# Installation des dépendances de production uniquement
RUN if [ -f yarn.lock ]; then yarn --production --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci --only=production; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --prod --frozen-lockfile; \
    else npm i --only=production; \
    fi

# Migration de la base de données au démarrage
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

# Script de démarrage avec migration
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Rendre les scripts exécutables
RUN find /app/scripts -type f -name "*.js" -exec chmod +x {} \;

# Security hardening
RUN mkdir -p /app/db && \
    chmod 755 /app/db && \
    chown nextjs:nodejs /app/db && \
    chmod -R 755 /app/public && \
    chmod -R 755 /app/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV DATABASE_URL="file:/app/db/croner.db"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]