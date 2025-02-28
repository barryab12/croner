// scripts/post-build.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Exécution des tâches post-build...');
  
  const rootDir = path.resolve(__dirname, '..');
  const nextDir = path.join(rootDir, '.next');
  
  // Vérifier si nous sommes dans un environnement Docker
  const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
  
  // Copier les scripts dans le répertoire .next pour s'assurer qu'ils sont disponibles
  const scriptsDir = path.join(rootDir, 'scripts');
  const nextScriptsDir = path.join(nextDir, 'scripts');
  
  if (fs.existsSync(scriptsDir)) {
    console.log('Copie des scripts vers .next...');
    
    // Créer le répertoire de destination s'il n'existe pas
    if (!fs.existsSync(nextScriptsDir)) {
      fs.mkdirSync(nextScriptsDir, { recursive: true });
    }
    
    // Copier les fichiers du répertoire scripts
    const files = fs.readdirSync(scriptsDir);
    for (const file of files) {
      const srcPath = path.join(scriptsDir, file);
      const destPath = path.join(nextScriptsDir, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    console.log('Scripts copiés avec succès.');
  }
  
  console.log('Tâches post-build terminées.');
}

// Fonction pour copier un répertoire récursivement
function copyDir(src, dest) {
  // Créer le répertoire de destination s'il n'existe pas
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Lire le contenu du répertoire source
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Copier chaque entrée
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Copier récursivement le sous-répertoire
      copyDir(srcPath, destPath);
    } else {
      // Copier le fichier
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main();
