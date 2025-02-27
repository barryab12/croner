#!/bin/bash
set -e

# Variables
APP_NAME="croner"
BACKUP_DIR="/var/backups/croner"
COMPOSE_FILE="docker-compose.yml"
DOCKER_IMAGE_NAME="${APP_NAME}-app"
MAX_BACKUPS=7

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de logging
log() {
  echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
  log "🔍 Vérification des prérequis..." "$YELLOW"
  
  if ! command -v docker &> /dev/null; then
    log "❌ Docker n'est pas installé" "$RED"
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    log "❌ Docker Compose n'est pas installé" "$RED"
    exit 1
  fi
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
  log "🧹 Nettoyage des anciennes sauvegardes..." "$YELLOW"
  ls -t $BACKUP_DIR/*.db 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
}

# Fonction de sauvegarde de la base de données
backup_database() {
  log "📦 Création d'une sauvegarde de la base de données..." "$YELLOW"
  DATE=$(date +%Y%m%d_%H%M%S)
  if docker-compose exec -T croner sh -c "cat /app/db/croner.db" > "$BACKUP_DIR/${APP_NAME}_${DATE}.db"; then
    log "✅ Sauvegarde créée: $BACKUP_DIR/${APP_NAME}_${DATE}.db" "$GREEN"
    cleanup_old_backups
  else
    log "❌ Échec de la sauvegarde" "$RED"
    exit 1
  fi
}

# Vérification de la santé de l'application
check_health() {
  log "🏥 Vérification de la santé de l'application..." "$YELLOW"
  for i in {1..30}; do
    if curl -s http://localhost:3000/api/health | grep -q "ok"; then
      log "✅ L'application est en bonne santé" "$GREEN"
      return 0
    fi
    sleep 1
  done
  log "❌ L'application ne répond pas correctement" "$RED"
  return 1
}

# Fonction de mise à jour
update_application() {
  log "🔄 Mise à jour de l'application..." "$YELLOW"
  
  # Pull des derniers changements
  if ! git pull; then
    log "❌ Échec du git pull" "$RED"
    exit 1
  fi
  
  # Build de l'image
  if ! docker-compose build croner; then
    log "❌ Échec du build Docker" "$RED"
    exit 1
  fi
  
  # Démarrage des conteneurs
  if ! docker-compose up -d; then
    log "❌ Échec du démarrage des conteneurs" "$RED"
    exit 1
  fi
  
  # Vérification de la santé
  if ! check_health; then
    log "❌ L'application ne démarre pas correctement" "$RED"
    log "⏪ Restauration de la version précédente..." "$YELLOW"
    docker-compose down
    docker-compose up -d --no-build
    exit 1
  fi
  
  log "✅ Application mise à jour avec succès!" "$GREEN"
}

# Création du répertoire de backup
mkdir -p $BACKUP_DIR

case "$1" in
  backup)
    check_prerequisites
    backup_database
    ;;
  update)
    check_prerequisites
    backup_database
    update_application
    ;;
  logs)
    docker-compose logs -f
    ;;
  start)
    check_prerequisites
    docker-compose up -d
    if check_health; then
      log "✅ Application démarrée avec succès!" "$GREEN"
    else
      log "❌ Échec du démarrage de l'application" "$RED"
      exit 1
    fi
    ;;
  stop)
    docker-compose down
    log "✅ Application arrêtée!" "$GREEN"
    ;;
  restart)
    docker-compose restart
    if check_health; then
      log "✅ Application redémarrée avec succès!" "$GREEN"
    else
      log "❌ Échec du redémarrage de l'application" "$RED"
      exit 1
    fi
    ;;
  status)
    if docker-compose ps | grep -q "Up"; then
      if check_health; then
        log "✅ L'application est en cours d'exécution et en bonne santé" "$GREEN"
      else
        log "⚠️ L'application est en cours d'exécution mais ne répond pas correctement" "$YELLOW"
      fi
    else
      log "❌ L'application n'est pas en cours d'exécution" "$RED"
    fi
    ;;
  *)
    echo "Usage: $0 {backup|update|logs|start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0