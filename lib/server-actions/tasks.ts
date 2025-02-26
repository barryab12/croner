'use server';

import { execa } from 'execa';
import { prisma } from '../prisma';
import { taskScheduler } from '../services/scheduler';

export async function executeTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!task) throw new Error('Task not found');

  const startTime = new Date();
  let endTime: Date;
  let duration: number;

  try {
    const { stdout, stderr } = await execa(task.command, { shell: true });
    
    endTime = new Date();
    duration = endTime.getTime() - startTime.getTime();

    // Récupérer la chaîne ISO de la prochaine exécution
    const nextRunStr = taskScheduler.getNextRun(taskId);

    // Mettre à jour la tâche avec les informations de la dernière exécution
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'success',
        nextRun: nextRunStr ? new Date(nextRunStr) : task.nextRun
      }
    });

    // Créer un enregistrement dans l'historique des exécutions
    const execution = await prisma.taskExecution.create({
      data: {
        taskId,
        startTime,
        endTime,
        duration,
        status: 'SUCCESS',
        output: stdout,
      }
    });

    // Sérialiser les dates dans le résultat
    return { 
      success: true, 
      output: stdout, 
      executionId: execution.id,
      task: {
        ...updatedTask,
        nextRun: updatedTask.nextRun?.toISOString() || null,
        lastRun: updatedTask.lastRun?.toISOString() || null,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    endTime = new Date();
    duration = endTime.getTime() - startTime.getTime();

    // En cas d'erreur, on garde la même logique de nextRun que pour le succès
    const nextRunStr = taskScheduler.getNextRun(taskId);

    // Mettre à jour la tâche avec les informations de la dernière exécution
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'error',
        nextRun: nextRunStr ? new Date(nextRunStr) : task.nextRun
      }
    });

    // Créer un enregistrement dans l'historique des exécutions
    const execution = await prisma.taskExecution.create({
      data: {
        taskId,
        startTime,
        endTime,
        duration,
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
      }
    });

    throw error;
  }
}

export async function toggleTaskInDatabase(taskId: string, isActive: boolean) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { 
      isActive,
      // Si la tâche est désactivée, on met nextRun à null
      ...(isActive ? {} : { nextRun: null })
    },
  });
  return task;
}

export async function updateTaskNextRun(taskId: string, nextRun: string | null) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        nextRun: nextRun ? new Date(nextRun) : null 
      },
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de nextRun pour la tâche ${taskId}:`, error);
    throw error;
  }
}

export async function toggleTaskStatus(taskId: string, active: boolean) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { 
      isActive: active,
      // Si on désactive la tâche, on met nextRun à null
      ...(active ? {} : { nextRun: null })
    }
  });

  if (active) {
    const nextRunStr = taskScheduler.scheduleTask(task);
    if (nextRunStr) {
      await prisma.task.update({
        where: { id: taskId },
        data: { nextRun: new Date(nextRunStr) }
      });
    }
  } else {
    taskScheduler.cancelTask(taskId);
  }

  return task;
}

export async function initializeScheduler() {
  const tasks = await prisma.task.findMany({
    where: { isActive: true }
  });
  
  for (const task of tasks) {
    const nextRunStr = taskScheduler.scheduleTask(task);
    if (nextRunStr) {
      await prisma.task.update({
        where: { id: task.id },
        data: { nextRun: new Date(nextRunStr) }
      });
    }
  }
}

export async function getActiveTasks() {
  try {
    const tasks = await prisma.task.findMany({
      where: { isActive: true }
    });
    return tasks;
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches actives:', error);
    throw error;
  }
}
