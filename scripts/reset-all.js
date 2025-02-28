// scripts/reset-all.js
const { execSync } = require('child_process');
const path = require('path');

function main() {
  console.log('Réinitialisation complète de l\'application...');
  
  const rootDir = path.resolve(__dirname, '..');
  
  try {
    // 1. Nettoyer le cache
    console.log('\n--- ÉTAPE 1: Nettoyage du cache ---');
    execSync('node scripts/clear-cache.js', { stdio: 'inherit', cwd: rootDir });
    
    // 2. Réparer la base de données
    console.log('\n--- ÉTAPE 2: Réparation de la base de données ---');
    execSync('node scripts/repair-db.js', { stdio: 'inherit', cwd: rootDir });
    
    // 3. Réinitialiser l'administrateur
    console.log('\n--- ÉTAPE 3: Réinitialisation de l\'administrateur ---');
    execSync('node scripts/reset-admin.js', { stdio: 'inherit', cwd: rootDir });
    
    // 4. Vérifier l'état des utilisateurs
    console.log('\n--- ÉTAPE 4: Vérification des utilisateurs ---');
    execSync('node scripts/check-users.js', { stdio: 'inherit', cwd: rootDir });
    
    console.log('\nRéinitialisation complète terminée avec succès.');
    console.log('Vous pouvez maintenant démarrer l\'application avec "npm run dev" et créer le premier administrateur.');
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

main();
