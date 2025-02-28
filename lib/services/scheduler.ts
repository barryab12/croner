import { type Task } from "@prisma/client";
import { scheduleJob, Job } from "node-schedule";
import { executeTask, getActiveTasks, toggleTaskInDatabase, updateTaskNextRun } from "@/lib/server-actions/tasks";
import { validateCronExpression } from '../utils';
import { MemoryQueue } from './memory-queue';
import { prisma } from '../prisma';

// Fonction utilitaire pour générer un ID unique pour les jobs
function generateUniqueJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

const taskQueue = new MemoryQueue('cron-tasks', {
  concurrency: 1
});

// Variable pour suivre les tâches en cours de traitement
const tasksInProgress = new Set<string>();

// Traitement des tâches
taskQueue.process(async (job) => {
  const { taskId } = job.data; 
  console.log(`Processing task ${taskId} from queue`);
  
  // Ajouter la tâche à l'ensemble des tâches en cours
  tasksInProgress.add(taskId);
  
  try {
    // Vérifier d'abord que la tâche existe toujours dans la base de données
    const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
    if (!taskExists) {
      console.log(`Task ${taskId} no longer exists in database, skipping execution`);
      return { success: false, error: "Task not found" };
    }
    
    const result = await executeTask(taskId);
    console.log(`Task ${taskId} executed successfully`);
    return result;
  } catch (error) {
    console.error(`Error executing task ${taskId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    // Retirer la tâche de l'ensemble lorsqu'elle est terminée
    tasksInProgress.delete(taskId);
  }
});

// Nettoyage périodique des tâches terminées (24h)
setInterval(() => {
  taskQueue.clean(24 * 60 * 60 * 1000);
}, 60 * 60 * 1000);

export const addTaskToQueue = async (taskId: string) => {
  try {
    // Vérification préalable que la tâche existe encore dans la base de données
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      console.log(`Task ${taskId} not found in database, cannot queue`);
      return null;
    }
    
    // Vérifier si la tâche est déjà en cours de traitement
    if (tasksInProgress.has(taskId)) {
      console.log(`Task ${taskId} is already in progress, skipping`);
      return null;
    }
    
    // Vérifier si la tâche est déjà dans la file d'attente
    const jobsInQueue = await taskQueue.getJobs();
    const isAlreadyQueued = jobsInQueue.some(job => 
      job.data && job.data.taskId === taskId && 
      (job.status === 'waiting' || job.status === 'active')
    );
    
    if (isAlreadyQueued) {
      console.log(`Task ${taskId} is already queued, skipping`);
      return null;
    }

    // Générer un ID unique pour le job
    const uniqueJobId = generateUniqueJobId();
    
    // Ajouter la tâche à la file d'attente avec son ID de tâche comme donnée
    const job = await taskQueue.add(uniqueJobId, { taskId });
    console.log(`Task ${taskId} added to queue with job id ${job.id}`);
    return job;
  } catch (error) {
    console.error(`Error adding task ${taskId} to queue:`, error);
    throw error;
  }
};

class TaskScheduler {
  private jobs: Map<string, Job>;
  private taskToJobMap: Map<string, string>;
  private static instance: TaskScheduler;
  private initialized: boolean = false;

  private constructor() {
    this.jobs = new Map();
    this.taskToJobMap = new Map();
  }

  static getInstance() {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler();
    }
    return TaskScheduler.instance;
  }

  // Vérifier si le scheduler est déjà initialisé pour éviter les doubles initialisations
  isInitialized() {
    return this.initialized;
  }

  scheduleTask(task: Task) {
    if (!task || !task.id) {
      console.error(`Tentative de planification d'une tâche invalide`);
      return null;
    }

    console.log(`Planification de la tâche ${task.id} avec le schedule: ${task.schedule}`);
    
    // Annuler l'ancienne planification si elle existe
    this.cancelTask(task.id);

    // Valider l'expression cron
    if (!validateCronExpression(task.schedule)) {
      console.error(`Expression cron invalide pour la tâche ${task.id}: ${task.schedule}`);
      return null;
    }

    // Convertir le format cron 6 champs en 5 champs si nécessaire
    const cronSchedule = task.schedule.split(' ').length === 6 
      ? task.schedule.split(' ').slice(1).join(' ') 
      : task.schedule;

    // Générer un ID unique pour le job planifié
    const jobId = generateUniqueJobId();

    const job = scheduleJob(jobId, cronSchedule, async () => {
      console.log(`Programmation de la tâche ${task.id} à ${new Date().toISOString()}`);
      try {
        await addTaskToQueue(task.id);
        
        // Mettre à jour nextRun immédiatement après l'exécution
        const nextInvocation = job.nextInvocation();
        const nextRunStr = nextInvocation ? nextInvocation.toISOString() : null;
        await this.updateNextRun(task.id, nextRunStr);
      } catch (error) {
        console.error(`Erreur lors de l'ajout de la tâche ${task.id} à la file d'attente:`, error);
      }
    });

    if (!job) {
      console.error(`Échec de la planification de la tâche ${task.id}: format cron invalide`);
      return null;
    }

    // Stocker le job avec son ID unique
    this.jobs.set(jobId, job);
    // Associer l'ID de tâche à l'ID de job
    this.taskToJobMap.set(task.id, jobId);

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
    const jobId = this.taskToJobMap.get(taskId);
    if (!jobId) return null;
    
    const job = this.jobs.get(jobId);
    const nextRun = job ? job.nextInvocation() : null;
    return nextRun ? nextRun.toISOString() : null;
  }

  async executeTaskNow(taskId: string) {
    try {
      // Vérifier d'abord que la tâche existe
      const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
      if (!taskExists) {
        return { success: false, error: "Task not found" };
      }
      
      // Ajouter la tâche à la file d'attente
      const job = await addTaskToQueue(taskId);
      
      if (!job) {
        // La tâche était déjà en cours d'exécution ou en file d'attente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const task = await prisma.task.findUnique({
          where: { id: taskId }
        });
        
        if (!task) {
          return { success: false, error: "Task not found" };
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
      }
      
      // Attendre la fin de l'exécution avec un timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Execution timeout")), 30000);
      });
      
      const jobCompletionPromise = new Promise((resolve) => {
        const successHandler = (result: any) => {
          taskQueue.removeListener(`job-failed:${taskId}`, failureHandler);
          resolve(result);
        };
        
        const failureHandler = (error: any) => {
          taskQueue.removeListener(`job-success:${taskId}`, successHandler);
          resolve({ success: false, error });
        };
        
        taskQueue.once(`job-success:${taskId}`, successHandler);
        taskQueue.once(`job-failed:${taskId}`, failureHandler);
      });
      
      // Attendre soit la fin de l'exécution, soit le timeout
      await Promise.race([jobCompletionPromise, timeoutPromise]);
      
      // Récupérer la tâche mise à jour après l'exécution
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      
      if (!task) {
        return { success: false, error: "Task not found after execution" };
      }
      
      // Après l'exécution, mettre à jour nextRun
      const jobId = this.taskToJobMap.get(taskId);
      if (jobId) {
        const job = this.jobs.get(jobId);
        if (job) {
          const nextInvocation = job.nextInvocation();
          const nextRunStr = nextInvocation ? nextInvocation.toISOString() : null;
          await this.updateNextRun(taskId, nextRunStr);
        }
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
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
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
    const jobId = this.taskToJobMap.get(taskId);
    if (jobId) {
      const job = this.jobs.get(jobId);
      if (job) {
        job.cancel();
        this.jobs.delete(jobId);
      }
      this.taskToJobMap.delete(taskId);
    }
  }

  async start() {
    try {
      // Éviter le double démarrage du scheduler
      if (this.initialized) {
        console.log('Le scheduler est déjà initialisé, réinitialisation...');
        this.stop();
      }
      
      console.log('Démarrage du scheduler...');
      const tasks = await getActiveTasks();
      
      console.log(`${tasks.length} tâches actives récupérées`);
      
      tasks.forEach((task: Task) => {
        const nextRunStr = this.scheduleTask(task);
        if (nextRunStr) {
          this.updateNextRun(task.id, nextRunStr);
        }
      });
      
      this.initialized = true;
      console.log('Scheduler démarré avec succès');
    } catch (error) {
      console.error('Erreur lors du démarrage du scheduler:', error);
    }
  }

  stop() {
    console.log('Arrêt du scheduler...');
    for (const [jobId, job] of this.jobs) {
      console.log(`Annulation du job ${jobId}`);
      job.cancel();
    }
    this.jobs.clear();
    this.taskToJobMap.clear();
    this.initialized = false;
  }
}

export const taskScheduler = TaskScheduler.getInstance();