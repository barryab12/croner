// Client-side scheduler that uses API routes instead of direct Prisma access
export class ClientScheduler {
  private static instance: ClientScheduler;

  private constructor() {}

  static getInstance() {
    if (!ClientScheduler.instance) {
      ClientScheduler.instance = new ClientScheduler();
    }
    return ClientScheduler.instance;
  }

  async start(): Promise<void> {
    const response = await fetch('/api/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ action: 'start' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to start scheduler');
    }
  }

  async stop(): Promise<void> {
    const response = await fetch('/api/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ action: 'stop' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to stop scheduler');
    }
  }

  async executeTaskNow(taskId: string) {
    const response = await fetch('/api/tasks/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to execute task');
    }

    return response.json();
  }

  async toggleTask(taskId: string, isActive: boolean) {
    const response = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ id: taskId, isActive }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to toggle task');
    }

    return response.json();
  }
}

export const clientScheduler = ClientScheduler.getInstance();