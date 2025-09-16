"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Settings, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle 
} from "lucide-react"
import { 
  configIAInstancesService, 
  type EvolutionInstanceSummary, 
  type ConfigIAWithInstances 
} from "@/lib/config-ia-instances-api"

interface ConfigIAInstancesDialogProps {
  configIA: ConfigIAWithInstances
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ConfigIAInstancesDialog({ 
  configIA, 
  open, 
  onOpenChange, 
  onSuccess 
}: ConfigIAInstancesDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [availableInstances, setAvailableInstances] = useState<EvolutionInstanceSummary[]>([])
  const [assignedInstances, setAssignedInstances] = useState<EvolutionInstanceSummary[]>([])
  const [selectedInstances, setSelectedInstances] = useState<string[]>([])
  const [selectedForRemoval, setSelectedForRemoval] = useState<string[]>([])

  // Carregar instâncias quando o dialog abrir
  useEffect(() => {
    if (open) {
      // Inicializar instâncias atribuídas do configIA
      setAssignedInstances(configIA.evolutionInstances || [])
      loadAvailableInstances()
      setSelectedInstances([])
      setSelectedForRemoval([])
    }
  }, [open, configIA.evolutionInstances])

  const loadAvailableInstances = async () => {
    try {
      setIsLoading(true)
      const response = await configIAInstancesService.getAvailableInstances(configIA.id)
      
      if (response.success) {
        setAvailableInstances(response.data || [])
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao carregar instâncias disponíveis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading available instances:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao carregar instâncias",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignInstances = async () => {
    if (selectedInstances.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma instância para atribuir",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await configIAInstancesService.assignInstances(configIA.id, selectedInstances)

      if (response.success) {
        // Encontrar instâncias selecionadas para atribuir
        const instancesToAssign = availableInstances.filter(instance =>
          selectedInstances.includes(instance.id)
        )

        // Atualizar estados locais
        setAvailableInstances(prev => prev.filter(instance =>
          !selectedInstances.includes(instance.id)
        ))

        setAssignedInstances(prev => [...prev, ...instancesToAssign])

        toast({
          title: "Sucesso",
          description: response.message || `${selectedInstances.length} instâncias atribuídas com sucesso`,
        })

        setSelectedInstances([])
        onSuccess() // Notificar componente pai para atualizar
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao atribuir instâncias",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error assigning instances:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao atribuir instâncias",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassignInstances = async () => {
    if (selectedForRemoval.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma instância para desatribuir",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await configIAInstancesService.unassignInstances(configIA.id, selectedForRemoval)

      if (response.success) {
        // Encontrar instâncias que serão removidas
        const instancesToRemove = assignedInstances.filter(instance =>
          selectedForRemoval.includes(instance.id)
        )

        // Atualizar estados locais
        setAssignedInstances(prev => prev.filter(instance =>
          !selectedForRemoval.includes(instance.id)
        ))

        setAvailableInstances(prev => [...prev, ...instancesToRemove])

        toast({
          title: "Sucesso",
          description: response.message || `${selectedForRemoval.length} instâncias desatribuídas com sucesso`,
        })

        setSelectedForRemoval([])
        onSuccess() // Notificar componente pai para atualizar
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao desatribuir instâncias",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error unassigning instances:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao desatribuir instâncias",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getConnectionIcon = (state: string) => {
    switch (state) {
      case "CONNECTED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "CONNECTING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "ERROR":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionColor = (state: string) => {
    switch (state) {
      case "CONNECTED":
        return "bg-green-100 text-green-800"
      case "CONNECTING":
        return "bg-yellow-100 text-yellow-800"
      case "ERROR":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Instâncias - {configIA.nome}
          </DialogTitle>
          <DialogDescription>
            Gerencie as instâncias Evolution atribuídas a esta configuração de IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instâncias Atualmente Atribuídas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Instâncias Atribuídas ({assignedInstances.length})</h3>
              {assignedInstances.length > 0 && (
                <Button
                  onClick={handleUnassignInstances}
                  disabled={selectedForRemoval.length === 0 || isLoading}
                  variant="destructive"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Desatribuir Selecionadas ({selectedForRemoval.length})
                </Button>
              )}
            </div>

            <ScrollArea className="h-48 border rounded-md p-3">
              {assignedInstances.length > 0 ? (
                <div className="space-y-2">
                  {assignedInstances.map((instance) => (
                    <div key={instance.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                      <Checkbox
                        id={`remove-${instance.id}`}
                        checked={selectedForRemoval.includes(instance.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedForRemoval(prev => [...prev, instance.id])
                          } else {
                            setSelectedForRemoval(prev => prev.filter(id => id !== instance.id))
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{instance.instanceName}</p>
                          {getConnectionIcon(instance.connectionState)}
                          <Badge variant="outline" className={`text-xs ${getConnectionColor(instance.connectionState)}`}>
                            {instance.connectionState}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{instance.displayName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Nenhuma instância atribuída</p>
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator />

          {/* Instâncias Disponíveis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Instâncias Disponíveis ({availableInstances.length})</h3>
              <Button
                onClick={handleAssignInstances}
                disabled={selectedInstances.length === 0 || isLoading}
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Atribuir Selecionadas ({selectedInstances.length})
              </Button>
            </div>

            <ScrollArea className="h-48 border rounded-md p-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : availableInstances.length > 0 ? (
                <div className="space-y-2">
                  {availableInstances.map((instance) => (
                    <div key={instance.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                      <Checkbox
                        id={`add-${instance.id}`}
                        checked={selectedInstances.includes(instance.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInstances(prev => [...prev, instance.id])
                          } else {
                            setSelectedInstances(prev => prev.filter(id => id !== instance.id))
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{instance.instanceName}</p>
                          {getConnectionIcon(instance.connectionState)}
                          <Badge variant="outline" className={`text-xs ${getConnectionColor(instance.connectionState)}`}>
                            {instance.connectionState}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{instance.displayName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Nenhuma instância disponível</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}