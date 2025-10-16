"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Agent } from "@/lib/agents-real"
import { createAgent, updateAgent } from "@/lib/agents-real"
import { useUserId } from "@/lib/use-user-id"

interface AgentFormProps {
  agent?: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export function AgentForm({ agent, open, onOpenChange, onSuccess }: AgentFormProps) {
  const userId = useUserId()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    }
  }, [agent])

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
                onChange={(e) => setFormData({ ...formData, kommoSubdomain: e.target.value })}
                placeholder="Ex: minhaempresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kommoAccessToken">Access Token</Label>
              <Input
                id="kommoAccessToken"
                type="password"
                value={formData.kommoAccessToken}
                onChange={(e) => setFormData({ ...formData, kommoAccessToken: e.target.value })}
                placeholder="Access token da API Kommo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kommodPipelineId">Pipeline ID</Label>
              <Input
                id="kommodPipelineId"
                value={formData.kommodPipelineId}
                onChange={(e) => setFormData({ ...formData, kommodPipelineId: e.target.value })}
                placeholder="ID do pipeline onde o agente vai atuar"
              />
            </div>
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
