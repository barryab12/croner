import { type Task } from "@prisma/client";
import { scheduleJob, scheduledJobs, Job } from "node-schedule";
import { executeTask, getActiveTasks, toggleTaskInDatabase, updateTaskNextRun } from "@/lib/server-actions/tasks";
import { validateCronExpression } from '../utils';
import { MemoryQueue } from './memory-queue';
import { prisma } from '../prisma';

const taskQueue = new MemoryQueue('cron-tasks', {
  concurrency: 1
});

// Traitement des tâches
taskQueue.process(async (job) => {
  const { taskId } = job;
  console.log(`Processing task ${taskId} from queue`);
  
  try {
    const result = await executeTask(taskId);
    console.log(`Task ${taskId} executed successfully`);
    return result;
  } catch (error) {
    console.error(`Error executing task ${taskId}:`, error);
    throw error;
  }
});

// Nettoyage périodique des tâches terminées (24h)
setInterval(() => {
  taskQueue.clean(24 * 60 * 60 * 1000);
}, 60 * 60 * 1000);

export const addTaskToQueue = async (taskId: string) => {
  try {
    const job = await taskQueue.add(taskId, { taskId });
    console.log(`Task ${taskId} added to queue with job id ${job.id}`);
    return job;
  } catch (error) {
    console.error(`Error adding task ${taskId} to queue:`, error);
    throw error;
  }
};

class TaskScheduler {
  private jobs: Map<string, any>;
  private static instance: TaskScheduler;

  private constructor() {
    this.jobs = new Map();
  }

  static getInstance() {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler();
    }
    return TaskScheduler.instance;
  }

  scheduleTask(task: Task) {
    console.log(`Planification de la tâche ${task.id} avec le schedule: ${task.schedule}`);
    if (this.jobs.has(task.id)) {
      console.log(`Annulation de l'ancienne planification pour la tâche ${task.id}`);
      this.jobs.get(task.id)?.cancel();
      this.jobs.delete(task.id);
    }

    // Valider l'expression cron
    if (!validateCronExpression(task.schedule)) {
      console.error(`Expression cron invalide pour la tâche ${task.id}: ${task.schedule}`);
      return null;
    }

    // Convertir le format cron 6 champs en 5 champs si nécessaire
    const cronSchedule = task.schedule.split(' ').length === 6 
      ? task.schedule.split(' ').slice(1).join(' ') 
      : task.schedule;

    const job = scheduleJob(task.id, cronSchedule, async () => {
      // Lors de l'exécution planifiée, on ajoute simplement la tâche à la queue
      console.log(`Programmation de la tâche ${task.id} à ${new Date().toISOString()}`);
      try {
        await addTaskToQueue(task.id);
      } catch (error) {
        console.error(`Erreur lors de l'ajout de la tâche ${task.id} à la file d'attente:`, error);
      }
    });

    if (!job) {
      console.error(`Échec de la planification de la tâche ${task.id}: format cron invalide`);
      return null;
    }

    this.jobs.set(task.id, job);
    const nextRun = job.nextInvocation();
    
    return nextRun ? nextRun.toISOString() : null;
  }

  private async updateNextRun(taskId: string, nextRun: string | null) {
    try {
      await updateTaskNextRun(taskId, nextRun);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de nextRun pour la tâche ${taskId}:`, error);
    }
  }

  getNextRun(taskId: string) {
    const job = this.jobs.get(taskId);
    const nextRun = job ? job.nextInvocation() : null;
    return nextRun ? nextRun.toISOString() : null;
  }

  async executeTaskNow(taskId: string) {
    try {
      // Create a promise that resolves when the job completes
      const jobCompletionPromise = new Promise((resolve, reject) => {
        taskQueue.once(`job-success:${taskId}`, (result) => resolve(result));
        taskQueue.once(`job-failed:${taskId}`, (error) => reject(error));
      });

      // Add the task to the queue
      await addTaskToQueue(taskId);

      // Wait for the job to complete
      await jobCompletionPromise;

      // Récupérer la tâche mise à jour après l'exécution
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return {
        success: true,
        task: {
          ...task,
          lastRun: task.lastRun?.toISOString() || null,
          nextRun: task.nextRun?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString()
        }
      };
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
      return { success: false, error };
    }
  }

  async toggleTask(taskId: string, isActive: boolean) {
    try {
      // Mettre à jour la base de données via la Server Action
      const task = await toggleTaskInDatabase(taskId, isActive);

      // Planifier ou annuler la tâche selon le nouvel état
      if (isActive) {
        const nextRunStr = this.scheduleTask(task);
        if (nextRunStr) {
          await this.updateNextRun(taskId, nextRunStr);
        }
      } else {
        this.cancelTask(taskId);
        await this.updateNextRun(taskId, null);
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
      console.log('Démarrage du scheduler...');
      const tasks = await getActiveTasks();
      
      console.log(`${tasks.length} tâches actives récupérées`);
      
      tasks.forEach((task: Task) => {
        const nextRunStr = this.scheduleTask(task);
        if (nextRunStr) {
          this.updateNextRun(task.id, nextRunStr);
        }
      });
      console.log('Scheduler démarré avec succès');
    } catch (error) {
      console.error('Erreur lors du démarrage du scheduler:', error);
    }
  }

  stop() {
    console.log('Arrêt du scheduler...');
    this.jobs.forEach((job, id) => {
      console.log(`Annulation de la tâche ${id}`);
      job.cancel();
    });
    this.jobs.clear();
  }
}

// Exporter une instance unique du scheduler
export const taskScheduler = TaskScheduler.getInstance();