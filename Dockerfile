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

# Création du répertoire de la base de données avec les bonnes permissions dès le début
RUN mkdir -p /app/db && chmod 777 /app/db

# Set DATABASE_URL for build time
ENV DATABASE_URL="file:/app/db/croner.db"
ENV DOCKER_CONTAINER="true"

# Initialize the database schema
RUN npx prisma db push --accept-data-loss

# Generate Prisma client
RUN npx prisma generate

# Build de l'application
RUN npm run docker:build

# Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /app nextjs && \
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
RUN chmod +x /app/docker-entrypoint.sh

# Rendre les scripts exécutables
RUN find /app/scripts -type f -name "*.js" -exec chmod +x {} \;

# Security hardening
RUN chmod -R 755 /app/public && \
    chmod -R 755 /app/.next/static && \
    chmod -R 777 /app/node_modules/.prisma && \
    chmod -R 777 /app/node_modules/@prisma

# Add node_modules/.bin to PATH
ENV PATH="/app/node_modules/.bin:${PATH}"

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV DATABASE_URL="file:/app/db/croner.db"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]