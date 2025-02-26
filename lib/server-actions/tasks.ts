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

  try {
    const { stdout, stderr } = await execa(task.command, { shell: true });

    await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'success',
        nextRun: taskScheduler.getNextRun(taskId)
      }
    });

    return { success: true, output: stdout };
  } catch (error) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        lastRun: startTime,
        lastStatus: 'error',
        nextRun: taskScheduler.getNextRun(taskId)
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
