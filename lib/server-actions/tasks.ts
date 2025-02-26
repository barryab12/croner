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
    await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'success',
        nextRun: taskScheduler.getNextRun(taskId)
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

    return { success: true, output: stdout, executionId: execution.id };
  } catch (error) {
    endTime = new Date();
    duration = endTime.getTime() - startTime.getTime();

    // Mettre à jour la tâche avec les informations de la dernière exécution
    await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'error',
        nextRun: taskScheduler.getNextRun(taskId)
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
        error: error instanceof Error ? error.message : String(error),
      }
    });

    throw error;
  }
}

export async function toggleTaskStatus(taskId: string, active: boolean) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isActive: active }
  });

  if (active) {
    const nextRun = taskScheduler.scheduleTask(task);
    await prisma.task.update({
      where: { id: taskId },
      data: { nextRun }
    });
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
    const nextRun = taskScheduler.scheduleTask(task);
    await prisma.task.update({
      where: { id: task.id },
      data: { nextRun }
    });
  }
}
