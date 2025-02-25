export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Historique d'exécution</h1>
        <div className="flex space-x-2">
          <select className="rounded-md border bg-background px-3 py-2">
            <option>Tous les statuts</option>
            <option>Succès</option>
            <option>Échec</option>
          </select>
          <input
            type="date"
            className="rounded-md border bg-background px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4 border-b pb-4 font-medium">
            <div>Tâche</div>
            <div>Date d'exécution</div>
            <div>Durée</div>
            <div>Statut</div>
            <div>Actions</div>
          </div>

          {/* Example history items */}
          <div className="grid grid-cols-5 gap-4 py-4 hover:bg-muted/50">
            <div className="font-medium">Sauvegarde DB</div>
            <div className="text-sm text-muted-foreground">
              2024-01-20 00:00:00
            </div>
            <div className="text-sm">2m 30s</div>
            <div className="text-sm text-green-600">Succès</div>
            <div>
              <button className="rounded-md border p-2 hover:bg-muted">
                Voir les logs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-4 hover:bg-muted/50">
            <div className="font-medium">Nettoyage Cache</div>
            <div className="text-sm text-muted-foreground">
              2024-01-19 23:00:00
            </div>
            <div className="text-sm">45s</div>
            <div className="text-sm text-red-600">Échec</div>
            <div>
              <button className="rounded-md border p-2 hover:bg-muted">
                Voir les logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}