// scripts/reset-admin.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Réinitialisation de la base de données pour la création du premier administrateur...');
    
    // Vérifier le nombre d'utilisateurs
    const usersCount = await prisma.user.count();
    console.log(`Nombre d'utilisateurs actuels: ${usersCount}`);
    
    if (usersCount > 0) {
      // Supprimer tous les utilisateurs
      console.log('Suppression de tous les utilisateurs...');
      await prisma.user.deleteMany({});
      console.log('Tous les utilisateurs ont été supprimés.');
      
      // Vérifier que la suppression a fonctionné
      const newCount = await prisma.user.count();
      console.log(`Nombre d'utilisateurs après suppression: ${newCount}`);
      
      if (newCount > 0) {
        console.error('Erreur: Des utilisateurs existent toujours après la suppression.');
        process.exit(1);
      }
      
      // Supprimer également les sessions pour éviter les problèmes de connexion
      try {
        console.log('Suppression des sessions...');
        await prisma.session.deleteMany({});
        console.log('Toutes les sessions ont été supprimées.');
      } catch (error) {
        console.log('Aucune table de session trouvée ou erreur lors de la suppression des sessions:', error.message);
      }
    } else {
      console.log('Aucun utilisateur trouvé dans la base de données.');
    }
    
    // Vérifier le chemin de la base de données dans .env
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const dbUrlRegex = /DATABASE_URL\s*=\s*"([^"]*)"/;
      const match = envContent.match(dbUrlRegex);
      
      if (match) {
        console.log(`URL de base de données actuelle: ${match[1]}`);
      } else {
        console.log('DATABASE_URL non trouvé dans le fichier .env');
      }
    } else {
      console.log('Fichier .env non trouvé');
    }
    
    console.log('Réinitialisation terminée. Vous pouvez maintenant créer le premier administrateur.');
    console.log('Redémarrez l\'application et accédez à la page de connexion pour créer le premier administrateur.');
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
