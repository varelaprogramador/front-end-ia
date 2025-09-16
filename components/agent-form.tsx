"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { Agent } from "@/lib/agents-real"
import { createAgent, updateAgent } from "@/lib/agents-real"
import { useUserId } from "@/lib/use-user-id"

interface AgentFormProps {
  agent?: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AgentForm({ agent, open, onOpenChange, onSuccess }: AgentFormProps) {
  const { toast } = useToast()
  const userId = useUserId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    webhookDev: agent?.webhookDev || "",
    webhookProd: agent?.webhookProd || "",
    prompt: agent?.prompt || "",
    status: agent?.status || ("active" as const),
    description: agent?.description || "",
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
      })
    }
  }, [agent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login para continuar.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

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
        toast({
          title: "Sucesso",
          description: agent ? "Agente atualizado com sucesso!" : "Agente criado com sucesso!",
        })

        onSuccess()
        onOpenChange(false)

        // Reset form if creating new agent
        if (!agent) {
          setFormData({
            name: "",
            webhookDev: "",
            webhookProd: "",
            prompt: "",
            status: "active",
            description: "",
          })
        }
      } else {
        toast({
          title: "Erro",
          description: agent ? "Falha ao atualizar agente." : "Falha ao criar agente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{agent ? "Editar Agente" : "Criar Novo Agente"}</DialogTitle>
          <DialogDescription>
            {agent ? "Atualize as informações do agente." : "Preencha os dados para criar um novo agente de IA."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="max-h-[50vh]"
              placeholder="Descreva como o agente deve se comportar e quais são suas responsabilidades..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
