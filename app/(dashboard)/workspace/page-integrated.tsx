"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AgentCard } from "@/components/agent-card"
import { AgentForm } from "@/components/agent-form"
import { getAgents, deleteAgent, type Agent } from "@/lib/agents-real"
import { Plus, Search, Loader2, RefreshCw, Play, Pause } from "lucide-react"
import { toast } from "sonner"

export default function WorkspacePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pollingEnabled, setPollingEnabled] = useState(false)
  const [pollingInterval] = useState(30000) // 30 segundos

  // Função para carregar agentes
  const loadAgents = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const agentsList = await getAgents()
      setAgents(agentsList)
      setFilteredAgents(agentsList)
    } catch (error) {
      console.error('Error loading agents:', error)
      toast.error("Erro ao carregar agentes", {
        description: "Não foi possível carregar a lista de agentes. Tente novamente.",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar agentes na inicialização
  useEffect(() => {
    loadAgents()
  }, [])

  // Polling automático
  useEffect(() => {
    if (!pollingEnabled) {
      return
    }

    const intervalId = setInterval(() => {
      loadAgents(true)
    }, pollingInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [pollingEnabled, pollingInterval])

  // Filtrar agentes baseado na busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAgents(agents)
    } else {
      const filtered = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAgents(filtered)
    }
  }, [searchTerm, agents])

  // Função para criar novo agente
  const handleCreateAgent = () => {
    setEditingAgent(undefined)
    setShowForm(true)
  }

  // Função para editar agente
  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setShowForm(true)
  }

  // Função para deletar agente
  const handleDeleteAgent = async (agentId: string) => {
    if (confirm("Tem certeza que deseja excluir este agente?")) {
      const loadingToast = toast.loading("Excluindo agente...")

      try {
        const success = await deleteAgent(agentId)

        if (success) {
          // Atualizar lista imediatamente
          await loadAgents()
          toast.success("Agente excluído", {
            id: loadingToast,
            description: "O agente foi excluído com sucesso.",
          })
        } else {
          toast.error("Erro ao excluir agente", {
            id: loadingToast,
            description: "Não foi possível excluir o agente. Tente novamente.",
          })
        }
      } catch (error) {
        console.error('Error deleting agent:', error)
        toast.error("Erro ao excluir agente", {
          id: loadingToast,
          description: "Ocorreu um erro inesperado. Tente novamente.",
        })
      }
    }
  }

  // Função para lidar com sucesso do formulário
  const handleFormSuccess = async () => {
    setShowForm(false)
    setEditingAgent(undefined)
    // Atualizar lista imediatamente sem mostrar loader
    await loadAgents()
  }

  // Função para atualizar a lista
  const handleRefresh = () => {
    loadAgents(true)
  }

  // Função para alternar polling
  const handleTogglePolling = () => {
    const newState = !pollingEnabled
    setPollingEnabled(newState)

    if (newState) {
      toast.success("Atualização automática ativada", {
        description: "A lista será atualizada automaticamente a cada 30 segundos.",
      })
    } else {
      toast.info("Atualização automática desativada", {
        description: "A atualização automática foi desativada.",
      })
    }
  }

  // Estado de carregamento inicial
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando agentes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-balance">Meus Agentes</h2>
            <p className="text-muted-foreground text-pretty">
              Gerencie e monitore seus agentes de IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={pollingEnabled ? "default" : "outline"}
              size="icon"
              onClick={handleTogglePolling}
              title={pollingEnabled ? "Desativar atualização automática (a cada 30s)" : "Ativar atualização automática (a cada 30s)"}
              className={pollingEnabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {pollingEnabled ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar agora"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleCreateAgent} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Agente
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredAgents.length} de {agents.length} agentes
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum agente encontrado</h3>
            <p className="text-muted-foreground mb-4 text-pretty">
              {searchTerm 
                ? "Tente ajustar sua busca ou criar um novo agente" 
                : agents.length === 0
                ? "Comece criando seu primeiro agente de IA"
                : "Nenhum agente corresponde à sua busca"
              }
            </p>
            <Button onClick={handleCreateAgent}>
              {agents.length === 0 ? "Criar Primeiro Agente" : "Criar Novo Agente"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}

        {refreshing && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Atualizando...</span>
            </div>
          </div>
        )}

        {pollingEnabled && !refreshing && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Atualização automática ativa</span>
            </div>
          </div>
        )}
      </div>

      <AgentForm
        agent={editingAgent}
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}