#!/bin/sh
set -e

# Ensure database directory exists
mkdir -p /app/db

# Set HOME explicitly to avoid /nonexistent
export HOME=/app

echo "Initialisation de la base de données pour Docker..."
# Utiliser notre script d'initialisation de base de données Docker
node /app/scripts/docker-db-init.js || echo "Erreur lors de l'initialisation de la base de données, mais on continue..."

echo "Démarrage de l'application Next.js..."
exec next start