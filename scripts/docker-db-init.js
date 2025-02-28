// scripts/docker-db-init.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Initialisation de la base de données pour Docker...');
  
  // Chemins adaptés pour Docker
  const appDir = '/app';
  const dbDir = path.join(appDir, 'db');
  const dbPath = path.join(dbDir, 'croner.db');
  
  // S'assurer que le répertoire de la base de données existe
  if (!fs.existsSync(dbDir)) {
    console.log('Création du répertoire de la base de données...');
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Vérifier si la base de données existe
  if (!fs.existsSync(dbPath)) {
    console.log('Base de données non trouvée. Initialisation...');
    
    // Créer le fichier .env avec le bon chemin de base de données
    const envPath = path.join(appDir, '.env');
    fs.writeFileSync(envPath, `DATABASE_URL="file:${dbPath}"\n`);
    
    try {
      // Initialiser la base de données avec Prisma
      console.log('Initialisation de la base de données avec Prisma...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: appDir });
      console.log('Base de données initialisée avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      return false;
    }
  } else {
    console.log('Base de données trouvée.');
    
    // Exécuter les migrations si nécessaire
    try {
      console.log('Exécution des migrations Prisma...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: appDir });
      console.log('Migrations exécutées avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'exécution des migrations:', error);
      // Ne pas échouer si les migrations échouent
    }
  }
  
  // Générer le client Prisma
  try {
    console.log('Génération du client Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: appDir });
    console.log('Client Prisma généré avec succès.');
  } catch (error) {
    console.error('Erreur lors de la génération du client Prisma:', error);
    return false;
  }
  
  console.log('Initialisation de la base de données terminée avec succès.');
  return true;
}

// Exécuter la fonction principale
if (main()) {
  console.log('Base de données prête.');
} else {
  console.error('Erreur lors de l\'initialisation de la base de données.');
  process.exit(1);
}
