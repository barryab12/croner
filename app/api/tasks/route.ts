import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { taskScheduler } from '@/lib/services/scheduler';

// Schéma de validation pour la création d'une tâche
const taskSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  command: z.string().min(1, 'La commande est requise'),
  schedule: z.string().min(1, 'La planification est requise'),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Non autorisé - Session non trouvée' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ message: 'Non autorisé - ID utilisateur manquant' }, { status: 401 });
    }

    const body = await req.json();

    const validatedData = taskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        name: validatedData.name,
        command: validatedData.command,
        schedule: validatedData.schedule,
        userId: session.user.id,
      },
    });
    
    if (!task) {
      throw new Error('Échec de la création de la tâche');
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }

    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Erreur interne du serveur',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }
    
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Erreur interne du serveur',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive, execute, ...data } = body;

    // Si c'est une demande d'exécution immédiate
    if (execute) {
      try {
        const result = await taskScheduler.executeTaskNow(id);
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json({ 
          message: error instanceof Error ? error.message : 'Erreur lors de l\'exécution',
          success: false 
        }, { status: 500 });
      }
    }

    // Si c'est une demande d'activation/désactivation
    if (typeof isActive === 'boolean') {
      try {
        const task = await taskScheduler.toggleTask(id, isActive);
        return NextResponse.json(task);
      } catch (error) {
        return NextResponse.json({ 
          message: error instanceof Error ? error.message : 'Erreur lors de la modification du statut',
          success: false 
        }, { status: 500 });
      }
    }

    // Si c'est une mise à jour normale de la tâche
    const validatedData = taskSchema.parse(data);
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return NextResponse.json({ message: 'Tâche non trouvée' }, { status: 404 });
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: validatedData,
    });

    // Mettre à jour la planification
    taskScheduler.scheduleTask(updatedTask);

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json({ message: 'ID de tâche requis' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ message: 'Tâche non trouvée' }, { status: 404 });
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}