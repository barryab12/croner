import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { taskScheduler } from '@/lib/services/scheduler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ message: 'Task ID is required' }, { status: 400 });
    }

    const result = await taskScheduler.executeTaskNow(taskId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Task execution error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
