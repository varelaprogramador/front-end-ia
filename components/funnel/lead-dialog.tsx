"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { FunnelLead, FunnelStage } from "@/lib/funnel-api"

const leadSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  value: z.number().min(0).optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  stageId: z.string().min(1, "Estágio obrigatório"),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: FunnelLead | null
  stages: FunnelStage[]
  defaultStageId?: string
  onSave: (data: LeadFormData & { tags: string[] }) => Promise<void>
}

export function LeadDialog({
  open,
  onOpenChange,
  lead,
  stages,
  defaultStageId,
  onSave,
}: LeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      value: 0,
      notes: "",
      source: "",
      priority: "medium",
      stageId: defaultStageId || "",
    },
  })

  useEffect(() => {
    if (open) {
      if (lead) {
        reset({
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          value: lead.value || 0,
          notes: lead.notes || "",
          source: lead.source || "",
          priority: lead.priority,
          stageId: lead.stageId,
        })
        setTags(lead.tags || [])
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          value: 0,
          notes: "",
          source: "",
          priority: "medium",
          stageId: defaultStageId || stages[0]?.id || "",
        })
        setTags([])
      }
    }
  }, [open, lead, reset, defaultStageId, stages])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const onSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true)
      await onSave({ ...data, tags })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving lead:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter out fixed stages for new leads (but allow for editing)
  const availableStages = lead
    ? stages
    : stages.filter((s) => !s.isFixed)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder="Nome do lead"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-9999"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="value">Valor (R$)</Label>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="source">Origem</Label>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Input
                    id="source"
                    placeholder="WhatsApp, Site, etc"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="stageId">Estágio *</Label>
              <Controller
                name="stageId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stageId && (
                <p className="text-sm text-destructive mt-1">{errors.stageId.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Digite uma tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="notes"
                    placeholder="Anotações sobre o lead..."
                    rows={3}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {lead ? "Salvar" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
