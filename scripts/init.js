// scripts/init.js
const { execSync } = require('child_process');
const path = require('path');

function main() {
  console.log('Initialisation de l\'application...');
  
  try {
    // Vérifier la base de données
    console.log('\n=== Vérification de la base de données ===');
    execSync('node scripts/check-database.js', { stdio: 'inherit' });
    
    // Exécuter les migrations Prisma
    console.log('\n=== Exécution des migrations Prisma ===');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Générer le client Prisma
    console.log('\n=== Génération du client Prisma ===');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Configurer le compte administrateur
    console.log('\n=== Configuration du compte administrateur ===');
    execSync('node scripts/setup-admin.js', { stdio: 'inherit' });
    
    console.log('\n=== Initialisation terminée avec succès ===');
    console.log('Vous pouvez maintenant démarrer l\'application avec:');
    console.log('npm run dev    # Pour le développement');
    console.log('npm run build  # Pour construire l\'application');
    console.log('npm start      # Pour démarrer l\'application en production');
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

main();
