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
  
  // Vérifier les permissions du répertoire
  try {
    // Tester si on peut écrire dans le répertoire
    const testFile = path.join(dbDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Le répertoire de la base de données est accessible en écriture.');
  } catch (error) {
    console.error('Erreur: Le répertoire de la base de données n\'est pas accessible en écriture:', error);
    return false;
  }
  
  // Créer le fichier .env avec le bon chemin de base de données
  const envPath = path.join(appDir, '.env');
  fs.writeFileSync(envPath, `DATABASE_URL="file:${dbPath}"\n`);
  
  // Initialiser la base de données avec Prisma
  try {
    console.log('Initialisation de la base de données avec Prisma...');
    
    // Créer un fichier vide pour la base de données
    fs.writeFileSync(dbPath, '');
    
    // Initialiser la base de données
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: appDir });
    console.log('Base de données initialisée avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
  
  // Générer le client Prisma
  try {
    // Vérifier si le client Prisma existe déjà
    if (fs.existsSync(path.join(appDir, 'node_modules', '.prisma', 'client'))) {
      console.log('Client Prisma déjà généré. Ignoré.');
    } else {
      console.log('Génération du client Prisma...');
      execSync('npx prisma generate', { stdio: 'inherit', cwd: appDir });
      console.log('Client Prisma généré avec succès.');
    }
  } catch (error) {
    console.error('Erreur lors de la génération du client Prisma:', error);
    // Ne pas échouer si la génération du client échoue
    console.log('Poursuite malgré l\'erreur de génération du client Prisma.');
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
