// scripts/setup-admin.js
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Vérification de l\'existence d\'un compte administrateur...');
    
    // Vérifier si un administrateur existe déjà
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (adminCount > 0) {
      console.log('Un compte administrateur existe déjà.');
      return;
    }
    
    // Vérifier si des utilisateurs existent
    const usersCount = await prisma.user.count();
    
    if (usersCount > 0) {
      console.log('Des utilisateurs existent déjà mais aucun administrateur.');
      return;
    }
    
    // Créer un compte administrateur par défaut
    const defaultAdmin = {
      name: 'Admin',
      email: 'admin@example.com',
      password: await hash('Admin123!', 12),
      role: 'ADMIN'
    };
    
    console.log('Création d\'un compte administrateur par défaut...');
    
    await prisma.user.create({
      data: defaultAdmin
    });
    
    console.log('Compte administrateur créé avec succès!');
    console.log('Email: admin@example.com');
    console.log('Mot de passe: Admin123!');
    console.log('IMPORTANT: Veuillez changer ce mot de passe après la première connexion.');
    
  } catch (error) {
    console.error('Erreur lors de la création du compte administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
