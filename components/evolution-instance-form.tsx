"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [useCustomCredentials, setUseCustomCredentials] = useState(false)
  const [useCustomWebhook, setUseCustomWebhook] = useState(false)

  const [formData, setFormData] = useState({
    instanceName: instance?.instanceName || "",
    evolutionUrl: instance?.serverUrl || "",
    apiKey: instance?.apiKey || "",
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "", // URL padrão do ambiente
  })

  // Atualizar o formulário quando a instância mudar
  useEffect(() => {
    if (instance) {
      // Extrair base URL do webhook URL se existir, senão usar a URL do ambiente
      const baseUrl = instance.webhookUrl
        ? instance.webhookUrl.replace(/\/webhooks\/receive-evo$/, "")
        : process.env.NEXT_PUBLIC_API_URL || "";

      // Detectar se usa credenciais personalizadas (se serverUrl ou apiKey não estão vazios)
      const hasCustomCredentials = !!(instance.serverUrl || instance.apiKey);
      setUseCustomCredentials(hasCustomCredentials);

      // Detectar se usa webhook personalizado (diferente da URL padrão)
      const hasCustomWebhook = instance.webhookUrl &&
        baseUrl !== process.env.NEXT_PUBLIC_API_URL;
      setUseCustomWebhook(!!hasCustomWebhook);

      setFormData({
        instanceName: instance.instanceName || "",
        evolutionUrl: instance.serverUrl || "",
        apiKey: instance.apiKey || "",
        baseUrl: baseUrl,
      })
      setSelectedEvents(["MESSAGES_UPSERT"]) // Sempre fixo
    } else {
      // Limpar formulário para nova instância com URL padrão do ambiente
      setUseCustomCredentials(false);
      setUseCustomWebhook(false);
      setFormData({
        instanceName: "",
        evolutionUrl: "",
        apiKey: "",
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
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
          serverUrl: useCustomCredentials ? formData.evolutionUrl : "", // Vazio se não personalizado
          apiKey: useCustomCredentials ? formData.apiKey : "", // Vazio se não personalizado
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
          serverUrl: useCustomCredentials ? formData.evolutionUrl : "", // Vazio se não personalizado
          apiKey: useCustomCredentials ? formData.apiKey : "", // Vazio se não personalizado
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
          setUseCustomCredentials(false)
          setUseCustomWebhook(false)
          setFormData({
            instanceName: "",
            evolutionUrl: "",
            apiKey: "",
            baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
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

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="useCustomCredentials"
                checked={useCustomCredentials}
                onCheckedChange={(checked) => setUseCustomCredentials(checked as boolean)}
              />
              <Label
                htmlFor="useCustomCredentials"
                className="text-sm font-normal cursor-pointer"
              >
                Usar credenciais Evolution personalizadas
              </Label>
            </div>

            {useCustomCredentials && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="evolutionUrl">URL do Servidor Evolution</Label>
                  <Input
                    id="evolutionUrl"
                    type="url"
                    value={formData.evolutionUrl}
                    onChange={(e) => setFormData({ ...formData, evolutionUrl: e.target.value })}
                    placeholder="https://evolution.exemplo.com"
                    required={useCustomCredentials}
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
                    required={useCustomCredentials}
                  />
                </div>
              </>
            )}

            {!useCustomCredentials && (
              <div className="border border-blue-200 dark:border-blue-800 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Credenciais padrão do ambiente serão utilizadas</strong>
                  <br />
                  As credenciais configuradas no servidor serão usadas automaticamente.
                </p>
              </div>
            )}
          </div>

          {/* Configurações de Webhook */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações de Webhook</h3>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="useCustomWebhook"
                checked={useCustomWebhook}
                onCheckedChange={(checked) => {
                  setUseCustomWebhook(checked as boolean)
                  // Se desmarcar, volta para URL padrão
                  if (!checked) {
                    setFormData({ ...formData, baseUrl: process.env.NEXT_PUBLIC_API_URL || "" })
                  }
                }}
              />
              <Label
                htmlFor="useCustomWebhook"
                className="text-sm font-normal cursor-pointer"
              >
                Customizar URL do webhook
              </Label>
            </div>

            {useCustomWebhook ? (
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base do Webhook</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="baseUrl"
                    type="url"
                    value={formData.baseUrl}
                    className="border-none w-[60%]"
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder={process.env.NEXT_PUBLIC_API_URL || "https://seu-servidor.com"}
                  />
                  <p className="text-sm text-gray-800">/webhooks/receive-evo</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL completa do webhook: <code className="bg-muted px-1 py-0.5 rounded">{formData.baseUrl ? `${formData.baseUrl.replace(/\/$/, "")}/webhooks/receive-evo` : `${process.env.NEXT_PUBLIC_API_URL || "{base-url}"}/webhooks/receive-evo`}</code>
                </p>
              </div>
            ) : (
              <div className="border border-blue-200 dark:border-blue-800 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>URL padrão do webhook será utilizada</strong>
                  <br />
                  Webhook: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-900 dark:text-blue-100">{process.env.NEXT_PUBLIC_API_URL || "URL do ambiente"}/webhooks/receive-evo</code>
                </p>
              </div>
            )}


            <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-gray-900/30">
              <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">Configurações Automáticas:</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
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