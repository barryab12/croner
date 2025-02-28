// scripts/repair-db.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Réparation de la base de données...');
  
  const rootDir = path.resolve(__dirname, '..');
  const prismaDir = path.join(rootDir, 'prisma');
  const dbPath = path.join(prismaDir, 'dev.db');
  
  // Vérifier si le répertoire prisma existe
  if (!fs.existsSync(prismaDir)) {
    console.log('Création du répertoire prisma...');
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  
  // Supprimer la base de données existante si elle existe
  if (fs.existsSync(dbPath)) {
    console.log('Suppression de la base de données existante...');
    fs.unlinkSync(dbPath);
  }
  
  // Exécuter les migrations Prisma pour recréer la base de données
  try {
    console.log('Exécution des migrations Prisma...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: rootDir });
    console.log('Migrations exécutées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  }
  
  // Générer le client Prisma
  try {
    console.log('Génération du client Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
    console.log('Client Prisma généré avec succès.');
  } catch (error) {
    console.error('Erreur lors de la génération du client Prisma:', error);
    process.exit(1);
  }
  
  // Configurer le compte administrateur
  try {
    console.log('Configuration du compte administrateur...');
    execSync('node scripts/setup-admin.js', { stdio: 'inherit', cwd: rootDir });
    console.log('Compte administrateur configuré avec succès.');
  } catch (error) {
    console.error('Erreur lors de la configuration du compte administrateur:', error);
    process.exit(1);
  }
  
  console.log('Réparation de la base de données terminée avec succès.');
}

main();
