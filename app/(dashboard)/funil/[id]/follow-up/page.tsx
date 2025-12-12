"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Bot,
  Brain,
  Clock,
  Loader2,
  MessageSquare,
  Power,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  History,
  GitBranch,
  Users,
  Plus,
  Smartphone,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUserId } from "@/lib/use-user-id"
import {
  funnelService,
  type Funnel,
  type FollowUpAgent,
  type FollowUpHistory,
  type FollowUpFlowStep,
  type LeadInFollowUpFlow,
  type FunnelLead,
} from "@/lib/funnel-api"
import { evolutionInstanceService, type EvolutionInstance } from "@/lib/evolution-instance-api"
import {
  FollowUpFlowBoard,
  type FollowUpStep,
  type LeadInFlow,
  DEFAULT_FOLLOW_UP_STEPS
} from "@/components/funnel/follow-up-flow-board"

const followUpAgentSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  isActive: z.boolean(),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(50).max(4000),
  systemPrompt: z.string().min(1, "Instruções de sistema obrigatórias"),
  followUpPrompt: z.string().optional().default(""),
  autoFollowUp: z.boolean(),
  followUpDelayHours: z.number().min(1).max(168),
  maxFollowUps: z.number().min(1).max(10),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  workingDays: z.array(z.number()),
  timezone: z.string(),
  evolutionInstanceId: z.string().min(1, "Selecione uma instância Evolution"),
  openaiApiKey: z.string().optional().default(""),
})

type FollowUpAgentFormData = z.infer<typeof followUpAgentSchema>

const AVAILABLE_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Mais capaz)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Rápido e econômico)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Mais econômico)" },
]

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
]

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  read: "bg-purple-100 text-purple-700",
  responded: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviado",
  delivered: "Entregue",
  read: "Lido",
  responded: "Respondido",
  failed: "Falhou",
}

// Helper to convert API types to component types
function apiStepToComponentStep(step: FollowUpFlowStep): FollowUpStep {
  return {
    id: step.id,
    name: step.name,
    order: step.order,
    delayDays: step.delayDays,
    delayHours: step.delayHours,
    messageTemplate: step.messageTemplate,
    isAutomatic: step.isAutomatic,
    color: step.color,
    type: step.type,
  }
}

function apiLeadToComponentLead(leadInFlow: LeadInFollowUpFlow): LeadInFlow {
  return {
    id: leadInFlow.id,
    lead: leadInFlow.lead,
    currentStepId: leadInFlow.currentStepId,
    nextFollowUpAt: leadInFlow.nextFollowUpAt ? new Date(leadInFlow.nextFollowUpAt) : undefined,
    followUpCount: leadInFlow.followUpCount,
    status: leadInFlow.status,
    enteredAt: new Date(leadInFlow.enteredAt),
    lastFollowUpAt: leadInFlow.lastFollowUpAt ? new Date(leadInFlow.lastFollowUpAt) : undefined,
  }
}

export default function FollowUpAgentPage({ params }: { params: { id: string } }) {
  const funnelId = params.id
  const router = useRouter()
  const { toast } = useToast()
  const userId = useUserId()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [agent, setAgent] = useState<FollowUpAgent | null>(null)
  const [history, setHistory] = useState<FollowUpHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Follow-up Flow State
  const [flowSteps, setFlowSteps] = useState<FollowUpStep[]>([])
  const [leadsInFlow, setLeadsInFlow] = useState<LeadInFlow[]>([])
  const [flowLoading, setFlowLoading] = useState(false)
  const [availableLeads, setAvailableLeads] = useState<FunnelLead[]>([])

  // Evolution instances state
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FollowUpAgentFormData>({
    resolver: zodResolver(followUpAgentSchema),
    defaultValues: {
      name: "Agente de Follow-up",
      isActive: false,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: "",
      followUpPrompt: "",
      autoFollowUp: false,
      followUpDelayHours: 24,
      maxFollowUps: 3,
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      workingDays: [1, 2, 3, 4, 5],
      timezone: "America/Sao_Paulo",
      evolutionInstanceId: "",
      openaiApiKey: "",
    },
  })

  const watchedValues = watch()

  // Load data
  useEffect(() => {
    if (funnelId) {
      loadData()
    }
  }, [funnelId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load funnel details
      const funnelResponse = await funnelService.getFunnelById(funnelId)
      if (funnelResponse.data) {
        setFunnel(funnelResponse.data)
        // Get available leads from funnel stages
        const leads = funnelResponse.data.stages?.flatMap(s => s.leads || []) || []
        setAvailableLeads(leads)
      }

      // Load Evolution instances for the agent (from configIa)
      if (funnelResponse.data?.configIaId) {
        try {
          const instancesResponse = await evolutionInstanceService.getInstancesByConfigIaId(funnelResponse.data.configIaId)
          if (instancesResponse.success && instancesResponse.data) {
            setEvolutionInstances(instancesResponse.data)
          }
        } catch (error) {
          console.error("Error loading Evolution instances:", error)
        }
      }

      // Load follow-up agent
      const agentResponse = await funnelService.getFollowUpAgent(funnelId)
      if (agentResponse.data) {
        setAgent(agentResponse.data)
        reset({
          name: agentResponse.data.name,
          isActive: agentResponse.data.isActive,
          model: agentResponse.data.model,
          temperature: agentResponse.data.temperature,
          maxTokens: agentResponse.data.maxTokens,
          systemPrompt: agentResponse.data.systemPrompt,
          followUpPrompt: agentResponse.data.followUpPrompt || "",
          autoFollowUp: agentResponse.data.autoFollowUp,
          followUpDelayHours: agentResponse.data.followUpDelayHours,
          maxFollowUps: agentResponse.data.maxFollowUps,
          workingHoursStart: agentResponse.data.workingHoursStart || "09:00",
          workingHoursEnd: agentResponse.data.workingHoursEnd || "18:00",
          workingDays: agentResponse.data.workingDays,
          timezone: agentResponse.data.timezone,
          evolutionInstanceId: agentResponse.data.evolutionInstanceId || "",
          openaiApiKey: agentResponse.data.openaiApiKey || "",
        })
      }

      // Load history
      await loadHistory()

      // Load follow-up flow
      await loadFlowData()
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await funnelService.getFollowUpHistory(funnelId, { limit: 50 })
      if (response.data) {
        setHistory(response.data.history || [])
      }
    } catch (error) {
      console.error("Error loading history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadFlowData = useCallback(async () => {
    try {
      setFlowLoading(true)

      // Load flow steps
      const stepsResponse = await funnelService.getFollowUpFlowSteps(funnelId)
      if (stepsResponse.data && stepsResponse.data.length > 0) {
        setFlowSteps(stepsResponse.data.map(apiStepToComponentStep))
      } else {
        // Use default steps if none exist (will be created when first step is added)
        setFlowSteps(DEFAULT_FOLLOW_UP_STEPS.map((s, i) => ({
          ...s,
          id: `temp-${i}`,
        })))
      }

      // Load leads in flow
      const leadsResponse = await funnelService.getLeadsInFlow(funnelId)
      if (leadsResponse.data) {
        setLeadsInFlow(leadsResponse.data.map(apiLeadToComponentLead))
      }
    } catch (error) {
      console.error("Error loading flow data:", error)
      // Set defaults on error
      setFlowSteps(DEFAULT_FOLLOW_UP_STEPS.map((s, i) => ({
        ...s,
        id: `temp-${i}`,
      })))
    } finally {
      setFlowLoading(false)
    }
  }, [funnelId])

  const onSubmit = async (data: FollowUpAgentFormData) => {
    try {
      setSaving(true)
      console.log("✅ Form validation passed!")
      console.log("📤 Submitting follow-up agent data:", JSON.stringify(data, null, 2))

      // Clean up data before sending
      const cleanData = {
        ...data,
        systemPrompt: data.systemPrompt || "",
        followUpPrompt: data.followUpPrompt || "",
        openaiApiKey: data.openaiApiKey || "",
        evolutionInstanceId: data.evolutionInstanceId || null,
      }

      console.log("📤 Clean data to send:", JSON.stringify(cleanData, null, 2))

      const response = await funnelService.saveFollowUpAgent(funnelId, cleanData)
      console.log("📥 Save response:", response)

      if (response.success) {
        toast({ title: "Agente salvo com sucesso!" })
        await loadData()
      } else {
        throw new Error(response.error || "Erro ao salvar")
      }
    } catch (error) {
      console.error("❌ Error saving agent:", error)
      toast({
        title: "Erro ao salvar agente",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const onSubmitError = (errors: any) => {
    console.error("❌ Form validation errors:", errors)
    console.error("❌ Error keys:", Object.keys(errors))
    console.error("❌ Full error details:", JSON.stringify(errors, null, 2))

    const errorMessages = Object.entries(errors).map(([key, value]: [string, any]) => {
      return `${key}: ${value?.message || 'erro desconhecido'}`
    }).join(', ')

    toast({
      title: "Erro de validação",
      description: errorMessages || "Verifique os campos do formulário",
      variant: "destructive",
    })
  }

  const toggleAgent = async () => {
    try {
      await funnelService.toggleFollowUpAgent(funnelId)
      toast({ title: agent?.isActive ? "Agente desativado" : "Agente ativado" })
      await loadData()
    } catch (error) {
      console.error("Error toggling agent:", error)
      toast({
        title: "Erro ao alternar agente",
        variant: "destructive",
      })
    }
  }

  const toggleWorkingDay = (day: number) => {
    const currentDays = watchedValues.workingDays || []
    if (currentDays.includes(day)) {
      setValue("workingDays", currentDays.filter((d) => d !== day))
    } else {
      setValue("workingDays", [...currentDays, day].sort())
    }
  }

  // Flow handlers
  const handleMoveLeadToStep = async (leadFlowId: string, stepId: string) => {
    try {
      await funnelService.moveLeadInFlow(leadFlowId, { stepId })
      await loadFlowData()
      toast({ title: "Lead movido!" })
    } catch (error) {
      console.error("Error moving lead:", error)
      toast({ title: "Erro ao mover lead", variant: "destructive" })
    }
  }

  const handleSendFollowUp = async (leadFlowId: string) => {
    try {
      await funnelService.sendFollowUpInFlow(leadFlowId)
      toast({ title: "Follow-up enviado!" })
      await loadFlowData()
      await loadHistory()
    } catch (error) {
      console.error("Error sending follow-up:", error)
      toast({ title: "Erro ao enviar follow-up", variant: "destructive" })
    }
  }

  const handlePauseResume = async (leadFlowId: string) => {
    try {
      await funnelService.pauseResumeLeadInFlow(leadFlowId)
      await loadFlowData()
    } catch (error) {
      console.error("Error toggling pause:", error)
      toast({ title: "Erro ao pausar/retomar", variant: "destructive" })
    }
  }

  const handleRemoveFromFlow = async (leadFlowId: string) => {
    try {
      await funnelService.removeLeadFromFlow(leadFlowId)
      await loadFlowData()
      toast({ title: "Lead removido do fluxo" })
    } catch (error) {
      console.error("Error removing lead:", error)
      toast({ title: "Erro ao remover lead", variant: "destructive" })
    }
  }

  const handleMarkAsWon = async (leadFlowId: string) => {
    try {
      await funnelService.markLeadAsWonInFlow(leadFlowId)
      await loadFlowData()
      toast({ title: "Lead marcado como ganho!" })
    } catch (error) {
      console.error("Error marking as won:", error)
      toast({ title: "Erro ao marcar como ganho", variant: "destructive" })
    }
  }

  const handleMarkAsLost = async (leadFlowId: string) => {
    try {
      await funnelService.markLeadAsLostInFlow(leadFlowId)
      await loadFlowData()
      toast({ title: "Lead marcado como perdido" })
    } catch (error) {
      console.error("Error marking as lost:", error)
      toast({ title: "Erro ao marcar como perdido", variant: "destructive" })
    }
  }

  const handleAddStep = async (step: Omit<FollowUpStep, "id">) => {
    try {
      // First initialize default steps if this is the first step
      if (flowSteps.every(s => s.id.startsWith('temp-'))) {
        await funnelService.initializeDefaultFlowSteps(funnelId)
      }

      await funnelService.createFollowUpFlowStep(funnelId, {
        name: step.name,
        order: step.order,
        delayDays: step.delayDays,
        delayHours: step.delayHours,
        messageTemplate: step.messageTemplate,
        isAutomatic: step.isAutomatic,
        color: step.color,
        type: step.type,
      })
      await loadFlowData()
      toast({ title: "Etapa criada!" })
    } catch (error) {
      console.error("Error adding step:", error)
      toast({ title: "Erro ao criar etapa", variant: "destructive" })
    }
  }

  const handleEditStep = async (stepId: string, step: Partial<FollowUpStep>) => {
    try {
      await funnelService.updateFollowUpFlowStep(stepId, {
        name: step.name,
        order: step.order,
        delayDays: step.delayDays,
        delayHours: step.delayHours,
        messageTemplate: step.messageTemplate,
        isAutomatic: step.isAutomatic,
        color: step.color,
      })
      await loadFlowData()
      toast({ title: "Etapa atualizada!" })
    } catch (error) {
      console.error("Error editing step:", error)
      toast({ title: "Erro ao atualizar etapa", variant: "destructive" })
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    try {
      await funnelService.deleteFollowUpFlowStep(stepId)
      await loadFlowData()
      toast({ title: "Etapa excluída!" })
    } catch (error) {
      console.error("Error deleting step:", error)
      toast({ title: "Erro ao excluir etapa", variant: "destructive" })
    }
  }

  const [addingLeadId, setAddingLeadId] = useState<string | null>(null)
  const [leadSearchTerm, setLeadSearchTerm] = useState("")
  const [showAllLeads, setShowAllLeads] = useState(false)

  const handleAddLeadToFlow = async (leadId: string) => {
    setAddingLeadId(leadId)
    try {
      // Initialize flow if not yet created
      if (flowSteps.every(s => s.id.startsWith('temp-'))) {
        console.log("Initializing flow steps...")
        const initResponse = await funnelService.initializeDefaultFlowSteps(funnelId)
        console.log("Init response:", initResponse)

        if (!initResponse.success) {
          throw new Error(initResponse.error || "Erro ao inicializar fluxo")
        }

        // After initialization, retry adding the lead
        const freshSteps = await funnelService.getFollowUpFlowSteps(funnelId)
        console.log("Fresh steps:", freshSteps)

        if (freshSteps.data && freshSteps.data.length > 0) {
          const firstStep = freshSteps.data.find(s => s.type === 'followup' && s.order === 0)
          console.log("First step:", firstStep)

          const addResponse = await funnelService.addLeadToFlow(funnelId, {
            leadId,
            stepId: firstStep?.id,
          })
          console.log("Add response:", addResponse)

          if (!addResponse.success) {
            throw new Error(addResponse.error || "Erro ao adicionar lead")
          }
        }
      } else {
        const firstStep = flowSteps.find(s => s.type === 'followup' && s.order === 0)
        console.log("Using existing first step:", firstStep)

        const addResponse = await funnelService.addLeadToFlow(funnelId, {
          leadId,
          stepId: firstStep?.id,
        })
        console.log("Add response:", addResponse)

        if (!addResponse.success) {
          throw new Error(addResponse.error || "Erro ao adicionar lead")
        }
      }
      await loadFlowData()
      toast({ title: "Lead adicionado ao fluxo!" })
    } catch (error: any) {
      console.error("Error adding lead to flow:", error)
      toast({
        title: "Erro ao adicionar lead",
        description: error?.message || "Verifique o console para mais detalhes",
        variant: "destructive"
      })
    } finally {
      setAddingLeadId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get leads not in flow
  const leadsNotInFlow = availableLeads.filter(
    lead => !leadsInFlow.some(lf => lf.lead.id === lead.id)
  )

  // Filter leads by search term
  const filteredLeadsNotInFlow = leadsNotInFlow.filter(lead =>
    lead.name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
    (lead.phone && lead.phone.includes(leadSearchTerm)) ||
    (lead.email && lead.email.toLowerCase().includes(leadSearchTerm.toLowerCase()))
  )

  // Determine how many leads to show (10 initial, all when expanded)
  const INITIAL_LEADS_COUNT = 10
  const leadsToDisplay = showAllLeads
    ? filteredLeadsNotInFlow
    : filteredLeadsNotInFlow.slice(0, INITIAL_LEADS_COUNT)
  const hasMoreLeads = filteredLeadsNotInFlow.length > INITIAL_LEADS_COUNT

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/funil")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Agente de Follow-up
          </h1>
          <p className="text-muted-foreground text-sm">
            {funnel?.name} - Configure o agente de IA para follow-ups automáticos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {agent && (
            <Button
              variant={agent.isActive ? "destructive" : "default"}
              onClick={toggleAgent}
            >
              <Power className="h-4 w-4 mr-2" />
              {agent.isActive ? "Desativar" : "Ativar"}
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      {agent && (
        <div className="flex items-center gap-2">
          <Badge variant={agent.isActive ? "default" : "secondary"} className="text-sm">
            {agent.isActive ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Agente Ativo
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                Agente Inativo
              </>
            )}
          </Badge>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="flow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Fluxo de Follow-up
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Flow Tab */}
        <TabsContent value="flow" className="space-y-6 mt-6">
          {/* Add Lead to Flow */}
          {leadsNotInFlow.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Adicionar Lead ao Fluxo
                  <Badge variant="secondary" className="ml-2">
                    {leadsNotInFlow.length} disponíveis
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar lead por nome, telefone ou email..."
                    value={leadSearchTerm}
                    onChange={(e) => {
                      setLeadSearchTerm(e.target.value)
                      setShowAllLeads(false) // Reset expansion when searching
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Leads List */}
                {filteredLeadsNotInFlow.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {leadSearchTerm
                      ? `Nenhum lead encontrado para "${leadSearchTerm}"`
                      : "Nenhum lead disponível"
                    }
                  </div>
                ) : (
                  <>
                    <div className={`flex gap-2 flex-wrap ${showAllLeads ? "max-h-64 overflow-y-auto pr-2" : ""}`}>
                      {leadsToDisplay.map(lead => (
                        <Button
                          key={lead.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddLeadToFlow(lead.id)}
                          disabled={addingLeadId === lead.id}
                          className="gap-1"
                        >
                          {addingLeadId === lead.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {lead.name}
                        </Button>
                      ))}
                    </div>

                    {/* Show More/Less Button */}
                    {hasMoreLeads && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllLeads(!showAllLeads)}
                        className="w-full mt-2"
                      >
                        {showAllLeads ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Ver mais {filteredLeadsNotInFlow.length - INITIAL_LEADS_COUNT} leads
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Flow Board */}
          {flowLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <FollowUpFlowBoard
              steps={flowSteps}
              leadsInFlow={leadsInFlow}
              onMoveLeadToStep={handleMoveLeadToStep}
              onSendFollowUp={handleSendFollowUp}
              onPauseResume={handlePauseResume}
              onRemoveFromFlow={handleRemoveFromFlow}
              onMarkAsWon={handleMarkAsWon}
              onMarkAsLost={handleMarkAsLost}
              onAddStep={handleAddStep}
              onEditStep={handleEditStep}
              onDeleteStep={handleDeleteStep}
            />
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <form onSubmit={(e) => {
              console.log("📋 Form onSubmit event triggered")
              console.log("📋 Form data:", watchedValues)
              handleSubmit(onSubmit, onSubmitError)(e)
            }} className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configurações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Agente <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Agente de Follow-up"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="model">Modelo de IA</Label>
                    <Select
                      value={watchedValues.model}
                      onValueChange={(value) => setValue("model", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="openaiApiKey">Chave da API OpenAI</Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    {...register("openaiApiKey")}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sua chave da API ficará segura e criptografada
                  </p>
                </div>

                <div>
                  <Label htmlFor="evolutionInstanceId" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Instância Evolution (WhatsApp) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchedValues.evolutionInstanceId || ""}
                    onValueChange={(value) => setValue("evolutionInstanceId", value)}
                  >
                    <SelectTrigger className={errors.evolutionInstanceId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione uma instância..." />
                    </SelectTrigger>
                    <SelectContent>
                      {evolutionInstances.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhuma instância disponível
                        </SelectItem>
                      ) : (
                        evolutionInstances.map((instance) => (
                          <SelectItem key={instance.id} value={instance.id}>
                            {instance.instanceName} {instance.status === "open" ? "✅" : "⚪"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.evolutionInstanceId && (
                    <p className="text-xs text-destructive mt-1">{errors.evolutionInstanceId.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione qual instância do WhatsApp será usada para enviar os follow-ups
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Configurações de IA
                </CardTitle>
                <CardDescription>
                  Ajuste o comportamento do modelo de linguagem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Temperatura: {watchedValues.temperature.toFixed(1)}</Label>
                      <span className="text-xs text-muted-foreground">
                        {watchedValues.temperature < 0.3
                          ? "Mais preciso"
                          : watchedValues.temperature > 0.7
                          ? "Mais criativo"
                          : "Equilibrado"}
                      </span>
                    </div>
                    <Slider
                      value={[watchedValues.temperature]}
                      onValueChange={([value]: number[]) => setValue("temperature", value)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Max Tokens: {watchedValues.maxTokens}</Label>
                    </div>
                    <Slider
                      value={[watchedValues.maxTokens]}
                      onValueChange={([value]: number[]) => setValue("maxTokens", value)}
                      min={50}
                      max={4000}
                      step={50}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Instruções do Agente
                </CardTitle>
                <CardDescription>
                  Defina como o agente deve se comportar e responder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="systemPrompt">
                    Instruções de Sistema <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="systemPrompt"
                    {...register("systemPrompt")}
                    placeholder="Você é um assistente de vendas profissional. Seu objetivo é fazer follow-up com leads de forma amigável e não invasiva..."
                    rows={6}
                    className={`font-mono text-sm ${errors.systemPrompt ? "border-destructive" : ""}`}
                  />
                  {errors.systemPrompt && (
                    <p className="text-xs text-destructive mt-1">{errors.systemPrompt.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Define a personalidade e comportamento base do agente para gerar mensagens de follow-up.
                  </p>
                </div>

                <div>
                  <Label htmlFor="followUpPrompt">Prompt de Follow-up (Opcional)</Label>
                  <Textarea
                    id="followUpPrompt"
                    {...register("followUpPrompt")}
                    placeholder="Use as variáveis: {{lead_name}}, {{last_contact_date}}, {{stage_name}}..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Template específico para mensagens de follow-up. Variáveis disponíveis: {`{{lead_name}}, {{lead_email}}, {{stage_name}}, {{last_contact_date}}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Automação Geral
                </CardTitle>
                <CardDescription>
                  Configure o comportamento automático do agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="cursor-pointer">Follow-up Automático</Label>
                    <p className="text-xs text-muted-foreground">
                      Enviar follow-ups automaticamente para leads sem resposta
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.autoFollowUp}
                    onCheckedChange={(checked: boolean) => setValue("autoFollowUp", checked)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Horário de Funcionamento</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Início</Label>
                      <Input
                        type="time"
                        {...register("workingHoursStart")}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Fim</Label>
                      <Input
                        type="time"
                        {...register("workingHoursEnd")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Dias de Funcionamento</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={watchedValues.workingDays?.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWorkingDay(day.value)}
                        className="w-12"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.push("/funil")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                onClick={() => console.log("🖱️ Save button clicked!")}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Histórico de Follow-ups
                </CardTitle>
                <CardDescription>
                  Visualize todas as mensagens enviadas pelo agente
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={historyLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum follow-up enviado ainda</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.lead?.name || "N/A"}</div>
                              <div className="text-xs text-muted-foreground">{item.lead?.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.message}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[item.status] || ""}>
                              {STATUS_LABELS[item.status] || item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{item.channel}</TableCell>
                          <TableCell>
                            {new Date(item.sentAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
