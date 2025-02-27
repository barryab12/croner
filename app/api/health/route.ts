import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Point de terminaison pour vérifier la santé de l'application
export async function GET() {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { 
        status: 'ok',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}