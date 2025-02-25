"use client";

import { useState } from "react";
import TaskModal from "@/app/components/ui/task-modal";

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tâches Cron</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Nouvelle Tâche
        </button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 border-b pb-4 font-medium">
            <div>Nom</div>
            <div>Commande</div>
            <div>Planification</div>
            <div>Dernier statut</div>
            <div>Prochaine exécution</div>
            <div>Actions</div>
          </div>
          
          {/* Example task items */}
          <div className="grid grid-cols-6 gap-4 py-4 hover:bg-muted/50">
            <div className="font-medium">Sauvegarde DB</div>
            <div className="text-sm text-muted-foreground">backup-db.sh</div>
            <div className="text-sm">Tous les jours à 00:00</div>
            <div className="text-sm text-green-600">Succès</div>
            <div className="text-sm text-muted-foreground">Dans 6h</div>
            <div className="flex space-x-2">
              <button className="rounded-md border p-2 hover:bg-muted">
                Éditer
              </button>
              <button className="rounded-md border p-2 hover:bg-muted">
                Exécuter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 py-4 hover:bg-muted/50">
            <div className="font-medium">Nettoyage Cache</div>
            <div className="text-sm text-muted-foreground">clear-cache.sh</div>
            <div className="text-sm">Hebdomadaire</div>
            <div className="text-sm text-red-600">Échec</div>
            <div className="text-sm text-muted-foreground">Dans 2j</div>
            <div className="flex space-x-2">
              <button className="rounded-md border p-2 hover:bg-muted">
                Éditer
              </button>
              <button className="rounded-md border p-2 hover:bg-muted">
                Exécuter
              </button>
            </div>
          </div>
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}