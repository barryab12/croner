import { NextRequest, NextResponse } from 'next/server';
import { executeTask } from '@/lib/server-actions/tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const result = await executeTask(taskId);

    // S'assurer que toutes les propriétés nécessaires sont présentes
    return NextResponse.json({
      task: {
        id: result.task.id,
        lastStatus: result.task.lastStatus || null,
        lastRun: result.task.lastRun || null,
        nextRun: result.task.nextRun || null,
        name: result.task.name,
        command: result.task.command,
        schedule: result.task.schedule,
        isActive: result.task.isActive,
        createdAt: result.task.createdAt,
        updatedAt: result.task.updatedAt
      }
    });

  } catch (error) {
    console.error('Error executing task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
