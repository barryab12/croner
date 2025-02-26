'use client';

import { useState, useEffect } from 'react';
import TaskModal from '@/app/components/ui/task-modal';
import DeleteTaskDialog from '@/app/components/ui/delete-task-dialog';
import type { Task } from '@/types/prisma';
import { Pencil1Icon, PlayIcon, TrashIcon, SwitchIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tâches');
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Une erreur est survenue lors du chargement des tâches');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(task: Task) {
    setSelectedTask(task);
    setModalMode('edit');
    setIsModalOpen(true);
  }

  function handleCreate() {
    setSelectedTask(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  }

  function handleDeleteClick(task: Task) {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!taskToDelete) return;

    try {
      const response = await fetch(`/api/tasks?id=${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la tâche');
      }

      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      await fetchTasks();
    } catch (error) {
      setError('Une erreur est survenue lors de la suppression de la tâche');
      console.error(error);
    }
  }

  async function handleToggleActive(task: Task) {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: task.id,
          isActive: !task.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification du statut');
      }

      const updatedTask = await response.json();
      
      // Mettre à jour la tâche localement avec toutes les informations
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id ? {
            ...t,
            isActive: !t.isActive,
            nextRun: !t.isActive ? updatedTask.nextRun : null // Mettre à jour nextRun selon l'état
          } : t
        )
      );
    } catch (error) {
      setError('Une erreur est survenue lors de la modification du statut');
      console.error(error);
    }
  }

  async function handleExecute(taskId: string) {
    setExecutingTaskId(taskId);
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, execute: true }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'exécution de la tâche');
      }

      const result = await response.json();
      
      // Mettre à jour la tâche localement avec ses nouvelles informations
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? {
            ...t,
            lastStatus: result.task.lastStatus,
            lastRun: result.task.lastRun,
            nextRun: result.task.nextRun
          } : t
        )
      );
    } catch (error) {
      setError('Une erreur est survenue lors de l\'exécution de la tâche');
      console.error(error);
    } finally {
      setExecutingTaskId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tâches Cron</h1>
            <button 
              onClick={handleCreate}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Nouvelle Tâche
            </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_2fr] gap-4 border-b pb-4 font-medium">
            <div>Nom</div>
            <div>Commande</div>
            <div>Planification</div>
            <div>Dernier statut</div>
            <div>Prochaine exécution</div>
            <div>Actions</div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Chargement des tâches...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucune tâche configurée
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_2fr] gap-4 py-4 hover:bg-muted/50">
                <div className="font-medium">{task.name}</div>
                <div className="text-sm text-muted-foreground">{task.command}</div>
                <div className="text-sm">{task.schedule}</div>
                <div className={`text-sm ${
                  task.lastStatus === 'success' ? 'text-green-600' : 
                  task.lastStatus === 'error' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {task.lastStatus || 'En attente'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Non planifié'}
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => handleEdit(task)}
                        className="rounded-md border p-1.5 hover:bg-muted"
                      >
                        <Pencil1Icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Éditer la tâche</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => handleExecute(task.id)}
                        disabled={executingTaskId === task.id}
                        className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-50"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exécuter maintenant la tâche</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => handleToggleActive(task)}
                        className={`rounded-md border p-1.5 hover:bg-muted ${
                          task.isActive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <SwitchIcon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.isActive ? "Désactiver la tâche" : "Activer la tâche"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => handleDeleteClick(task)}
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Supprimer la tâche</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(undefined);
          fetchTasks();
        }}
        task={selectedTask}
        mode={modalMode}
      />

      {taskToDelete && (
        <DeleteTaskDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setTaskToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          taskName={taskToDelete.name}
        />
      )}
    </div>
  );
}