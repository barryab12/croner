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

    // Mettre à jour la tâche avec les informations de la dernière exécution
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'success',
        nextRun: task.nextRun // Garder la prochaine exécution planifiée
      }
    });

    // Créer un enregistrement dans l'historique des exécutions
    await prisma.taskExecution.create({
      data: {
        taskId,
        startTime,
        endTime,
        duration,
        status: 'SUCCESS',
        output: stdout,
        error: stderr
      }
    });

    return {
      success: true,
      task: {
        ...updatedTask,
        lastStatus: 'success',
        lastRun: updatedTask.lastRun?.toISOString() || null,
        nextRun: updatedTask.nextRun?.toISOString() || null,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString()
      }
    };
  } catch (error) {
    endTime = new Date();
    duration = endTime.getTime() - startTime.getTime();

    // Mettre à jour la tâche avec les informations de la dernière exécution
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'error',
        nextRun: task.nextRun // Garder la prochaine exécution planifiée
      }
    });

    // Créer un enregistrement dans l'historique des exécutions
    await prisma.taskExecution.create({
      data: {
        taskId,
        startTime,
        endTime,
        duration,
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error)
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      task: {
        ...updatedTask,
        lastStatus: 'error',
        lastRun: updatedTask.lastRun?.toISOString() || null,
        nextRun: updatedTask.nextRun?.toISOString() || null,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString()
      }
    };
  }
}

export async function toggleTaskInDatabase(taskId: string, isActive: boolean) {
  return prisma.task.update({
    where: { id: taskId },
    data: { isActive }
  });
}

export async function updateTaskNextRun(taskId: string, nextRun: string | null) {
  return prisma.task.update({
    where: { id: taskId },
    data: { 
      nextRun: nextRun ? new Date(nextRun) : null 
    }
  });
}

export async function toggleTaskStatus(taskId: string, active: boolean) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isActive: active }
  });

  if (active) {
    const nextRunStr = taskScheduler.scheduleTask(task);
    if (nextRunStr) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          nextRun: new Date(nextRunStr)
        }
      });
    }
  } else {
    taskScheduler.cancelTask(taskId);
  }

  return task;
}

export async function initializeScheduler() {
  await taskScheduler.start();
}

export async function getActiveTasks() {
  return prisma.task.findMany({
    where: { isActive: true }
  });
}
