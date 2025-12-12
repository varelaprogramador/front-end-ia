"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Loader2,
  RefreshCw,
  Workflow,
  Users,
  DollarSign,
  Trophy,
  XCircle,
  Settings,
  Bot,
  Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUserId } from "@/lib/use-user-id"
import {
  funnelService,
  type Funnel,
  type FunnelStage,
  type FunnelLead,
  type CreateLeadRequest,
  type CreateStageRequest,
} from "@/lib/funnel-api"
import { evolutionInstanceService } from "@/lib/evolution-instance-api"
import { KanbanBoard } from "@/components/funnel/kanban-board"
import { LeadDialog } from "@/components/funnel/lead-dialog"
import { StageDialog } from "@/components/funnel/stage-dialog"
import { FunnelDialog } from "@/components/funnel/funnel-dialog"
import { type FunnelFormData } from "@/components/funnel/funnel-form-step1"

export default function FunilPage() {
  const router = useRouter()
  const { toast } = useToast()
  const userId = useUserId()

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null)

  // Dialogs
  const [showFunnelDialog, setShowFunnelDialog] = useState(false)
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null)
  const [showLeadDialog, setShowLeadDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<FunnelLead | null>(null)
  const [defaultStageId, setDefaultStageId] = useState<string>("")
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null)

  // Evolution Instance for WhatsApp integration
  const [evolutionInstanceId, setEvolutionInstanceId] = useState<string | undefined>(undefined)

  // Load funnels
  const loadFunnels = async (showRefreshLoader = false, selectNewFunnel = false) => {
    if (!userId) return

    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await funnelService.getFunnelsByUser(userId)
      const funnelsList = response.data || []
      setFunnels(funnelsList)

      // Auto-select first funnel if none selected or if creating new funnel
      if (funnelsList.length > 0) {
        if (selectNewFunnel) {
          // Select the newest funnel (first in list since ordered by createdAt desc)
          await loadFunnelDetails(funnelsList[0].id)
        } else if (!selectedFunnel) {
          await loadFunnelDetails(funnelsList[0].id)
        } else {
          // Reload current funnel details
          await loadFunnelDetails(selectedFunnel.id)
        }
      }
    } catch (error) {
      console.error("Error loading funnels:", error)
      toast({
        title: "Erro ao carregar funis",
        description: "Não foi possível carregar a lista de funis.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load funnel details
  const loadFunnelDetails = async (funnelId: string) => {
    try {
      const response = await funnelService.getFunnelById(funnelId)
      if (response.data) {
        setSelectedFunnel(response.data)
      }
    } catch (error) {
      console.error("Error loading funnel details:", error)
      toast({
        title: "Erro ao carregar funil",
        description: "Não foi possível carregar os detalhes do funil.",
        variant: "destructive",
      })
    }
  }

  // Load first connected Evolution instance for WhatsApp contact search
  const loadEvolutionInstance = async () => {
    if (!userId) return
    try {
      const response = await evolutionInstanceService.getInstancesByUser(userId)
      // API returns { success, instances, count } not { success, data }
      const instances = (response as any).instances || response.data || []

      if (response.success && instances.length > 0) {
        // Find first connected instance
        const connectedInstance = instances.find(
          (instance: any) => instance.connectionState === "CONNECTED"
        )
        if (connectedInstance) {
          setEvolutionInstanceId(connectedInstance.id)
        }
      }
    } catch (error) {
      console.error("Error loading Evolution instance:", error)
    }
  }

  useEffect(() => {
    if (userId) {
      loadFunnels()
      loadEvolutionInstance()
    }
  }, [userId])

  // Handle funnel change
  const handleFunnelChange = async (funnelId: string) => {
    await loadFunnelDetails(funnelId)
  }

  // Handle create/edit funnel
  const handleSaveFunnel = async (data: FunnelFormData) => {
    try {
      if (editingFunnel) {
        // Para update, não enviamos os stages (já foram criados na criação)
        const updateData = {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          configIaId: data.configIaId,
          kommoPipelineId: data.kommoPipelineId,
          kommoPipelineName: data.kommoPipelineName,
          rdstationPipelineId: data.rdstationPipelineId,
          rdstationPipelineName: data.rdstationPipelineName,
          rdstationOwnerId: data.rdstationOwnerId,
          rdstationOwnerName: data.rdstationOwnerName,
        }
        await funnelService.updateFunnel(editingFunnel.id, updateData)
        toast({ title: "Funil atualizado com sucesso!" })
        await loadFunnels(true, false)
      } else {
        // Para criação, enviamos os stages do CRM para criar as etapas do funil
        // e os deals do RD Station para criar os leads automaticamente
        await funnelService.createFunnel({
          userId: userId!,
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          configIaId: data.configIaId,
          kommoPipelineId: data.kommoPipelineId,
          kommoPipelineName: data.kommoPipelineName,
          kommoStages: data.kommoStages,
          rdstationPipelineId: data.rdstationPipelineId,
          rdstationPipelineName: data.rdstationPipelineName,
          rdstationOwnerId: data.rdstationOwnerId,
          rdstationOwnerName: data.rdstationOwnerName,
          rdstationStages: data.rdstationStages,
          rdstationDeals: data.rdstationDeals,
        })
        toast({ title: "Funil criado com sucesso!" })
        // Select the newly created funnel
        await loadFunnels(true, true)
      }
    } catch (error: any) {
      console.error("Error saving funnel:", error)
      // Extrair mensagem de erro do backend
      const errorMessage = error?.response?.data?.error || error?.message || "Erro ao salvar funil"
      // Usar window.alert para garantir visibilidade do erro
      window.alert(errorMessage)
      throw error
    }
  }

  // Handle delete funnel
  const handleDeleteFunnel = async (funnelId: string) => {
    if (!confirm("Tem certeza que deseja excluir este funil? Todos os leads e estágios serão removidos permanentemente.")) return

    try {
      await funnelService.deleteFunnel(funnelId)
      toast({ title: "Funil excluído com sucesso!" })
      setSelectedFunnel(null)
      await loadFunnels(true, false)
    } catch (error: any) {
      console.error("Error deleting funnel:", error)
      const errorMessage = error?.response?.data?.error || error?.message || "Erro ao excluir funil"
      toast({
        title: "Erro ao excluir funil",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Handle create/edit lead
  const handleSaveLead = async (data: CreateLeadRequest & { tags: string[] }) => {
    if (!selectedFunnel) return

    try {
      if (editingLead) {
        await funnelService.updateLead(editingLead.id, data)
        toast({ title: "Lead atualizado com sucesso!" })
      } else {
        await funnelService.createLead(selectedFunnel.id, data)
        toast({ title: "Lead criado com sucesso!" })
      }
      await loadFunnelDetails(selectedFunnel.id)
    } catch (error) {
      console.error("Error saving lead:", error)
      toast({
        title: "Erro ao salvar lead",
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle move lead
  const handleMoveLead = async (leadId: string, stageId: string, order: number) => {
    try {
      await funnelService.moveLead(leadId, { stageId, order })
      // Reload funnel to get updated positions
      if (selectedFunnel) {
        await loadFunnelDetails(selectedFunnel.id)
      }
    } catch (error) {
      console.error("Error moving lead:", error)
      toast({
        title: "Erro ao mover lead",
        variant: "destructive",
      })
    }
  }

  // Handle delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return

    try {
      await funnelService.deleteLead(leadId)
      toast({ title: "Lead excluído com sucesso!" })
      if (selectedFunnel) {
        await loadFunnelDetails(selectedFunnel.id)
      }
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast({
        title: "Erro ao excluir lead",
        variant: "destructive",
      })
    }
  }

  // Handle create/edit stage
  const handleSaveStage = async (data: CreateStageRequest) => {
    if (!selectedFunnel) return

    try {
      if (editingStage) {
        await funnelService.updateStage(editingStage.id, data)
        toast({ title: "Estágio atualizado com sucesso!" })
      } else {
        // Get max order from non-fixed stages
        const maxOrder = Math.max(
          ...selectedFunnel.stages!
            .filter(s => !s.isFixed)
            .map(s => s.order),
          -1
        )
        await funnelService.createStage(selectedFunnel.id, { ...data, order: maxOrder + 1 })
        toast({ title: "Estágio criado com sucesso!" })
      }
      await loadFunnelDetails(selectedFunnel.id)
    } catch (error) {
      console.error("Error saving stage:", error)
      toast({
        title: "Erro ao salvar estágio",
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle delete stage
  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Tem certeza que deseja excluir este estágio? Os leads serão movidos para o primeiro estágio.")) return

    try {
      await funnelService.deleteStage(stageId)
      toast({ title: "Estágio excluído com sucesso!" })
      if (selectedFunnel) {
        await loadFunnelDetails(selectedFunnel.id)
      }
    } catch (error) {
      console.error("Error deleting stage:", error)
      toast({
        title: "Erro ao excluir estágio",
        variant: "destructive",
      })
    }
  }

  // Handle send follow-up
  const handleSendFollowUp = async (leadId: string) => {
    try {
      await funnelService.sendFollowUp(leadId)
      toast({ title: "Follow-up enviado para processamento!" })
    } catch (error) {
      console.error("Error sending follow-up:", error)
      toast({
        title: "Erro ao enviar follow-up",
        variant: "destructive",
      })
    }
  }

  // Calculate stats
  const stats = selectedFunnel?.stats || {
    totalLeads: 0,
    totalValue: 0,
    wonLeads: 0,
    lostLeads: 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Funil de Vendas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie seus leads e acompanhe o progresso das vendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadFunnels(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => {
              setEditingFunnel(null)
              setShowFunnelDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Funil
          </Button>
        </div>
      </div>

      {/* Funnel Selector & Actions */}
      {funnels.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Select
              value={selectedFunnel?.id || ""}
              onValueChange={handleFunnelChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      {funnel.name}
                      {!funnel.isActive && (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                      {funnel.configIa && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Bot className="h-3 w-3" />
                          {funnel.configIa.nome}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedFunnel && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingFunnel(selectedFunnel)
                    setShowFunnelDialog(true)
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteFunnel(selectedFunnel.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/funil/${selectedFunnel.id}/follow-up`)}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Agente Follow-up
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingStage(null)
                setShowStageDialog(true)
              }}
              disabled={!selectedFunnel}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Estágio
            </Button>
            <Button
              onClick={() => {
                setEditingLead(null)
                setDefaultStageId(selectedFunnel?.stages?.[0]?.id || "")
                setShowLeadDialog(true)
              }}
              disabled={!selectedFunnel}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {selectedFunnel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.wonLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Perdidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.lostLeads}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban Board */}
      {selectedFunnel && selectedFunnel.stages && (
        <KanbanBoard
          stages={selectedFunnel.stages}
          onMoveLead={handleMoveLead}
          onEditLead={(lead) => {
            setEditingLead(lead)
            setDefaultStageId(lead.stageId)
            setShowLeadDialog(true)
          }}
          onDeleteLead={handleDeleteLead}
          onAddLead={(stageId) => {
            setEditingLead(null)
            setDefaultStageId(stageId)
            setShowLeadDialog(true)
          }}
          onEditStage={(stage) => {
            setEditingStage(stage)
            setShowStageDialog(true)
          }}
          onDeleteStage={handleDeleteStage}
          onSendFollowUp={handleSendFollowUp}
        />
      )}

      {/* Empty State */}
      {funnels.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-xl">
          <Workflow className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum funil criado</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Crie seu primeiro funil de vendas para começar
          </p>
          <Button
            onClick={() => {
              setEditingFunnel(null)
              setShowFunnelDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Funil
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <FunnelDialog
        open={showFunnelDialog}
        onOpenChange={setShowFunnelDialog}
        funnel={editingFunnel}
        userId={userId}
        onSave={handleSaveFunnel}
      />

      <LeadDialog
        open={showLeadDialog}
        onOpenChange={setShowLeadDialog}
        lead={editingLead}
        stages={selectedFunnel?.stages || []}
        defaultStageId={defaultStageId}
        evolutionInstanceId={evolutionInstanceId}
        onSave={handleSaveLead}
      />

      <StageDialog
        open={showStageDialog}
        onOpenChange={setShowStageDialog}
        stage={editingStage}
        onSave={handleSaveStage}
      />
    </div>
  )
}
