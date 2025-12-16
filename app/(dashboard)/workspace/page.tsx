"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AgentCard } from "@/components/agent-card"
import { AgentForm } from "@/components/agent-form"
import { ConfigIAInstancesDialog } from "@/components/config-ia-instances-dialog"
import { DeactivatedAgentsDialog } from "@/components/deactivated-agents-dialog"
import { ManageCredentialsDialog } from "@/components/manage-credentials-dialog"
import { RdStationTokenDialog } from "@/components/rdstation-token-dialog"
import { KPICards } from "@/components/kpi-cards"
import { getAgents, deleteAgent, toggleAgentStatus, type Agent } from "@/lib/agents-real"
import { configIAService } from "@/lib/config-ia-api"
import { Plus, Search, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUserId } from "@/lib/use-user-id"
export default function WorkspacePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showInstancesDialog, setShowInstancesDialog] = useState(false)
  const [selectedConfigIA, setSelectedConfigIA] = useState<any>(null)
  const [showBlockedNumbersDialog, setShowBlockedNumbersDialog] = useState(false)
  const [selectedAgentForBlocking, setSelectedAgentForBlocking] = useState<Agent | null>(null)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [selectedAgentForCredentials, setSelectedAgentForCredentials] = useState<Agent | null>(null)
  const [showRdTokenDialog, setShowRdTokenDialog] = useState(false)
  const [rdTokenDialogMode, setRdTokenDialogMode] = useState<"generate" | "refresh">("generate")
  const [selectedAgentForRdToken, setSelectedAgentForRdToken] = useState<Agent | null>(null)
  const { toast } = useToast()
  const userId = useUserId()

  // Função para carregar agentes
  const loadAgents = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      if (!userId) {
        throw new Error("Usuário não autenticado")
      }

      const agentsList = await getAgents(userId)
      setAgents(agentsList)
      setFilteredAgents(agentsList)
    } catch (error) {
      console.error('Error loading agents:', error)
      toast({
        title: "Erro ao carregar agentes",
        description: "Não foi possível carregar a lista de agentes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar agentes na inicialização
  useEffect(() => {
    if (userId) {
      loadAgents()
    }
  }, [userId])

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

  // Função para deletar agente
  const handleDeleteAgent = async (agentId: string) => {
    if (confirm("Tem certeza que deseja excluir este agente?")) {
      try {
        const success = await deleteAgent(agentId)

        if (success) {
          toast({
            title: "Agente excluído",
            description: "O agente foi excluído com sucesso.",
          })
          await loadAgents()
        } else {
          toast({
            title: "Erro ao excluir agente",
            description: "Não foi possível excluir o agente. Tente novamente.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting agent:', error)
        toast({
          title: "Erro ao excluir agente",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  // Função para lidar com sucesso do formulário
  const handleFormSuccess = async () => {
    try {
      const wasEditing = !!editingAgent
      const agentName = editingAgent?.name || "novo agente"

      setShowForm(false)
      setEditingAgent(undefined)

      // Recarregar lista de agentes
      await loadAgents(true)

      toast({
        title: wasEditing ? "Agente atualizado" : "Agente criado",
        description: wasEditing
          ? `${agentName} foi atualizado com sucesso.`
          : "Novo agente criado com sucesso. Use os 3 pontinhos para atribuir instâncias Evolution.",
      })

      console.log('✅ [SUCCESS] Agente salvo:', wasEditing ? 'atualizado' : 'criado')
    } catch (error) {
      console.error('Error in form success handler:', error)
      toast({
        title: "Aviso",
        description: "Agente salvo, mas houve erro ao atualizar a lista.",
        variant: "destructive",
      })
    }
  }

  // Função para cancelar formulário
  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAgent(undefined)
  }

  // Função para atualizar a lista
  const handleRefresh = () => {
    loadAgents(true)
  }

  // Função para toggle status do agente
  const handleToggleStatus = async (agentId: string, newStatus: "active" | "inactive" | "development") => {
    try {
      console.log(`🔄 Toggling agent ${agentId} status to: ${newStatus}`)

      const updatedAgent = await toggleAgentStatus(agentId, newStatus)

      if (updatedAgent) {
        // Atualizar o estado local imediatamente
        setAgents(prev => prev.map(agent =>
          agent.id === agentId ? updatedAgent : agent
        ))

        // Também atualizar os agentes filtrados
        setFilteredAgents(prev => prev.map(agent =>
          agent.id === agentId ? updatedAgent : agent
        ))

        const statusText = newStatus === "active" ? "ativado" : newStatus === "development" ? "colocado em desenvolvimento" : "desativado"
        toast({
          title: `Agente ${statusText}`,
          description: `O agente "${updatedAgent.name}" foi ${statusText} com sucesso.`,
          variant: newStatus === "active" ? "default" : newStatus === "development" ? "default" : "destructive",
        })

        console.log(`✅ Agent ${updatedAgent.name} status updated to: ${updatedAgent.status}`)
      } else {
        throw new Error("Failed to toggle agent status")
      }
    } catch (error) {
      console.error('Error toggling agent status:', error)
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do agente. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para gerenciar instâncias do agente
  const handleManageInstances = async (agent: Agent) => {
    try {
      if (!userId) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        })
        return
      }

      // Buscar a ConfigIA correspondente ao agente com instâncias
      const response = await configIAService.getConfigById(agent.id)

      if (response.success && response.data) {
        // Converter para o formato esperado pelo dialog
        const configIA = {
          ...response.data,
          evolutionInstances: response.data.evolutionInstances || []
        }

        setSelectedConfigIA(configIA)
        setShowInstancesDialog(true)

        console.log('🔧 [MANAGE] Abrindo dialog para agente:', agent.name, 'com', configIA.evolutionInstances?.length || 0, 'instâncias')
      } else {
        toast({
          title: "Erro",
          description: response.message || "Não foi possível carregar as informações do agente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading config for instances:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao carregar configuração",
        variant: "destructive",
      })
    }
  }

  // Função para quando as instâncias são atualizadas
  const handleInstancesUpdated = () => {
    // Pode recarregar os agentes se necessário
    loadAgents(true)
  }

  // Função para gerenciar números bloqueados
  const handleManageBlockedNumbers = async (agent: Agent) => {
    try {
      console.log('📞 [BLOCKED] Abrindo dialog para gerenciar números bloqueados do agente:', agent.name)

      setSelectedAgentForBlocking(agent)
      setShowBlockedNumbersDialog(true)
    } catch (error) {
      console.error('Error opening blocked numbers dialog:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao abrir gerenciamento de números bloqueados",
        variant: "destructive",
      })
    }
  }

  // Função para gerenciar credenciais
  const handleManageCredentials = async (agent: Agent) => {
    try {
      console.log('🔑 [CREDENTIALS] Abrindo dialog para gerenciar credenciais do agente:', agent.name)

      setSelectedAgentForCredentials(agent)
      setShowCredentialsDialog(true)
    } catch (error) {
      console.error('Error opening credentials dialog:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao abrir gerenciamento de credenciais",
        variant: "destructive",
      })
    }
  }

  // Função para abrir dialog de geração de token do RD Station
  const handleGenerateRdToken = (agent: Agent) => {
    setSelectedAgentForRdToken(agent)
    setRdTokenDialogMode("generate")
    setShowRdTokenDialog(true)
  }

  // Função para abrir dialog de atualização de token do RD Station
  const handleRefreshRdToken = (agent: Agent) => {
    setSelectedAgentForRdToken(agent)
    setRdTokenDialogMode("refresh")
    setShowRdTokenDialog(true)
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
              Gerencie seus agentes de IA e suas instâncias Evolution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar lista"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/workspace/novo">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards agents={agents} />

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

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDeleteAgent}
                onManageInstances={handleManageInstances}
                onToggleStatus={handleToggleStatus}
                onManageBlockedNumbers={handleManageBlockedNumbers}
                onManageCredentials={handleManageCredentials}
                onGenerateRdToken={handleGenerateRdToken}
                onRefreshRdToken={handleRefreshRdToken}
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
      </div>

      <AgentForm
        agent={editingAgent}
        open={showForm}
        onOpenChange={handleFormCancel}
        onSuccess={handleFormSuccess}
      />

      {selectedConfigIA && (
        <ConfigIAInstancesDialog
          configIA={selectedConfigIA}
          open={showInstancesDialog}
          onOpenChange={setShowInstancesDialog}
          onSuccess={handleInstancesUpdated}
        />
      )}

      {selectedAgentForBlocking && (
        <DeactivatedAgentsDialog
          agent={selectedAgentForBlocking}
          open={showBlockedNumbersDialog}
          onOpenChange={setShowBlockedNumbersDialog}
        />
      )}

      <ManageCredentialsDialog
        agent={selectedAgentForCredentials}
        open={showCredentialsDialog}
        onOpenChange={setShowCredentialsDialog}
        onSuccess={loadAgents}
      />

      <RdStationTokenDialog
        agent={selectedAgentForRdToken}
        open={showRdTokenDialog}
        onOpenChange={setShowRdTokenDialog}
        onSuccess={() => loadAgents(true)}
        mode={rdTokenDialogMode}
      />
    </div>
  )
}