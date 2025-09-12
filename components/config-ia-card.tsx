"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfigIAInstancesDialog } from "@/components/config-ia-instances-dialog"
import { 
  Settings, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Bot,
  Link,
  Plus
} from "lucide-react"
import type { ConfigIA } from "@/lib/api-config"

interface ConfigIACardProps {
  configIA: ConfigIA
  onEdit?: (configIA: ConfigIA) => void
  onDelete?: (configIA: ConfigIA) => void
  onInstancesUpdated?: () => void
}

export function ConfigIACard({ 
  configIA, 
  onEdit, 
  onDelete, 
  onInstancesUpdated 
}: ConfigIACardProps) {
  const [showInstancesDialog, setShowInstancesDialog] = useState(false)

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800"
      case "inativo":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConnectionIcon = (state: string) => {
    switch (state) {
      case "CONNECTED":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case "CONNECTING":
        return <Clock className="h-3 w-3 text-yellow-500" />
      case "ERROR":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <XCircle className="h-3 w-3 text-gray-500" />
    }
  }

  const connectedInstancesCount = configIA.evolutionInstances?.filter(
    instance => instance.connectionState === "CONNECTED"
  ).length || 0

  const totalInstancesCount = configIA.evolutionInstances?.length || 0

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-blue-500" />
                <span className="truncate">{configIA.nome}</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Criado em {new Date(configIA.createdAt).toLocaleDateString('pt-BR')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(configIA.status)}>
                {configIA.status || 'inativo'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowInstancesDialog(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Instâncias
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(configIA)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(configIA)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prompt Preview */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Prompt:</p>
            <p className="text-sm line-clamp-2 bg-gray-50 p-2 rounded text-gray-700">
              {configIA.prompt}
            </p>
          </div>

          {/* Evolution Instances Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <Link className="h-4 w-4" />
                Instâncias Evolution
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstancesDialog(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Gerenciar
              </Button>
            </div>
            
            {totalInstancesCount > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total: {totalInstancesCount}</span>
                  <span className="text-green-600">Conectadas: {connectedInstancesCount}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {configIA.evolutionInstances?.slice(0, 3).map((instance) => (
                    <div 
                      key={instance.id} 
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {getConnectionIcon(instance.connectionState)}
                      <span className="truncate max-w-20">{instance.instanceName}</span>
                    </div>
                  ))}
                  {totalInstancesCount > 3 && (
                    <div className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                      +{totalInstancesCount - 3} mais
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-muted-foreground">
                <p className="text-sm">Nenhuma instância atribuída</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowInstancesDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Atribuir Instâncias
                </Button>
              </div>
            )}
          </div>

          {/* Webhooks Info */}
          {(configIA.webhookUrlProd || configIA.webhookUrlDev) && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Webhooks configurados:
                {configIA.webhookUrlProd && " Produção"}
                {configIA.webhookUrlDev && " Desenvolvimento"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para gerenciar instâncias */}
      <ConfigIAInstancesDialog
        configIA={configIA}
        open={showInstancesDialog}
        onOpenChange={setShowInstancesDialog}
        onSuccess={() => {
          onInstancesUpdated?.()
          // Opcional: Recarregar dados da ConfigIA aqui
        }}
      />
    </>
  )
}