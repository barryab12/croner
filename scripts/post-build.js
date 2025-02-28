// scripts/post-build.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Exécution des tâches post-build...');
  
  const rootDir = path.resolve(__dirname, '..');
  const nextDir = path.join(rootDir, '.next');
  const standaloneDir = path.join(nextDir, 'standalone');
  
  // Vérifier si le répertoire standalone existe
  if (fs.existsSync(standaloneDir)) {
    console.log('Répertoire standalone trouvé.');
    
    // Copier le répertoire prisma dans le répertoire standalone
    const prismaSrcDir = path.join(rootDir, 'prisma');
    const prismaDestDir = path.join(standaloneDir, 'prisma');
    
    if (fs.existsSync(prismaSrcDir)) {
      console.log('Copie du répertoire prisma vers standalone...');
      
      // Créer le répertoire de destination s'il n'existe pas
      if (!fs.existsSync(prismaDestDir)) {
        fs.mkdirSync(prismaDestDir, { recursive: true });
      }
      
      // Copier les fichiers du répertoire prisma
      const files = fs.readdirSync(prismaSrcDir);
      
      for (const file of files) {
        const srcPath = path.join(prismaSrcDir, file);
        const destPath = path.join(prismaDestDir, file);
        
        // Ignorer les répertoires node_modules et migrations
        if (file === 'node_modules' || file === 'migrations') {
          continue;
        }
        
        // Copier le fichier ou le répertoire
        if (fs.statSync(srcPath).isDirectory()) {
          // Copier le répertoire récursivement
          copyDir(srcPath, destPath);
        } else {
          // Copier le fichier
          fs.copyFileSync(srcPath, destPath);
        }
      }
      
      console.log('Répertoire prisma copié avec succès.');
    }
    
    // Mettre à jour le fichier .env dans le répertoire standalone
    const envSrcPath = path.join(rootDir, '.env');
    const envDestPath = path.join(standaloneDir, '.env');
    
    if (fs.existsSync(envSrcPath)) {
      console.log('Mise à jour du fichier .env dans standalone...');
      
      let envContent = fs.readFileSync(envSrcPath, 'utf8');
      
      // Mettre à jour le chemin de la base de données pour qu'il soit relatif au répertoire standalone
      const dbUrlRegex = /DATABASE_URL\s*=\s*"([^"]*)"/;
      const match = envContent.match(dbUrlRegex);
      
      if (match) {
        const newUrl = 'file:./prisma/dev.db';
        const updatedContent = envContent.replace(
          dbUrlRegex,
          `DATABASE_URL="${newUrl}"`
        );
        
        fs.writeFileSync(envDestPath, updatedContent);
        console.log('Fichier .env mis à jour dans standalone.');
      } else {
        // Copier le fichier tel quel
        fs.copyFileSync(envSrcPath, envDestPath);
      }
    }
    
    // Copier les scripts dans le répertoire standalone
    const scriptsSrcDir = path.join(rootDir, 'scripts');
    const scriptsDestDir = path.join(standaloneDir, 'scripts');
    
    if (fs.existsSync(scriptsSrcDir)) {
      console.log('Copie des scripts vers standalone...');
      
      // Créer le répertoire de destination s'il n'existe pas
      if (!fs.existsSync(scriptsDestDir)) {
        fs.mkdirSync(scriptsDestDir, { recursive: true });
      }
      
      // Copier les fichiers du répertoire scripts
      copyDir(scriptsSrcDir, scriptsDestDir);
      
      console.log('Scripts copiés avec succès.');
    }
  } else {
    console.log('Répertoire standalone non trouvé. Ignoré.');
  }
  
  console.log('Tâches post-build terminées.');
}

// Fonction pour copier un répertoire récursivement
function copyDir(src, dest) {
  // Créer le répertoire de destination s'il n'existe pas
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Lire les fichiers du répertoire source
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    // Ignorer les répertoires node_modules
    if (file === 'node_modules') {
      continue;
    }
    
    // Copier le fichier ou le répertoire
    if (fs.statSync(srcPath).isDirectory()) {
      // Copier le répertoire récursivement
      copyDir(srcPath, destPath);
    } else {
      // Copier le fichier
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main();
