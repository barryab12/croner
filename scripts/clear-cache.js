// scripts/clear-cache.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('Nettoyage du cache de Next.js...');
  
  const rootDir = path.resolve(__dirname, '..');
  const nextCacheDir = path.join(rootDir, '.next/cache');
  
  // Vérifier si le répertoire de cache existe
  if (fs.existsSync(nextCacheDir)) {
    console.log('Suppression du répertoire de cache Next.js...');
    try {
      fs.rmSync(nextCacheDir, { recursive: true, force: true });
      console.log('Répertoire de cache supprimé avec succès.');
    } catch (error) {
      console.error('Erreur lors de la suppression du répertoire de cache:', error);
    }
  } else {
    console.log('Aucun répertoire de cache Next.js trouvé.');
  }
  
  // Arrêter le serveur de développement s'il est en cours d'exécution
  try {
    console.log('Recherche des processus Next.js en cours d\'exécution...');
    const processes = execSync('ps aux | grep "next dev" | grep -v grep', { encoding: 'utf8' });
    if (processes) {
      console.log('Processus Next.js trouvés, tentative d\'arrêt...');
      console.log(processes);
      console.log('Veuillez arrêter manuellement le serveur Next.js et le redémarrer.');
    }
  } catch (error) {
    // Aucun processus trouvé, c'est normal
    console.log('Aucun processus Next.js en cours d\'exécution.');
  }
  
  console.log('Nettoyage terminé. Vous pouvez maintenant redémarrer l\'application avec "npm run dev".');
}

main();
