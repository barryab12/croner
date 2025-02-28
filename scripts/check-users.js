// scripts/check-users.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Vérification de l\'état de la base de données et des utilisateurs...');
    
    // Vérifier le chemin de la base de données dans .env
    const rootDir = path.resolve(__dirname, '..');
    const envPath = path.join(rootDir, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const dbUrlRegex = /DATABASE_URL\s*=\s*"([^"]*)"/;
      const match = envContent.match(dbUrlRegex);
      
      if (match) {
        console.log(`URL de base de données configurée: ${match[1]}`);
        
        // Vérifier si le fichier de base de données existe
        const dbPathMatch = match[1].match(/file:(.+)$/);
        if (dbPathMatch) {
          const dbPath = dbPathMatch[1];
          if (fs.existsSync(dbPath)) {
            console.log(`Le fichier de base de données existe: ${dbPath}`);
            
            // Vérifier la taille du fichier
            const stats = fs.statSync(dbPath);
            console.log(`Taille du fichier de base de données: ${stats.size} octets`);
          } else {
            console.log(`Le fichier de base de données n'existe pas: ${dbPath}`);
          }
        }
      } else {
        console.log('DATABASE_URL non trouvé dans le fichier .env');
      }
    } else {
      console.log('Fichier .env non trouvé');
    }
    
    // Vérifier les utilisateurs dans la base de données
    try {
      const usersCount = await prisma.user.count();
      console.log(`Nombre total d'utilisateurs: ${usersCount}`);
      
      if (usersCount > 0) {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          }
        });
        
        console.log('\nListe des utilisateurs:');
        users.forEach(user => {
          console.log(`- ID: ${user.id}`);
          console.log(`  Nom: ${user.name}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Rôle: ${user.role}`);
          console.log(`  Créé le: ${user.createdAt}`);
          console.log('---');
        });
        
        // Vérifier les administrateurs
        const admins = users.filter(user => user.role === 'ADMIN');
        console.log(`\nNombre d'administrateurs: ${admins.length}`);
        if (admins.length > 0) {
          console.log('Administrateurs:');
          admins.forEach(admin => {
            console.log(`- ${admin.name} (${admin.email})`);
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des utilisateurs:', error);
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
