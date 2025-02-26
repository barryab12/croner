import { useState, useEffect, ChangeEvent } from 'react';
import type { Task } from '@/types/prisma';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { describeCronExpression, validateCronExpression } from "@/lib/utils"

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  mode?: 'create' | 'edit';
}

export default function TaskModal({ isOpen, onClose, task, mode = 'create' }: TaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    schedule: 'daily',
    time: '00:00',
    customSchedule: '',
  });
  const [cronDescription, setCronDescription] = useState<string>('');

  // Fonction pour obtenir l'expression cron basée sur le type de planification
  const getCronExpression = (scheduleType: string, timeValue: string): string => {
    const [hours, minutes] = timeValue.split(':');
    switch (scheduleType) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * 1`;
      case 'monthly':
        return `${minutes} ${hours} 1 * *`;
      case 'custom':
        return formData.customSchedule;
      default:
        return '';
    }
  };

  // Mettre à jour la description quand le schedule ou l'heure change
  const updateCronDescription = (schedule: string, timeValue: string) => {
    if (schedule === 'custom') {
      if (formData.customSchedule) {
        const { description, isValid } = describeCronExpression(formData.customSchedule);
        setCronDescription(description);
        if (!isValid) {
          toast.error("Expression cron invalide");
        }
      } else {
        setCronDescription('');
      }
    } else {
      const cronExp = getCronExpression(schedule, timeValue);
      const { description } = describeCronExpression(cronExp);
      setCronDescription(description);
    }
  };

  // Premier useEffect pour initialiser le formulaire
  useEffect(() => {
    if (task && mode === 'edit') {
      let time = '00:00';
      let schedule = 'custom';
      let customSchedule = task.schedule;

      const cronParts = task.schedule.split(' ');
      if (cronParts.length === 5) {
        const [minutes, hours, dayMonth, month, dayWeek] = cronParts;
        
        if (dayMonth === '*' && month === '*' && dayWeek === '*') {
          schedule = 'daily';
          time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        } else if (dayMonth === '*' && month === '*' && dayWeek === '1') {
          schedule = 'weekly';
          time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        } else if (dayMonth === '1' && month === '*' && dayWeek === '*') {
          schedule = 'monthly';
          time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
      }

      setFormData({
        name: task.name,
        command: task.command,
        schedule,
        time,
        customSchedule,
      });
    }
  }, [task, mode]);

  // Deuxième useEffect pour mettre à jour la description
  useEffect(() => {
    updateCronDescription(formData.schedule, formData.time);
  }, [formData.schedule, formData.time, formData.customSchedule]);

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
      const cronExpression = getCronExpression(formData.schedule, formData.time);
      if (!cronExpression) {
        throw new Error('Expression cron invalide');
      }

      const method = mode === 'create' ? 'POST' : 'PATCH';
      const body = mode === 'create' 
        ? { 
            name: formData.name, 
            command: formData.command, 
            schedule: formData.schedule === 'custom' ? formData.customSchedule : cronExpression 
          }
        : { 
            id: task?.id, 
            name: formData.name, 
            command: formData.command,
            isActive: task?.isActive,
            schedule: formData.schedule === 'custom' ? formData.customSchedule : cronExpression 
          };

      const response = await fetch('/api/tasks', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Une erreur est survenue');
      }

      onClose();
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
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