// scripts/docker-init.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Initialisation de l\'application dans Docker...');
  
  // Chemins adaptés pour Docker
  const appDir = '/app';
  const dbDir = path.join(appDir, 'db');
  const dbPath = path.join(dbDir, 'croner.db');
  const envPath = path.join(appDir, '.env');
  
  // S'assurer que le répertoire de la base de données existe
  if (!fs.existsSync(dbDir)) {
    console.log('Création du répertoire de la base de données...');
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Vérifier si le fichier .env existe
  if (!fs.existsSync(envPath)) {
    console.log('Création du fichier .env...');
    fs.writeFileSync(envPath, `DATABASE_URL="file:${dbPath}"\n`);
  } else {
    // Mettre à jour DATABASE_URL dans le fichier .env
    let envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlRegex = /^DATABASE_URL=.*$/m;
    
    if (dbUrlRegex.test(envContent)) {
      envContent = envContent.replace(dbUrlRegex, `DATABASE_URL="file:${dbPath}"`);
    } else {
      envContent += `\nDATABASE_URL="file:${dbPath}"\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
  }
  
  console.log(`URL de base de données configurée: file:${dbPath}`);
  
  // Exécuter les migrations Prisma
  try {
    console.log('Exécution des migrations Prisma...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: appDir });
    console.log('Migrations exécutées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    return false;
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
  
  // Vérifier le nombre d'utilisateurs
  try {
    console.log('Vérification du nombre d\'utilisateurs...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkUsers() {
      const usersCount = await prisma.user.count();
      console.log(`Nombre d'utilisateurs: ${usersCount}`);
      
      await prisma.$disconnect();
      return usersCount;
    }
    
    // Exécuter la fonction de vérification de manière synchrone
    const usersCount = execSync(`node -e "
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function run() {
        const count = await prisma.user.count();
        console.log(count);
        await prisma.$disconnect();
      }
      
      run().catch(e => {
        console.error(e);
        process.exit(1);
      });
    "`, { cwd: appDir }).toString().trim();
    
    console.log(`Nombre d'utilisateurs trouvés: ${usersCount}`);
  } catch (error) {
    console.error('Erreur lors de la vérification des utilisateurs:', error);
    // Ne pas échouer si la vérification des utilisateurs échoue
  }
  
  console.log('Initialisation terminée avec succès.');
  return true;
}

// Exécuter la fonction principale
if (main()) {
  console.log('Application prête à démarrer.');
} else {
  console.error('Erreur lors de l\'initialisation de l\'application.');
  process.exit(1);
}
