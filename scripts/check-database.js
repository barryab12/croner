// scripts/check-database.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Vérification de la configuration de la base de données...');

  // Vérifier si le fichier de base de données existe
  const rootDir = path.resolve(__dirname, '..');
  const prismaDir = path.join(rootDir, 'prisma');

  // Déterminer le chemin de la base de données en fonction de l'environnement
  let dbPath;

  // Vérifier si nous sommes dans Docker
  const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';

  if (isDocker) {
    // Chemin pour Docker
    dbPath = path.join(rootDir, 'db', 'croner.db');
    console.log('Environnement Docker détecté');
  } else {
    // Chemin pour développement local
    dbPath = path.join(prismaDir, 'dev.db');
  }

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

  // Vérifier si le fichier .env existe
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    console.log('Fichier .env trouvé.');

    // Lire le contenu du fichier .env
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Vérifier si DATABASE_URL est défini
    const dbUrlRegex = /^DATABASE_URL=.*$/m;
    const correctDbUrl = `DATABASE_URL="file:${dbPath}"`;

    if (dbUrlRegex.test(envContent)) {
      // Mettre à jour DATABASE_URL
      const currentDbUrl = envContent.match(dbUrlRegex)[0];
      console.log(`URL de base de données actuelle: ${currentDbUrl}`);

      if (currentDbUrl !== correctDbUrl) {
        console.log(`Mise à jour du fichier .env avec ${correctDbUrl}`);
        envContent = envContent.replace(dbUrlRegex, correctDbUrl);
        fs.writeFileSync(envPath, envContent);
      }
    } else {
      // Ajouter DATABASE_URL
      console.log(`Ajout de DATABASE_URL au fichier .env: ${correctDbUrl}`);
      envContent += `\n${correctDbUrl}\n`;
      fs.writeFileSync(envPath, envContent);
    }
  } else {
    console.log('Fichier .env non trouvé. Création...');
    fs.writeFileSync(envPath, `DATABASE_URL="file:${dbPath}"\n`);
  }

  console.log('Vérification de la base de données terminée.');
}

main();
