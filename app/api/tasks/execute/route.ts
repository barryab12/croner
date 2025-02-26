import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { executeTask } from '@/lib/server-actions/tasks';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ message: 'ID de tâche requis' }, { status: 400 });
    }

    const result = await executeTask(taskId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Task execution error:', error);
    return NextResponse.json(
      { message: 'Erreur lors de l\'exécution de la tâche' }, 
      { status: 500 }
    );
  }
}
