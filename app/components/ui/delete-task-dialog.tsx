import { Cross2Icon, TrashIcon } from '@radix-ui/react-icons';

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
      <div className="w-full max-w-md rounded-lg bg-background p-6 border border-border shadow-lg">
        <h2 className="text-xl font-bold">Confirmer la suppression</h2>
        <p className="mt-2 text-muted-foreground">
          Êtes-vous sûr de vouloir supprimer la tâche &quot;{taskName}&quot; ? Cette action est irréversible.
        </p>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="flex items-center rounded-md border px-4 py-2 hover:bg-muted"
          >
            <Cross2Icon className="mr-2 h-4 w-4" />
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}