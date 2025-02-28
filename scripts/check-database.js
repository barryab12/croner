// scripts/check-database.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Vérification de la configuration de la base de données...');
  
  // Vérifier si le fichier de base de données existe
  const rootDir = path.resolve(__dirname, '..');
  const prismaDir = path.join(rootDir, 'prisma');
  const dbPath = path.join(prismaDir, 'dev.db');
  
  console.log(`Chemin de la base de données: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.log('Base de données non trouvée. Création...');
    
    // Vérifier si le répertoire prisma existe
    if (!fs.existsSync(prismaDir)) {
      console.log('Création du répertoire prisma...');
      fs.mkdirSync(prismaDir, { recursive: true });
    }
    
    // Exécuter les migrations Prisma
    try {
      console.log('Exécution des migrations Prisma...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: rootDir });
      console.log('Migrations exécutées avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'exécution des migrations:', error);
      process.exit(1);
    }
  } else {
    console.log('Base de données trouvée.');
  }
  
  // Vérifier le fichier .env
  const envPath = path.join(rootDir, '.env');
  const standalonePath = path.join(rootDir, '.next', 'standalone', '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('Fichier .env trouvé.');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Vérifier si DATABASE_URL est correctement configuré
    const dbUrlRegex = /DATABASE_URL\s*=\s*"([^"]*)"/;
    const match = envContent.match(dbUrlRegex);
    
    if (match) {
      const currentUrl = match[1];
      console.log(`URL de base de données actuelle: ${currentUrl}`);
      
      // Si l'URL est relative, la remplacer par un chemin absolu
      if (currentUrl.startsWith('file:./')) {
        const absoluteDbPath = path.join(rootDir, 'prisma', 'dev.db');
        const newUrl = `file:${absoluteDbPath}`;
        console.log(`Mise à jour de l'URL de base de données: ${newUrl}`);
        
        // Mettre à jour le fichier .env
        const updatedContent = envContent.replace(
          dbUrlRegex,
          `DATABASE_URL="${newUrl}"`
        );
        
        fs.writeFileSync(envPath, updatedContent);
        console.log('Fichier .env mis à jour.');
        
        // Mettre à jour également le fichier .env dans le répertoire standalone s'il existe
        if (fs.existsSync(standalonePath)) {
          let standaloneContent = fs.readFileSync(standalonePath, 'utf8');
          const updatedStandaloneContent = standaloneContent.replace(
            dbUrlRegex,
            `DATABASE_URL="${newUrl}"`
          );
          fs.writeFileSync(standalonePath, updatedStandaloneContent);
          console.log('Fichier .env standalone mis à jour.');
        }
      }
    } else {
      console.log('DATABASE_URL non trouvé dans le fichier .env.');
    }
  } else {
    console.log('Fichier .env non trouvé. Création...');
    
    // Créer un fichier .env avec le chemin absolu de la base de données
    const absoluteDbPath = path.join(rootDir, 'prisma', 'dev.db');
    const envContent = `# Environment variables
DATABASE_URL="file:${absoluteDbPath}"
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_SECRET="eyYtP8yK3fM9vN4xQ7wJ2hL5gU9nB3vR"
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('Fichier .env créé.');
  }
  
  console.log('Vérification de la base de données terminée.');
}

main();
