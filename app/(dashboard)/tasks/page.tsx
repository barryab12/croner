'use client';

import { useState, useEffect } from 'react';
import TaskModal from '@/app/components/ui/task-modal';
import DeleteTaskDialog from '@/app/components/ui/delete-task-dialog';
import type { Task } from '@/types/prisma';

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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
                  <button 
                    onClick={() => handleEdit(task)}
                    className="rounded-md border px-1.5 py-1 text-sm hover:bg-muted"
                  >
                    Éditer
                  </button>
                  <button className="rounded-md border px-1.5 py-1 text-sm hover:bg-muted">
                    Exécuter
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(task)}
                    className="rounded-md border border-red-200 px-1.5 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
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