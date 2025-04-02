import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }
    
    // Get the execution ID from params (which is a Promise in Next.js 15)
    const executionId = (await params).id;
    
    // Récupération de l'exécution de tâche avec vérification des permissions
    const execution = await prisma.taskExecution.findUnique({
      where: {
        id: executionId,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            command: true,
            userId: true,
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ message: 'Exécution non trouvée' }, { status: 404 });
    }

    // Vérification des permissions (seul le propriétaire de la tâche peut voir l'exécution)
    if (execution.task.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error('Error fetching execution details:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des détails de l\'exécution' },
      { status: 500 }
    );
  }
}