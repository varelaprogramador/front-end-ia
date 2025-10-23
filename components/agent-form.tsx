"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios, { AxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import type { Agent } from "@/lib/agents-real"
import { createAgent, updateAgent } from "@/lib/agents-real"
import { useUserId } from "@/lib/use-user-id"

interface KommoPipeline {
  id: number
  name: string
  sort: number
  is_main: boolean
  is_unsorted_on: boolean
  is_archive: boolean
  account_id: number
  _embedded?: {
    statuses: Array<{
      id: number
      name: string
      sort: number
      is_editable: boolean
      pipeline_id: number
      color: string
      type: number
      account_id: number
    }>
  }
}

interface AgentFormProps {
  agent?: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export function AgentForm({ agent, open, onOpenChange, onSuccess }: AgentFormProps) {
  const userId = useUserId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [pipelines, setPipelines] = useState<KommoPipeline[]>([])
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    webhookDev: agent?.webhookDev || "",
    webhookProd: agent?.webhookProd || "",
    prompt: agent?.prompt || "",
    status: agent?.status || ("active" as const),
    description: agent?.description || "",
    kommoSubdomain: agent?.kommoSubdomain || "",
    kommoAccessToken: agent?.kommoAccessToken || "",
    kommodPipelineId: agent?.kommodPipelineId || "",
  })

  // Atualizar o formulário quando o agente mudar
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || "",
        webhookDev: agent.webhookDev || "",
        webhookProd: agent.webhookProd || "",
        prompt: agent.prompt || "",
        status: agent.status || "active",
        description: agent.description || "",
        kommoSubdomain: agent.kommoSubdomain || "",
        kommoAccessToken: agent.kommoAccessToken || "",
        kommodPipelineId: agent.kommodPipelineId || "",
      })
      // Se já tem dados do Kommo, buscar pipelines automaticamente
      if (agent.kommoSubdomain && agent.kommoAccessToken) {
        // Buscar pipelines automaticamente
        const fetchPipelines = async () => {
          setIsVerifying(true)
          try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/kommo/verify`, {
              subdomain: agent.kommoSubdomain,
              accessToken: agent.kommoAccessToken,
            })

            const data = response.data.data

            if (data._embedded && data._embedded.pipelines) {
              const pipelinesList = data._embedded.pipelines as KommoPipeline[]
              setPipelines(pipelinesList)
              setIsVerified(true)
            } else {
              setIsVerified(true)
              setPipelines([])
            }
          } catch (error) {
            console.error("Error fetching pipelines:", error)
            setIsVerified(false)
            setPipelines([])
          } finally {
            setIsVerifying(false)
          }
        }

        fetchPipelines()
      }
    } else {
      // Limpar formulário para novo agente
      setFormData({
        name: "",
        webhookDev: "",
        webhookProd: "",
        prompt: "",
        status: "active",
        description: "",
        kommoSubdomain: "",
        kommoAccessToken: "",
        kommodPipelineId: "",
      })
      setIsVerified(false)
      setPipelines([])
    }
  }, [agent])

  const handleVerifyKommo = async () => {
    if (!formData.kommoSubdomain || !formData.kommoAccessToken) {
      toast.error("Preencha o subdomínio e o access token")
      return
    }

    setIsVerifying(true)
    const loadingToast = toast.loading("Verificando credenciais Kommo...")

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/kommo/verify`, {
        subdomain: formData.kommoSubdomain,
        accessToken: formData.kommoAccessToken,
      })

      const data = response.data.data

      if (data._embedded && data._embedded.pipelines) {
        const pipelinesList = data._embedded.pipelines as KommoPipeline[]
        setPipelines(pipelinesList)
        setIsVerified(true)

        toast.success("Credenciais verificadas com sucesso!", {
          id: loadingToast,
          description: `${pipelinesList.length} pipeline(s) encontrado(s)`,
        })
      } else {
        toast.warning("Nenhum pipeline encontrado", {
          id: loadingToast,
          description: "A conta não possui pipelines configurados",
        })
        setIsVerified(true)
        setPipelines([])
      }
    } catch (error) {
      console.error("Error verifying Kommo:", error)

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ success: boolean; message: string }>

        if (axiosError.response) {
          // Erro com resposta do servidor
          const message = axiosError.response.data?.message || "Erro ao verificar credenciais"

          toast.error("Erro ao verificar credenciais", {
            id: loadingToast,
            description: message,
          })
        } else if (axiosError.request) {
          // Requisição foi feita mas não houve resposta
          toast.error("Erro de conexão", {
            id: loadingToast,
            description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
          })
        } else {
          // Erro ao configurar a requisição
          toast.error("Erro interno", {
            id: loadingToast,
            description: "Erro ao configurar a requisição. Tente novamente.",
          })
        }
      } else {
        // Erro não relacionado ao axios
        toast.error("Erro desconhecido", {
          id: loadingToast,
          description: "Ocorreu um erro inesperado. Tente novamente.",
        })
      }

      setIsVerified(false)
      setPipelines([])
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error("Erro de autenticação", {
        description: "Usuário não autenticado. Faça login para continuar.",
      })
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading(agent ? "Atualizando agente..." : "Criando agente...")

    try {
      let result: Agent | null = null

      if (agent) {
        // Atualizando agente existente
        result = await updateAgent(agent.id, formData)
      } else {
        // Criando novo agente
        result = await createAgent(formData, userId)
      }

      if (result) {
        // Reset form if creating new agent
        if (!agent) {
          setFormData({
            name: "",
            webhookDev: "",
            webhookProd: "",
            prompt: "",
            status: "active",
            description: "",
            kommoSubdomain: "",
            kommoAccessToken: "",
            kommodPipelineId: "",
          })
        }

        // Fechar modal
        onOpenChange(false)

        // Aguardar atualização da lista antes de mostrar sucesso
        try {
          await onSuccess()

          // Mostrar toast de sucesso depois de atualizar a lista
          toast.success(agent ? "Agente atualizado!" : "Agente criado!", {
            id: loadingToast,
            description: agent ? "O agente foi atualizado com sucesso." : "O agente foi criado com sucesso.",
          })
        } catch (updateError) {
          console.error("Error updating list:", updateError)
          toast.success(agent ? "Agente atualizado!" : "Agente criado!", {
            id: loadingToast,
            description: "Agente salvo, mas houve um erro ao atualizar a lista. Recarregue a página.",
          })
        }
      } else {
        toast.error("Erro ao salvar", {
          id: loadingToast,
          description: agent ? "Falha ao atualizar agente." : "Falha ao criar agente.",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Erro interno", {
        id: loadingToast,
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] max-w-[95vw] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle>{agent ? "Editar Agente" : "Criar Novo Agente"}</DialogTitle>
          <DialogDescription>
            {agent ? "Atualize as informações do agente." : "Preencha os dados para criar um novo agente de IA."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 flex-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Agente</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Agente de Vendas"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="webhookDev">URL Webhook Dev</Label>
                <Input
                  id="webhookDev"
                  value={formData.webhookDev}
                  onChange={(e) => setFormData({ ...formData, webhookDev: e.target.value })}
                  placeholder="https://dev.webhook.com/agent"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookProd">URL Webhook Prod</Label>
                <Input
                  id="webhookProd"
                  value={formData.webhookProd}
                  onChange={(e) => setFormData({ ...formData, webhookProd: e.target.value })}
                  placeholder="https://prod.webhook.com/agent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "development") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="development">Em Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt de Inicialização</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="min-h-[100px] max-h-[200px] resize-y"
                placeholder="Descreva como o agente deve se comportar e quais são suas responsabilidades..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Integração Kommo (Opcional)</h3>
                <p className="text-xs text-muted-foreground">
                  Configure a integração com Kommo CRM para permitir que o agente opere no pipeline especificado.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kommoSubdomain">Subdomínio Kommo</Label>
                <Input
                  id="kommoSubdomain"
                  value={formData.kommoSubdomain}
                  onChange={(e) => {
                    setFormData({ ...formData, kommoSubdomain: e.target.value })
                    setIsVerified(false)
                    setPipelines([])
                  }}
                  placeholder="Ex: minhaempresa"
                  disabled={isVerifying}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kommoAccessToken">Access Token</Label>
                <Input
                  id="kommoAccessToken"
                  type="password"
                  value={formData.kommoAccessToken}
                  onChange={(e) => {
                    setFormData({ ...formData, kommoAccessToken: e.target.value })
                    setIsVerified(false)
                    setPipelines([])
                  }}
                  placeholder="Access token da API Kommo"
                  disabled={isVerifying}
                />
              </div>

              <Button
                type="button"
                variant={isVerified ? "outline" : "default"}
                onClick={handleVerifyKommo}
                disabled={isVerifying || !formData.kommoSubdomain || !formData.kommoAccessToken}
                className="w-full gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : isVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Credenciais Verificadas
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Verificar Credenciais
                  </>
                )}
              </Button>

              {isVerified && pipelines.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="kommodPipelineId">Selecione o Pipeline</Label>
                  <Select
                    value={formData.kommodPipelineId}
                    onValueChange={(value) => setFormData({ ...formData, kommodPipelineId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {pipeline.name}
                              {pipeline.is_main && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  (Principal)
                                </span>
                              )}
                            </span>
                            {pipeline._embedded?.statuses && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {pipeline._embedded.statuses.length} etapas
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.kommodPipelineId && (
                    <p className="text-xs text-muted-foreground">
                      Pipeline ID: {formData.kommodPipelineId}
                    </p>
                  )}
                </div>
              )}

              {isVerified && pipelines.length === 0 && (
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Nenhum pipeline encontrado nesta conta Kommo.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : agent ? "Atualizar" : "Criar"} Agente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
