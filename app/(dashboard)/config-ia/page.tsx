"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ConfigIACard } from "@/components/config-ia-card"
import { Plus, Search, Loader2 } from "lucide-react"
import { configIAService } from "@/lib/config-ia-api"
import { useUserId } from "@/lib/use-user-id"
import type { ConfigIA } from "@/lib/api-config"

export default function ConfigIAPage() {
  const { toast } = useToast()
  const userId = useUserId()
  const [configs, setConfigs] = useState<ConfigIA[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Carregar configurações de IA
  useEffect(() => {
    loadConfigs()
  }, [userId])

  const loadConfigs = async (forceRefresh = false) => {
    if (!userId) return

    try {
      if (forceRefresh) setIsLoading(true)
      
      const response = await configIAService.getConfigsByUser(userId)
      
      if (response.success) {
        setConfigs(response.data || [])
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao carregar configurações",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading configs:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao carregar configurações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (configIA: ConfigIA) => {
    // Implementar edição
    console.log('Edit config:', configIA)
    toast({
      title: "Editar ConfigIA",
      description: `Funcionalidade de edição para ${configIA.nome}`,
    })
  }

  const handleDelete = async (configIA: ConfigIA) => {
    if (!confirm(`Tem certeza que deseja excluir "${configIA.nome}"?`)) {
      return
    }

    try {
      const response = await configIAService.deleteConfig(configIA.id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: `ConfigIA "${configIA.nome}" excluída com sucesso`,
        })
        loadConfigs()
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao excluir configuração",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting config:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao excluir configuração",
        variant: "destructive",
      })
    }
  }

  const handleInstancesUpdated = () => {
    // Recarregar configurações para atualizar as instâncias
    loadConfigs()
  }

  // Filtrar configurações baseado na busca
  const filteredConfigs = (configs || []).filter(config =>
    config.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Configurações de IA</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações de IA e as instâncias Evolution atribuídas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar configurações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm font-medium text-blue-700">Total de Configurações</p>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{(configs || []).length}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <p className="text-sm font-medium text-green-700">Instâncias Atribuídas</p>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {(configs || []).reduce((acc, config) => acc + (config.evolutionInstances?.length || 0), 0)}
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
            <p className="text-sm font-medium text-purple-700">Instâncias Conectadas</p>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {(configs || []).reduce((acc, config) =>
              acc + (config.evolutionInstances?.filter(i => i.connectionState === "CONNECTED").length || 0), 0
            )}
          </p>
        </div>
      </div>

      {/* Config Cards */}
      {filteredConfigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfigs.map((config) => (
            <ConfigIACard
              key={config.id}
              configIA={config}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInstancesUpdated={handleInstancesUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma configuração encontrada' : 'Nenhuma configuração criada'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca' 
                : 'Crie sua primeira configuração de IA para começar'
              }
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira configuração
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}