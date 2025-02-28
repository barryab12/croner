// scripts/repair-db.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Réparation de la base de données...');
  
  const rootDir = path.resolve(__dirname, '..');
  const prismaDir = path.join(rootDir, 'prisma');
  const dbPath = path.join(prismaDir, 'dev.db');
  const dbShadowPath = path.join(prismaDir, 'dev.db-journal');
  
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
  
  // Supprimer également le fichier journal si présent
  if (fs.existsSync(dbShadowPath)) {
    console.log('Suppression du fichier journal de la base de données...');
    fs.unlinkSync(dbShadowPath);
  }
  
  // Mettre à jour le fichier .env pour s'assurer que le chemin de la base de données est correct
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    console.log('Mise à jour du fichier .env...');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Mettre à jour le chemin de la base de données
    const dbUrlRegex = /DATABASE_URL\s*=\s*"([^"]*)"/;
    const absoluteDbPath = path.join(rootDir, 'prisma', 'dev.db');
    const newUrl = `file:${absoluteDbPath}`;
    
    if (envContent.match(dbUrlRegex)) {
      envContent = envContent.replace(dbUrlRegex, `DATABASE_URL="${newUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${newUrl}"\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Fichier .env mis à jour avec DATABASE_URL="${newUrl}"`);
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
  
  console.log('Réparation de la base de données terminée avec succès.');
  console.log('Vous pouvez maintenant démarrer l\'application et créer le premier administrateur.');
}

main();
