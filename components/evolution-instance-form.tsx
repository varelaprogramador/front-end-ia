"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { EvolutionInstance } from "@/lib/types/evolution-instance"
import { evolutionInstanceService } from "@/lib/evolution-instance-api"
import { useUserId } from "@/lib/use-user-id"

interface EvolutionInstanceFormProps {
  instance?: EvolutionInstance
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EvolutionInstanceForm({ instance, open, onOpenChange, onSuccess }: EvolutionInstanceFormProps) {
  const { toast } = useToast()
  const userId = useUserId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const [formData, setFormData] = useState({
    instanceName: instance?.instanceName || "",
    evolutionUrl: instance?.serverUrl || "",
    apiKey: instance?.apiKey || "",
    baseUrl: "", // Nova propriedade para capturar apenas a base URL
  })

  // Atualizar o formulário quando a instância mudar
  useEffect(() => {
    if (instance) {
      // Extrair base URL do webhook URL se existir
      const baseUrl = instance.webhookUrl
        ? instance.webhookUrl.replace(/\/webhooks\/receive-evo$/, "")
        : "";

      setFormData({
        instanceName: instance.instanceName || "",
        evolutionUrl: instance.serverUrl || "",
        apiKey: instance.apiKey || "",
        baseUrl: baseUrl,
      })
      setSelectedEvents(["MESSAGES_UPSERT"]) // Sempre fixo
    } else {
      // Limpar formulário para nova instância
      setFormData({
        instanceName: "",
        evolutionUrl: "",
        apiKey: "",
        baseUrl: "",
      })
      setSelectedEvents(["MESSAGES_UPSERT"]) // Sempre fixo
    }
  }, [instance])

  // Função removida - eventos são fixos agora

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
      let result: EvolutionInstance | null = null

      // Construir URL completa do webhook
      const webhookUrl = formData.baseUrl
        ? `${formData.baseUrl.replace(/\/$/, "")}/webhooks/receive-evo`
        : "";

      if (instance) {
        // Atualizando instância existente
        const response = await evolutionInstanceService.updateInstance(instance.id, {
          instanceName: formData.instanceName,
          serverUrl: formData.evolutionUrl,
          apiKey: formData.apiKey,
          webhookUrl: webhookUrl,
          webhookByEvents: false, // Sempre false
          webhookBase64: true, // Sempre true - ativado
          webhookEvents: ["MESSAGES_UPSERT"] // Sempre fixo
        })
        result = response.data || response.instance || null
      } else {
        // Criando nova instância
        const response = await evolutionInstanceService.createInstance({
          instanceName: formData.instanceName,
          serverUrl: formData.evolutionUrl,
          apiKey: formData.apiKey,
          webhookUrl: webhookUrl,
          webhookByEvents: false, // Sempre false
          webhookBase64: true, // Sempre true - ativado
          webhookEvents: ["MESSAGES_UPSERT"], // Sempre fixo
          userId
        })
        result = response.data || response.instance || null
      }

      if (result) {
        toast({
          title: "Sucesso",
          description: instance ? "Instância atualizada com sucesso!" : "Instância criada com sucesso!",
        })

        onSuccess()
        onOpenChange(false)

        // Reset form if creating new instance
        if (!instance) {
          setFormData({
            instanceName: "",
            evolutionUrl: "",
            apiKey: "",
            baseUrl: "",
          })
          setSelectedEvents(["MESSAGES_UPSERT"])
        }
      } else {
        toast({
          title: "Erro",
          description: instance ? "Falha ao atualizar instância." : "Falha ao criar instância.",
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{instance ? "Editar Instância" : "Criar Nova Instância"}</DialogTitle>
          <DialogDescription>
            {instance ? "Atualize as configurações da instância Evolution API." : "Configure uma nova instância do Evolution API."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>

            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                value={formData.instanceName}
                onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                placeholder="Ex: MinhaInstancia01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evolutionUrl">URL do Servidor Evolution</Label>
              <Input
                id="evolutionUrl"
                type="url"
                value={formData.evolutionUrl}
                onChange={(e) => setFormData({ ...formData, evolutionUrl: e.target.value })}
                placeholder="https://evolution.exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave da API</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Sua chave de API do Evolution"
                required
              />
            </div>
          </div>

          {/* Configurações de Webhook */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações de Webhook</h3>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL Base do Webhook (opcional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="baseUrl"
                  type="url"
                  value={formData.baseUrl}
                  className="border-none w-[60%]"
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://seu-servidor.com"
                />
                <p className="text-sm text-gray-800">/webhooks/receive-evo</p>
              </div>
              <p className="text-sm text-muted-foreground">
                A URL completa do webhook será: <code>{formData.baseUrl ? `${formData.baseUrl.replace(/\/$/, "")}/webhooks/receive-evo` : "{base-url}/webhooks/receive-evo"}</code>
              </p>
            </div>


            <div className="border p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">Configurações Automáticas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Webhook por eventos: <strong>Desativado</strong> (uma única URL para todos)</li>
                <li>• Evento monitorado: <strong>MESSAGES_UPSERT</strong> (apenas mensagens)</li>
                <li>• Base64: <strong>Ativado</strong> (dados em base64 nos webhooks)</li>
              </ul>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : instance ? "Atualizar" : "Criar"} Instância
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}