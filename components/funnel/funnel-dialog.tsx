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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Workflow } from "lucide-react"
import type { Funnel } from "@/lib/funnel-api"

const funnelSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type FunnelFormData = z.infer<typeof funnelSchema>

interface FunnelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funnel?: Funnel | null
  onSave: (data: FunnelFormData) => Promise<void>
}

export function FunnelDialog({
  open,
  onOpenChange,
  funnel,
  onSave,
}: FunnelDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FunnelFormData>({
    resolver: zodResolver(funnelSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (funnel) {
        reset({
          name: funnel.name,
          description: funnel.description || "",
          isActive: funnel.isActive,
        })
      } else {
        reset({
          name: "",
          description: "",
          isActive: true,
        })
      }
    }
  }, [open, funnel, reset])

  const onSubmit = async (data: FunnelFormData) => {
    try {
      setLoading(true)
      await onSave(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving funnel:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            {funnel ? "Editar Funil" : "Novo Funil de Vendas"}
          </DialogTitle>
          <DialogDescription>
            {funnel
              ? "Atualize as informações do seu funil de vendas."
              : "Crie um novo funil para gerenciar seus leads e oportunidades."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Funil *</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  placeholder="Ex: Vendas B2B, Captação de Clientes..."
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
            <Label htmlFor="description">Descrição</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo deste funil..."
                  rows={3}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="cursor-pointer">
                Funil Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Funis inativos não processam follow-ups automáticos
              </p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
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
              {funnel ? "Salvar" : "Criar Funil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
