import { type Task } from "@prisma/client";
import { scheduleJob, scheduledJobs, Job } from "node-schedule";
import { executeTask, getActiveTasks, toggleTaskInDatabase, updateTaskNextRun } from "@/lib/server-actions/tasks";
import { validateCronExpression } from '../utils';

class TaskScheduler {
  private jobs: Map<string, Job>;
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
      console.log(`Exécution de la tâche ${task.id} à ${new Date().toISOString()}`);
      try {
        const result = await executeTask(task.id);
        console.log(`Tâche ${task.id} exécutée avec succès`);
      } catch (error) {
        console.error(`Erreur lors de l'exécution de la tâche ${task.id}:`, error);
      }
    });

    if (!job) {
      console.error(`Échec de la planification de la tâche ${task.id}: format cron invalide`);
      return null;
    }

    this.jobs.set(task.id, job);
    const nextRun = job.nextInvocation();
    
    // Convertir la date en format ISO 
    if (nextRun) {
      this.updateNextRun(task.id, nextRun.toISOString());
    }
    
    console.log(`Prochaine exécution de la tâche ${task.id}: ${nextRun}`);
    return nextRun ? nextRun.toISOString() : null;
  }

  private async updateNextRun(taskId: string, nextRun: string) {
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
      return await executeTask(taskId);
    } catch (error) {
      console.error(`Erreur lors de l'exécution manuelle de la tâche ${taskId}:`, error);
      throw error;
    }
  }

  async toggleTask(taskId: string, isActive: boolean) {
    try {
      // Mettre à jour la base de données via la Server Action
      const task = await toggleTaskInDatabase(taskId, isActive);

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
      console.log('Démarrage du scheduler...');
      const tasks = await getActiveTasks();
      
      console.log(`${tasks.length} tâches actives récupérées`);
      
      tasks.forEach((task: Task) => {
        this.scheduleTask(task);
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