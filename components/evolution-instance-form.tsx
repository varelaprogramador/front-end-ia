"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import type { EvolutionInstance } from "@/lib/types/evolution-instance"
import { EVOLUTION_EVENTS } from "@/lib/types/evolution-instance"
import { evolutionInstanceService } from "@/lib/evolution-instance-api"
import { useUserId } from "@/lib/use-user-id"
import { X } from "lucide-react"

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
    webhook: instance?.webhookUrl || "",
    webhookByEvents: instance?.webhookByEvents || false,
    webhookBase64: instance?.webhookBase64 || false,
  })

  // Atualizar o formulário quando a instância mudar
  useEffect(() => {
    if (instance) {
      setFormData({
        instanceName: instance.instanceName || "",
        evolutionUrl: instance.serverUrl || "",
        apiKey: instance.apiKey || "",
        webhook: instance.webhookUrl || "",
        webhookByEvents: instance.webhookByEvents || false,
        webhookBase64: instance.webhookBase64 || false,
      })
      setSelectedEvents(instance.webhookEvents || [])
    } else {
      // Limpar formulário para nova instância
      setFormData({
        instanceName: "",
        evolutionUrl: "",
        apiKey: "",
        webhook: "",
        webhookByEvents: false,
        webhookBase64: false,
      })
      setSelectedEvents([])
    }
  }, [instance])

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

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

      if (instance) {
        // Atualizando instância existente
        const response = await evolutionInstanceService.updateInstance(instance.id, {
          instanceName: formData.instanceName,
          serverUrl: formData.evolutionUrl,
          apiKey: formData.apiKey,
          webhookUrl: formData.webhook,
          webhookByEvents: formData.webhookByEvents,
          webhookBase64: formData.webhookBase64,
          webhookEvents: selectedEvents.length > 0 ? selectedEvents : undefined
        })
        result = response.data || response.instance || null
      } else {
        // Criando nova instância
        const response = await evolutionInstanceService.createInstance({
          instanceName: formData.instanceName,
          serverUrl: formData.evolutionUrl,
          apiKey: formData.apiKey,
          webhookUrl: formData.webhook,
          webhookByEvents: formData.webhookByEvents,
          webhookBase64: formData.webhookBase64,
          webhookEvents: selectedEvents.length > 0 ? selectedEvents : undefined,
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
            webhook: "",
            webhookByEvents: false,
            webhookBase64: false,
          })
          setSelectedEvents([])
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
              <Label htmlFor="webhook">URL do Webhook (opcional)</Label>
              <Input
                id="webhook"
                type="url"
                value={formData.webhook}
                onChange={(e) => setFormData({ ...formData, webhook: e.target.value })}
                placeholder="https://seu-webhook.com/evolution"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="webhookByEvents"
                checked={formData.webhookByEvents}
                onCheckedChange={(checked) => setFormData({ ...formData, webhookByEvents: checked })}
              />
              <Label htmlFor="webhookByEvents">Webhook por Eventos</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="webhookBase64"
                checked={formData.webhookBase64}
                onCheckedChange={(checked) => setFormData({ ...formData, webhookBase64: checked })}
              />
              <Label htmlFor="webhookBase64">Webhook Base64</Label>
            </div>
          </div>

          {/* Eventos */}
          {formData.webhookByEvents && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Eventos para Webhook</h3>
              <p className="text-sm text-muted-foreground">
                Selecione os eventos que deseja receber no seu webhook:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {EVOLUTION_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onChange={() => handleEventToggle(event)}
                      className="rounded"
                    />
                    <Label htmlFor={event} className="text-xs cursor-pointer flex-1">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Eventos selecionados ({selectedEvents.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvents.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                        <button
                          type="button"
                          onClick={() => handleEventToggle(event)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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