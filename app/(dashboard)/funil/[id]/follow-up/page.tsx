"use client"

import { useEffect, useState } from "react"
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
  Play,
  Power,
  RefreshCw,
  Save,
  Send,
  Settings,
  Sparkles,
  Calendar,
  History
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUserId } from "@/lib/use-user-id"
import {
  funnelService,
  type Funnel,
  type FollowUpAgent,
  type FollowUpHistory,
  type CreateFollowUpAgentRequest,
} from "@/lib/funnel-api"

const followUpAgentSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  isActive: z.boolean(),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(50).max(4000),
  systemPrompt: z.string().min(1, "Instruções de sistema obrigatórias"),
  followUpPrompt: z.string().optional(),
  autoFollowUp: z.boolean(),
  followUpDelayHours: z.number().min(1).max(168),
  maxFollowUps: z.number().min(1).max(10),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  workingDays: z.array(z.number()),
  timezone: z.string(),
  openaiApiKey: z.string().optional(),
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
          openaiApiKey: agentResponse.data.openaiApiKey || "",
        })
      }

      // Load history
      await loadHistory()
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

  const onSubmit = async (data: FollowUpAgentFormData) => {
    try {
      setSaving(true)
      await funnelService.saveFollowUpAgent(funnelId, data)
      toast({ title: "Agente salvo com sucesso!" })
      await loadData()
    } catch (error) {
      console.error("Error saving agent:", error)
      toast({
        title: "Erro ao salvar agente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
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
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    <Label htmlFor="name">Nome do Agente</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Agente de Follow-up"
                    />
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
                      onValueChange={([value]) => setValue("temperature", value)}
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
                      onValueChange={([value]) => setValue("maxTokens", value)}
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
                  <Label htmlFor="systemPrompt">Instruções de Sistema *</Label>
                  <Textarea
                    id="systemPrompt"
                    {...register("systemPrompt")}
                    placeholder="Você é um assistente de vendas profissional. Seu objetivo é fazer follow-up com leads de forma amigável e não invasiva..."
                    rows={6}
                    className="font-mono text-sm"
                  />
                  {errors.systemPrompt && (
                    <p className="text-sm text-destructive mt-1">{errors.systemPrompt.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Define a personalidade e comportamento base do agente
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
                  Automação
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
                    onCheckedChange={(checked) => setValue("autoFollowUp", checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Intervalo entre Follow-ups</Label>
                    <Select
                      value={watchedValues.followUpDelayHours.toString()}
                      onValueChange={(value) => setValue("followUpDelayHours", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 horas</SelectItem>
                        <SelectItem value="12">12 horas</SelectItem>
                        <SelectItem value="24">24 horas (1 dia)</SelectItem>
                        <SelectItem value="48">48 horas (2 dias)</SelectItem>
                        <SelectItem value="72">72 horas (3 dias)</SelectItem>
                        <SelectItem value="168">168 horas (1 semana)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Máximo de Follow-ups por Lead</Label>
                    <Select
                      value={watchedValues.maxFollowUps.toString()}
                      onValueChange={(value) => setValue("maxFollowUps", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? "follow-up" : "follow-ups"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
              <Button type="submit" disabled={saving}>
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
