import { type Task } from "@prisma/client";
import { scheduleJob, scheduledJobs, Job } from "node-schedule";
import { prisma } from "@/lib/prisma";

class TaskScheduler {
  private jobs: Map<string, Job>;

  constructor() {
    this.jobs = new Map();
  }

  scheduleTask(task: Task) {
    if (this.jobs.has(task.id)) {
      this.jobs.get(task.id)?.cancel();
    }

    const job = scheduleJob(task.schedule, async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId: task.id }),
        });

        if (!response.ok) {
          throw new Error('Échec de l\'exécution de la tâche');
        }
      } catch (error) {
        console.error(`Erreur lors de l'exécution de la tâche ${task.id}:`, error);
      }
    });

    this.jobs.set(task.id, job);
    
    // Return the next execution date
    return job.nextInvocation();
  }

  getNextRun(taskId: string) {
    const job = this.jobs.get(taskId);
    return job ? job.nextInvocation() : null;
  }

  async executeTaskNow(taskId: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'exécution de la tâche');
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de l'exécution manuelle de la tâche ${taskId}:`, error);
      throw error;
    }
  }

  async toggleTask(taskId: string, isActive: boolean) {
    try {
      // Mettre à jour directement dans la base de données au lieu d'appeler l'API
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { isActive },
      });

      // Planifier ou annuler la tâche selon le nouvel état
      if (isActive) {
        this.scheduleTask(task);
      } else {
        this.cancelTask(taskId);
      }

      return task;
    } catch (error) {
      console.error(`Erreur lors de la modification du statut de la tâche ${taskId}:`, error);
      throw error;
    }
  }

  cancelTask(taskId: string) {
    const job = this.jobs.get(taskId);
    if (job) {
      job.cancel();
      this.jobs.delete(taskId);
    }
  }

  async start() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/active`);
      if (!response.ok) {
        throw new Error('Échec de la récupération des tâches actives');
      }
      
      const tasks = await response.json();
      
      tasks.forEach((task: Task) => {
        this.scheduleTask(task);
      });
    } catch (error) {
      console.error('Erreur lors du démarrage du scheduler:', error);
    }
  }

  stop() {
    this.jobs.forEach(job => job.cancel());
    this.jobs.clear();
  }
}

export const taskScheduler = new TaskScheduler();