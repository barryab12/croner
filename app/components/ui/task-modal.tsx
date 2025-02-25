export default function TaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-background p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold">Nouvelle Tâche</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de la tâche</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="ex: Sauvegarde quotidienne"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Commande</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="ex: /usr/bin/backup.sh"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de planification</label>
              <select className="w-full rounded-md border bg-background px-3 py-2">
                <option>Quotidienne</option>
                <option>Hebdomadaire</option>
                <option>Mensuelle</option>
                <option>Personnalisée</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Heure d'exécution</label>
              <input
                type="time"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expression cron</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="ex: 0 0 * * *"
            />
            <p className="text-xs text-muted-foreground">
              Format: minute heure jour_du_mois mois jour_de_la_semaine
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timeout (en secondes)</label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="ex: 3600"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded border" />
            <label className="text-sm font-medium">Activer cette tâche</label>
          </div>

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
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}