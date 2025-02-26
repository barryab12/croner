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

  // Calcul des statistiques pour le tableau de bord
  const stats = {
    total: tasks.length,
    active: tasks.filter(task => task.isActive).length,
    success: tasks.filter(task => task.lastStatus === 'success').length,
    error: tasks.filter(task => task.lastStatus === 'error').length,
    pending: tasks.filter(task => !task.lastStatus).length
  };

  return (
    <div className="space-y-6">
      {/* Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total des tâches</div>
          <div className="mt-2 text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Tâches actives</div>
          <div className="mt-2 text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground">{((stats.active / stats.total) * 100 || 0).toFixed(0)}% du total</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Dernières exécutions réussies</div>
          <div className="mt-2 text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-xs text-muted-foreground">{((stats.success / (stats.success + stats.error || 1)) * 100).toFixed(0)}% de succès</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Dernières exécutions échouées</div>
          <div className="mt-2 text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-xs text-muted-foreground">{stats.pending} tâches en attente</div>
        </div>
      </div>

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
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Chargement des tâches...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucune tâche configurée
            </div>
          ) : (
            <>
              {/* En-tête du tableau - masqué sur mobile */}
              <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_2fr] gap-4 border-b pb-4 font-medium">
                <div>Nom</div>
                <div>Commande</div>
                <div>Planification</div>
                <div>Dernier statut</div>
                <div>Prochaine exécution</div>
                <div>Actions</div>
              </div>
              
              {/* Liste des tâches avec mise en page adaptative */}
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_2fr] gap-4 py-4 hover:bg-muted/50">
                  {/* Nom de la tâche */}
                  <div className="font-medium md:block">
                    {task.name}
                  </div>
                  
                  {/* Commande (visible sur desktop et mobile) */}
                  <div className="text-sm text-muted-foreground">
                    {task.command}
                  </div>
                  
                  <div className="flex flex-col space-y-1 md:block">
                    <div className="md:hidden text-xs text-muted-foreground">Planification:</div>
                    <div className="text-sm">{task.schedule}</div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 md:block">
                    <div className="md:hidden text-xs text-muted-foreground">Statut:</div>
                    <div className={`text-sm ${
                      task.lastStatus === 'success' ? 'text-green-600' : 
                      task.lastStatus === 'error' ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {task.lastStatus || 'En attente'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 md:block">
                    <div className="md:hidden text-xs text-muted-foreground">Prochaine exécution:</div>
                    <div className="text-sm text-muted-foreground">
                      {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Non planifié'}
                    </div>
                  </div>
                  
                  {/* Actions toujours au bas sur mobile */}
                  <div className="flex items-center gap-1 mt-4 md:mt-0 border-t md:border-0 pt-4 md:pt-0">
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
              ))}
            </>
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