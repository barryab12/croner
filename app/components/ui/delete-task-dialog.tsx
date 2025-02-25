interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskName: string;
}

export default function DeleteTaskDialog({ isOpen, onClose, onConfirm, taskName }: DeleteTaskDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6">
        <h2 className="text-xl font-bold">Confirmer la suppression</h2>
        <p className="mt-2 text-muted-foreground">
          Êtes-vous sûr de vouloir supprimer la tâche &quot;{taskName}&quot; ? Cette action est irréversible.
        </p>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 hover:bg-muted"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}