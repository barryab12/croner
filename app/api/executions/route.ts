import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schéma de validation pour les paramètres de filtrage
const FilterSchema = z.object({
  status: z.enum(['SUCCESS', 'ERROR', 'TIMEOUT']).optional(),
  date: z.string().optional(),
  taskId: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(10).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    // Récupération des paramètres de la requête
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const date = url.searchParams.get('date') || undefined;
    const taskId = url.searchParams.get('taskId') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Validation des paramètres
    const validParams = FilterSchema.safeParse({
      status,
      date,
      taskId,
      page,
      limit
    });

    if (!validParams.success) {
      return NextResponse.json(
        { message: 'Paramètres invalides', errors: validParams.error.format() },
        { status: 400 }
      );
    }

    // Construction des filtres
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }

    if (taskId) {
      filters.taskId = taskId;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filters.startTime = {
        gte: startDate,
        lte: endDate
      };
    }

    // Récupération des tâches de l'utilisateur pour le filtrage par utilisateur
    const userTasks = await prisma.task.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true
      }
    });

    const userTaskIds = userTasks.map(task => task.id);
    
    // Ajout du filtre par tâches de l'utilisateur
    filters.taskId = {
      in: userTaskIds
    };

    // Calcul du nombre total d'enregistrements pour la pagination
    const totalCount = await prisma.taskExecution.count({
      where: filters
    });

    // Récupération des exécutions avec pagination
    const executions = await prisma.taskExecution.findMany({
      where: filters,
      include: {
        task: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Construction de la réponse avec pagination
    return NextResponse.json({
      data: executions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching execution history:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const ids = searchParams.get('ids')?.split(',')

    if (!ids || ids.length === 0) {
      return NextResponse.json({ message: 'IDs requis' }, { status: 400 })
    }

    // Vérifier que toutes les exécutions appartiennent à l'utilisateur
    const executions = await prisma.taskExecution.findMany({
      where: {
        id: { in: ids },
        task: {
          userId: session.user.id
        }
      }
    })

    if (executions.length !== ids.length) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 })
    }

    await prisma.taskExecution.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return NextResponse.json({ message: 'Exécutions supprimées avec succès' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Erreur lors de la suppression des exécutions' },
      { status: 500 }
    )
  }
}