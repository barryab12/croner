#!/bin/sh
set -e

# Ensure database directory exists
mkdir -p /app/db

echo "Running database migrations..."
# Add error handling for migrations
if ! npx prisma migrate deploy; then
  echo "Error during database migration. Trying to initialize the database..."
  # Try to generate the database from scratch if migration fails
  npx prisma db push --force-reset
  
  if [ $? -ne 0 ]; then
    echo "Failed to initialize the database. Exiting."
    exit 1
  fi
  
  echo "Database initialized successfully."
fi

echo "Starting Next.js application..."
exec node server.js