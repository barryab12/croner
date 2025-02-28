'use client';
import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import type { Task } from '@/types/prisma';
import { toast } from "sonner"
import { describeCronExpression, validateCronExpression } from "@/lib/utils"

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  mode?: 'create' | 'edit';
  templateTask?: Task; // Nouvelle prop pour la duplication
}

export default function TaskModal({ isOpen, onClose, task, mode = 'create', templateTask }: TaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    schedule: 'daily',
    time: '00:00',
    customSchedule: '',
  });
  const [cronDescription, setCronDescription] = useState('');

  // Fonction pour obtenir l'expression cron basée sur le type de planification
  const getCronExpression = (scheduleType: string, timeValue: string, customValue?: string): string => {
    const [hours, minutes] = timeValue.split(':');
    switch (scheduleType) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * 1`;
      case 'monthly':
        return `${minutes} ${hours} 1 * *`;
      case 'custom':
        return customValue || '';
      default:
        return '';
    }
  };

  // Fonction pour mettre à jour la description du cron
  const updateCronDescription = useCallback((scheduleType: string, timeValue: string) => {
    if (scheduleType === 'custom') {
      const result = describeCronExpression(formData.customSchedule);
      setCronDescription(result.description);
    } else {
      // Générer l'expression cron en fonction du type de planification et de l'heure
      const [hours, minutes] = timeValue.split(':');
      let cronExpression = '';
      
      switch (scheduleType) {
        case 'daily':
          cronExpression = `${minutes} ${hours} * * *`;
          break;
        case 'weekly':
          cronExpression = `${minutes} ${hours} * * 1`;
          break;
        case 'monthly':
          cronExpression = `${minutes} ${hours} 1 * *`;
          break;
        default:
          cronExpression = '0 0 * * *';
      }
      
      const result = describeCronExpression(cronExpression);
      setCronDescription(result.description);
    }
  }, [formData.customSchedule]);

  // Premier useEffect pour initialiser le formulaire
  useEffect(() => {
    // Utiliser templateTask si disponible en mode création, sinon utiliser task en mode édition
    const sourceTask = mode === 'create' && templateTask ? templateTask : task;
    
    if (sourceTask) {
      let time = '00:00';
      let schedule = 'custom';
      let customSchedule = sourceTask.schedule;
      
      // Ajuster le nom pour la duplication
      const name = mode === 'create' && templateTask ? `${sourceTask.name} (copie)` : sourceTask.name;
      
      // Vérifier si la tâche correspond à un des schémas prédéfinis
      const cronParts = sourceTask.schedule.split(' ');
      if (cronParts.length === 5) {
        const [minutes, hours, dayMonth, month, dayWeek] = cronParts;
        
        // Vérifier les motifs connus pour les associer aux types de planification prédéfinis
        if (dayMonth === '*' && month === '*' && dayWeek === '*') {
          schedule = 'daily';
          
          // Gestion correcte des heures et minutes potentiellement avec */n
          if (!hours.includes('*') && !minutes.includes('*')) {
            // Format standard HH:MM
            time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            customSchedule = '';
          } else {
            // Format non standard, garder comme personnalisé
            schedule = 'custom';
          }
        } else if (dayMonth === '*' && month === '*' && dayWeek === '1') {
          schedule = 'weekly';
          
          if (!hours.includes('*') && !minutes.includes('*')) {
            time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            customSchedule = '';
          } else {
            schedule = 'custom';
          }
        } else if (dayMonth === '1' && month === '*' && dayWeek === '*') {
          schedule = 'monthly';
          
          if (!hours.includes('*') && !minutes.includes('*')) {
            time = `${hours.padStart(2, '0')}:{minutes.padStart(2, '0')}`;
            customSchedule = '';
          } else {
            schedule = 'custom';
          }
        }
      }
      // Mettre à jour l'état du formulaire avec les valeurs initiales
      setFormData({
        name,
        command: sourceTask.command,
        schedule,
        time,
        customSchedule,
      });
    }
  }, [task, templateTask, mode]);

  // Deuxième useEffect pour mettre à jour la description
  useEffect(() => {
    updateCronDescription(formData.schedule, formData.time);
  }, [formData.schedule, formData.time, updateCronDescription]);

  const handleScheduleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSchedule = e.target.value;
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setFormData(prev => ({ ...prev, time: newTime }));
  };

  const handleCustomScheduleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, customSchedule: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Utiliser le customSchedule si on est en mode custom, sinon générer l'expression depuis les paramètres
      let finalCronExpression = '';
      if (formData.schedule === 'custom') {
        finalCronExpression = formData.customSchedule;
      } else {
        finalCronExpression = getCronExpression(formData.schedule, formData.time);
      }
      
      if (!finalCronExpression) {
        throw new Error('Expression cron invalide');
      }
      
      // Valider l'expression cron
      const isValid = validateCronExpression(finalCronExpression);
      if (!isValid) {
        throw new Error('Expression cron invalide');
      }

      const isDuplication = mode === 'create' && templateTask !== undefined;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      
      const body = mode === 'create' 
        ? { 
            name: formData.name, 
            command: formData.command, 
            schedule: finalCronExpression,
            // Dans le cas d'une duplication, définir toujours isActive à false d'abord
            // pour éviter l'exécution automatique immédiate avant que tout soit prêt
            isActive: isDuplication ? false : true
          }
        : { 
            id: task?.id, 
            name: formData.name, 
            command: formData.command,
            isActive: task?.isActive,
            schedule: finalCronExpression
          };

      console.log(`Envoi de la requête ${method} pour la tâche avec les données:`, body);
      
      const response = await fetch('/api/tasks', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Une erreur est survenue');
      }
      
      // Récupérer la tâche créée ou mise à jour
      const newTask = await response.json();
      
      // Notifier l'utilisateur du succès
      toast.success(mode === 'create' ? 'Tâche créée avec succès' : 'Tâche modifiée avec succès');
      
      // Fermer le modal avant toute opération supplémentaire
      onClose();
      
      // Pour les tâches dupliquées, attendre que la tâche soit bien créée puis l'activer
      if (isDuplication) {
        console.log(`Activation de la tâche dupliquée ${newTask.id} après création`);
        
        // Attendre un court délai pour s'assurer que la tâche est bien enregistrée
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Activer la tâche dans une deuxième requête
          const activationResponse = await fetch('/api/tasks', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: newTask.id,
              isActive: true,
            }),
          });
          
          if (!activationResponse.ok) {
            console.error("Erreur lors de l'activation de la tâche dupliquée", await activationResponse.text());
            toast.error("La tâche a été créée mais n'a pas pu être activée");
          } else {
            console.log("Tâche dupliquée activée avec succès");
          }
        } catch (activationError) {
          console.error("Erreur lors de l'activation de la tâche dupliquée:", activationError);
        }
      }
      
      // Recharger la page après un délai suffisant pour s'assurer que toutes les opérations sont terminées
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" />
      <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto">
        <div className="w-full max-w-2xl rounded-lg bg-background p-6 border border-border shadow-lg m-4 mt-20">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold">
              {mode === 'create' ? 'Nouvelle Tâche' : 'Modifier la Tâche'}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de la tâche</label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="ex: Sauvegarde quotidienne"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Commande</label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="ex: /usr/bin/backup.sh"
                value={formData.command}
                onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de planification</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={formData.schedule}
                  onChange={handleScheduleChange}
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                  <option value="custom">Personnalisée</option>
                </select>
              </div>

              {formData.schedule !== 'custom' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Heure d'exécution</label>
                  <input
                    type="time"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={formData.time}
                    onChange={handleTimeChange}
                    required
                  />
                </div>
              )}
            </div>

            {formData.schedule === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Expression cron</label>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="ex: */5 * * * *"
                  value={formData.customSchedule}
                  onChange={handleCustomScheduleChange}
                  required
                />
              </div>
            )}

            {cronDescription && (
              <p className="text-sm text-muted-foreground">
                {cronDescription}
              </p>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border px-4 py-2 hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer la tâche' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}