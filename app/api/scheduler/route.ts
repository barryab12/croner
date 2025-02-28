import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { taskScheduler } from '@/lib/services/scheduler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { action } = await req.json();

    switch (action) {
      case 'start':
        if (!taskScheduler.isInitialized()) {
          await taskScheduler.start();
          return NextResponse.json({ message: 'Scheduler started successfully' });
        }
        return NextResponse.json({ message: 'Scheduler already running' });

      case 'stop':
        taskScheduler.stop();
        return NextResponse.json({ message: 'Scheduler stopped successfully' });

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler API error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}