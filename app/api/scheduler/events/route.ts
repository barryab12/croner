import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { taskScheduler } from '@/lib/services/scheduler';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { taskId, type } = await req.json();

    if (!taskId || !type) {
      return NextResponse.json({ message: 'Task ID and event type are required' }, { status: 400 });
    }

    switch (type) {
      case 'schedule':
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
          return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }
        const nextRun = taskScheduler.scheduleTask(task);
        return NextResponse.json({ nextRun });

      case 'cancel':
        taskScheduler.cancelTask(taskId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ message: 'Invalid event type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler event error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}