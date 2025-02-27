'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import DeleteExecutionsDialog from '@/app/components/ui/delete-executions-dialog'
import { Checkbox } from '@/components/ui/checkbox'

type ExecutionStatus = 'SUCCESS' | 'ERROR' | 'TIMEOUT'

interface Task {
  id: string
  name: string
  command?: string 
}

interface TaskExecution {
  id: string
  taskId: string
  task: Task
  startTime: string
  endTime: string
  duration: number
  status: ExecutionStatus
  output?: string
  error?: string
  createdAt: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

function HistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [executions, setExecutions] = useState<TaskExecution[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [status, setStatus] = useState<string>(searchParams?.get('status') || '')
  const [date, setDate] = useState<string>(searchParams?.get('date') || '')
  const [page, setPage] = useState<number>(parseInt(searchParams?.get('page') || '1'))
  
  const [selectedExecution, setSelectedExecution] = useState<TaskExecution | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Fonction pour charger les exécutions
  const fetchExecutions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Construction des paramètres de requête
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (date) params.set('date', date)
      if (page) params.set('page', page.toString())
      
      const response = await fetch(`/api/executions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Échec de la récupération des données')
      }
      
      const data = await response.json()
      setExecutions(data.data)
      setPagination(data.pagination)
      
    } catch (err) {
      setError('Une erreur est survenue lors de la récupération des données')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [status, date, page])
  
  // Fonction pour charger les détails d'une exécution
  const fetchExecutionDetails = async (id: string) => {
    setIsLoadingDetails(true)
    try {
      const response = await fetch(`/api/executions/${id}`)
      
      if (!response.ok) {
        throw new Error('Échec de la récupération des détails')
      }
      
      const data = await response.json()
      setSelectedExecution(data)
      setIsDialogOpen(true)
    } catch (err) {
      console.error(err)
      setError('Impossible de récupérer les détails de cette exécution')
    } finally {
      setIsLoadingDetails(false)
    }
  }
  
  // Fonction pour mettre à jour les filtres et l'URL
  const updateFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (date) params.set('date', date)
    if (page > 1) params.set('page', page.toString())
    
    // Mettre à jour l'URL sans recharger la page
    const newUrl = `/history${params.toString() ? '?' + params.toString() : ''}`
    router.push(newUrl)
  }, [status, date, page, router])
  
  // Formatage de la durée en format lisible
  const formatDuration = (ms: number) => {
    if (!ms) return '0s'
    
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
  }
  
  // Chargement initial et lors du changement de filtres
  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])
  
  // Mise à jour de l'URL lorsque les filtres changent
  useEffect(() => {
    updateFilters()
  }, [updateFilters])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(executions.map(exec => exec.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectExecution = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(execId => execId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/executions?ids=${selectedIds.join(',')}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setDeleteDialogOpen(false)
      setSelectedIds([])
      await fetchExecutions()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Historique d'exécution</h1>
        
        <div className="flex space-x-2">
          <select 
            className="rounded-md border bg-background px-3 py-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1) // Réinitialiser la page lors du changement de filtre
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="SUCCESS">Succès</option>
            <option value="ERROR">Échec</option>
            <option value="TIMEOUT">Timeout</option>
          </select>
          
          <input
            type="date"
            className="rounded-md border bg-background px-3 py-2"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setPage(1) // Réinitialiser la page lors du changement de filtre
            }}
          />
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Supprimer ({selectedIds.length})
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 border-b pb-4 font-medium">
            <div className="flex items-center">
              <Checkbox 
                checked={selectedIds.length === executions.length && executions.length > 0}
                onChange={handleSelectAll}
                className="shadow-sm hover:shadow-md"
              />
            </div>
            <div>Tâche</div>
            <div>Date d&apos;exécution</div>
            <div>Durée</div>
            <div>Statut</div>
            <div>Actions</div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              Aucune exécution trouvée
            </div>
          ) : (
            executions.map(execution => (
              <div key={execution.id} className="grid grid-cols-6 gap-4 py-4 hover:bg-muted/50">
                <div className="flex items-center">
                  <Checkbox 
                    checked={selectedIds.includes(execution.id)}
                    onChange={() => handleSelectExecution(execution.id)}
                    className="shadow-sm hover:shadow-md"
                  />
                </div>
                <div className="font-medium">{execution.task.name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(execution.startTime), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                </div>
                <div className="text-sm">
                  {formatDuration(execution.duration)}
                </div>
                <div className={`text-sm ${
                  execution.status === 'SUCCESS' 
                    ? 'text-green-600' 
                    : execution.status === 'TIMEOUT'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {execution.status === 'SUCCESS' 
                    ? 'Succès' 
                    : execution.status === 'TIMEOUT'
                    ? 'Timeout'
                    : 'Échec'}
                </div>
                <div>
                  <button 
                    className="rounded-md border p-2 hover:bg-muted"
                    onClick={() => fetchExecutionDetails(execution.id)}
                    disabled={isLoadingDetails}
                  >
                    {isLoadingDetails ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : 'Voir les logs'}
                  </button>
                </div>
              </div>
            ))
          )}
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à {
                  Math.min(pagination.page * pagination.limit, pagination.total)
                } sur {pagination.total} résultats
              </div>
              
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Précédent
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Afficher les pages environnantes de la page actuelle
                    let pageNum = i + 1
                    if (pagination.totalPages > 5) {
                      if (pagination.page > 3) {
                        pageNum = pagination.page - 2 + i
                      }
                      if (pagination.page > pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      }
                    }
                    
                    return (
                      <button
                        key={i}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                          pageNum === pagination.page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  className="px-3 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Dialog pour afficher les détails de l'exécution */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between flex-wrap gap-2">
              <span className="truncate max-w-[75%]">Détails de l'exécution - {selectedExecution?.task.name}</span>
              {selectedExecution && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedExecution.status === 'SUCCESS' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : selectedExecution.status === 'TIMEOUT'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {selectedExecution.status === 'SUCCESS' 
                    ? 'Succès' 
                    : selectedExecution.status === 'TIMEOUT'
                    ? 'Timeout'
                    : 'Échec'}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Détails et résultats de l&apos;exécution de la tâche planifiée
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-6">
              {/* Informations de commande et timing */}
              <div className="border rounded-lg p-4 bg-card/50">
                <h3 className="font-medium mb-3">Informations générales</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Commande exécutée</p>
                  <div className="font-mono bg-muted p-3 rounded text-sm overflow-x-auto break-all">
                    <code className="whitespace-pre-wrap break-all">
                      {selectedExecution.task.command || "Aucune commande définie"}
                    </code>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Démarré à</p>
                    <p className="font-medium">{format(new Date(selectedExecution.startTime), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Terminé à</p>
                    <p className="font-medium">{format(new Date(selectedExecution.endTime), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Durée</p>
                    <p className="font-medium">{formatDuration(selectedExecution.duration)}</p>
                  </div>
                </div>
              </div>
              
              {/* Sortie de la commande - succès */}
              {selectedExecution.status === 'SUCCESS' && (
                <div className="border rounded-lg p-4 bg-card/50">
                  <h3 className="font-medium mb-3 flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Sortie de la commande
                  </h3>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap break-words border max-h-[300px] overflow-y-auto w-full">
                      <code className="break-all">
                        {selectedExecution.output || 'Aucune sortie'}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Erreur de la commande */}
              {selectedExecution.status !== 'SUCCESS' && (
                <div className="border rounded-lg p-4 bg-card/50">
                  <h3 className="font-medium mb-3 flex items-center">
                    <span className={`h-2 w-2 rounded-full ${
                      selectedExecution.status === 'TIMEOUT' ? 'bg-amber-500' : 'bg-red-500'
                    } mr-2`}></span>
                    {selectedExecution.status === 'TIMEOUT' ? 'Timeout de la commande' : 'Erreur de la commande'}
                  </h3>
                  <div className="relative">
                    <pre className={`p-4 rounded-md text-sm whitespace-pre-wrap border max-h-[300px] overflow-y-auto w-full ${
                      selectedExecution.status === 'TIMEOUT'
                        ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200'
                        : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200'
                    }`}>
                      <code className="break-all">
                        {selectedExecution.error || selectedExecution.output || 'Aucune information disponible'}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <DeleteExecutionsDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        count={selectedIds.length}
      />
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <HistoryContent />
    </Suspense>
  )
}