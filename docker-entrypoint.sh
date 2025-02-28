#!/bin/sh
set -e

# Ensure database directory exists and has correct permissions
mkdir -p /app/db
chown -R nextjs:nodejs /app/db
chmod 755 /app/db

# Set HOME explicitly to avoid /nonexistent
export HOME=/app

echo "Initialisation de la base de données pour Docker..."
# Utiliser notre script d'initialisation de base de données Docker
if ! node /app/scripts/docker-db-init.js; then
  echo "Erreur lors de l'initialisation de la base de données. Sortie."
  exit 1
fi

echo "Démarrage de l'application Next.js..."
exec node server.js