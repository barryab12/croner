import { Cross2Icon, TrashIcon } from '@radix-ui/react-icons'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface DeleteExecutionsDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
}

export default function DeleteExecutionsDialog({
  isOpen,
  onClose,
  onConfirm,
  count
}: DeleteExecutionsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            {count === 1
              ? "Êtes-vous sûr de vouloir supprimer cette exécution ?"
              : `Êtes-vous sûr de vouloir supprimer ces ${count} exécutions ?`}
            {" "}Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  )
}