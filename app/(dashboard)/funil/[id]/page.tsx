"use client"

import { useEffect, useState, useCallback, Fragment } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Settings,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  Trophy,
  XCircle,
  Bot,
  Workflow,
  Link2,
  Calendar,
  User,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUserId } from "@/lib/use-user-id"
import {
  funnelService,
  type Funnel,
  type FunnelLead,
  type FunnelStage,
  type CreateLeadRequest,
} from "@/lib/funnel-api"
import { KanbanBoard } from "@/components/funnel/kanban-board"
import { LeadDialog } from "@/components/funnel/lead-dialog"
import { FunnelDialog } from "@/components/funnel/funnel-dialog"
import { type FunnelFormData } from "@/components/funnel/funnel-form-step1"
import { useFunnelWebSocket, type FunnelWebSocketPayload } from "@/lib/socket-context"
import { evolutionInstanceService } from "@/lib/evolution-instance-api"

export default function FunnelDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const userId = useUserId()
  const funnelId = params.id

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [showFunnelDialog, setShowFunnelDialog] = useState(false)
  const [showLeadDialog, setShowLeadDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<FunnelLead | null>(null)
  const [defaultStageId, setDefaultStageId] = useState<string>("")
  const [evolutionInstanceId, setEvolutionInstanceId] = useState<string | undefined>(undefined)

  const handleFunnelWebSocketUpdate = useCallback((payload: FunnelWebSocketPayload) => {
    console.log("📊 [FUNNEL] WebSocket update received:", payload)

    setFunnel((prevFunnel) => {
      if (!prevFunnel || prevFunnel.id !== payload.funnelId) return prevFunnel

      const updatedStages = [...(prevFunnel.stages || [])]

      switch (payload.event) {
        case "funnel:lead:created": {
          const newLead = payload.data.lead
          const stageIndex = updatedStages.findIndex((s) => s.id === newLead.stageId)
          if (stageIndex !== -1) {
            updatedStages[stageIndex] = {
              ...updatedStages[stageIndex],
              leads: [...(updatedStages[stageIndex].leads || []), newLead],
            }
          }
          break
        }

        case "funnel:lead:updated":
        case "funnel:lead:stage_changed": {
          const updatedLead = payload.data.lead
          updatedStages.forEach((stage, stageIdx) => {
            const leadIndex = stage.leads?.findIndex((l) => l.id === updatedLead.id) ?? -1
            if (leadIndex !== -1) {
              updatedStages[stageIdx] = {
                ...stage,
                leads: stage.leads?.map((l) => (l.id === updatedLead.id ? updatedLead : l)) || [],
              }
            }
          })
          break
        }

        case "funnel:lead:deleted": {
          const deletedLeadId = payload.data.lead?.id
          if (deletedLeadId) {
            updatedStages.forEach((stage, stageIdx) => {
              updatedStages[stageIdx] = {
                ...stage,
                leads: stage.leads?.filter((l) => l.id !== deletedLeadId) || [],
              }
            })
          }
          break
        }
      }

      return {
        ...prevFunnel,
        stages: updatedStages,
      }
    })
  }, [])

  const { isConnected: wsConnected } = useFunnelWebSocket(
    funnelId || null,
    handleFunnelWebSocketUpdate
  )

  const loadFunnel = async (showRefreshLoader = false) => {
    if (!funnelId) return

    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await funnelService.getFunnelById(funnelId)
      if (response.data) {
        setFunnel(response.data)
      } else {
        toast({
          title: "Funil não encontrado",
          description: "O funil solicitado não existe.",
          variant: "destructive",
        })
        router.push("/funil")
      }
    } catch (error: any) {
      console.error("Error loading funnel:", error)
      toast({
        title: "Erro ao carregar funil",
        description: "Não foi possível carregar os detalhes do funil.",
        variant: "destructive",
      })
      router.push("/funil")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadEvolutionInstance = async () => {
    try {
      const response = await evolutionInstanceService.getInstances()
      const instances = (response as any).instances || response.data || []

      if (response.success && instances.length > 0) {
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
    loadFunnel()
    loadEvolutionInstance()
  }, [funnelId])

  const handleSaveFunnel = async (data: FunnelFormData) => {
    if (!funnel) return

    try {
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
      await funnelService.updateFunnel(funnel.id, updateData)
      toast({ title: "Funil atualizado com sucesso!" })
      await loadFunnel(true)
      setShowFunnelDialog(false)
    } catch (error: any) {
      console.error("Error updating funnel:", error)
      const errorMessage = error?.response?.data?.error || error?.message || "Erro ao atualizar funil"
      toast({
        title: "Erro ao atualizar funil",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteFunnel = async () => {
    if (!funnel) return
    if (!confirm("Tem certeza que deseja excluir este funil? Todos os leads e estágios serão removidos permanentemente."))
      return

    try {
      await funnelService.deleteFunnel(funnel.id)
      toast({ title: "Funil excluído com sucesso!" })
      router.push("/funil")
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

  const handleSaveLead = async (data: CreateLeadRequest & { tags: string[] }) => {
    if (!funnel) return

    try {
      if (editingLead) {
        await funnelService.updateLead(editingLead.id, data)
        toast({ title: "Lead atualizado com sucesso!" })
      } else {
        await funnelService.createLead(funnel.id, data)
        toast({ title: "Lead criado com sucesso!" })
      }
      await loadFunnel(true)
      setShowLeadDialog(false)
      setEditingLead(null)
    } catch (error) {
      console.error("Error saving lead:", error)
      toast({
        title: "Erro ao salvar lead",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleMoveLead = async (leadId: string, stageId: string, order: number) => {
    try {
      await funnelService.moveLead(leadId, { stageId, order })
      await loadFunnel(true)
    } catch (error) {
      console.error("Error moving lead:", error)
      toast({
        title: "Erro ao mover lead",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return

    try {
      await funnelService.deleteLead(leadId)
      toast({ title: "Lead excluído com sucesso!" })
      await loadFunnel(true)
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast({
        title: "Erro ao excluir lead",
        variant: "destructive",
      })
    }
  }

  const handleSendFollowUp = async (leadId: string) => {
    if (!funnel?.followUpAgent?.id) {
      toast({
        title: "Agente de follow-up não configurado",
        description: "Configure um agente de follow-up para enviar mensagens.",
        variant: "destructive",
      })
      return
    }

    router.push(`/funil/${funnel.id}/follow-up`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!funnel) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Funil não encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = funnel.stats || {
    totalLeads: funnel._count?.leads || 0,
    totalValue: 0,
    wonLeads: 0,
    lostLeads: 0,
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/funil")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{funnel.name}</h1>
                <Badge variant={funnel.isActive ? "default" : "secondary"}>
                  {funnel.isActive ? "Ativo" : "Inativo"}
                </Badge>
                {wsConnected && (
                  <Badge variant="outline" className="gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Em tempo real
                  </Badge>
                )}
              </div>
              {funnel.description && (
                <p className="text-muted-foreground mt-1">{funnel.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadFunnel(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFunnelDialog(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/funil/${funnel.id}/follow-up`)}
            >
              <Bot className="h-4 w-4 mr-2" />
              Follow-up
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFunnel}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.wonLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.lostLeads}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Funil de Vendas</CardTitle>
              <CardDescription>
                Arraste e solte os leads entre os estágios para atualizar o funil
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnel.stages && funnel.stages.length > 0 ? (
                <KanbanBoard
                  stages={funnel.stages.map((stage) => ({
                    ...stage,
                    leads: (stage.leads || []).filter((lead) => {
                      if (!searchQuery) return true
                      const query = searchQuery.toLowerCase()
                      return (
                        lead.name?.toLowerCase().includes(query) ||
                        lead.id?.toLowerCase().includes(query) ||
                        lead.email?.toLowerCase().includes(query) ||
                        lead.phone?.toLowerCase().includes(query)
                      )
                    }),
                  }))}
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
                  onEditStage={() => {}}
                  onDeleteStage={() => {}}
                  onSendFollowUp={handleSendFollowUp}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum estágio configurado</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Criado em
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(funnel.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {funnel.configIa && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Agente Vinculado
                    </div>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span>{funnel.configIa.nome}</span>
                    </div>
                  </div>
                )}

                {funnel.rdstationPipelineName && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Pipeline RD Station
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span>{funnel.rdstationPipelineName}</span>
                    </div>
                  </div>
                )}

                {funnel.kommoPipelineName && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Pipeline Kommo
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span>{funnel.kommoPipelineName}</span>
                    </div>
                  </div>
                )}

                {funnel.followUpAgent && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Agente de Follow-up
                    </div>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span>{funnel.followUpAgent.name || "Configurado"}</span>
                      {funnel.followUpAgent.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {funnel.stages && funnel.stages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estágios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {funnel.stages
                      .sort((a, b) => a.order - b.order)
                      .map((stage) => (
                        <div
                          key={stage.id}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span className="text-sm font-medium">{stage.name}</span>
                          </div>
                          <Badge variant="secondary">
                            {stage.leads?.length || 0}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showFunnelDialog && funnel && (
        <FunnelDialog
          open={showFunnelDialog}
          onOpenChange={setShowFunnelDialog}
          onSave={handleSaveFunnel}
          funnel={funnel}
          userId={userId}
        />
      )}

      {showLeadDialog && funnel && (
        <LeadDialog
          open={showLeadDialog}
          onOpenChange={(open) => {
            setShowLeadDialog(open)
            if (!open) setEditingLead(null)
          }}
          onSave={handleSaveLead}
          lead={editingLead}
          defaultStageId={defaultStageId}
          stages={funnel.stages || []}
          evolutionInstanceId={evolutionInstanceId}
        />
      )}
    </>
  )
}

