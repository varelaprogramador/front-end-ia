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
import { Loader2 } from "lucide-react"
import type { FunnelStage } from "@/lib/funnel-api"

const stageSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
})

type StageFormData = z.infer<typeof stageSchema>

interface StageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage?: FunnelStage | null
  onSave: (data: StageFormData) => Promise<void>
}

const colorOptions = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#22c55e", label: "Verde" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#f97316", label: "Laranja" },
  { value: "#64748b", label: "Cinza" },
]

export function StageDialog({
  open,
  onOpenChange,
  stage,
  onSave,
}: StageDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
  })

  const selectedColor = watch("color")

  useEffect(() => {
    if (open) {
      if (stage) {
        reset({
          name: stage.name,
          color: stage.color,
        })
      } else {
        reset({
          name: "",
          color: "#3b82f6",
        })
      }
    }
  }, [open, stage, reset])

  const onSubmit = async (data: StageFormData) => {
    try {
      setLoading(true)
      await onSave(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving stage:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {stage ? "Editar Estágio" : "Novo Estágio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Estágio *</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  placeholder="Ex: Qualificação, Proposta, etc"
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
            <Label>Cor</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue("color", color.value)}
                  className={`
                    w-10 h-10 rounded-lg transition-all
                    ${selectedColor === color.value
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-destructive mt-1">{errors.color.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label>Cor personalizada:</Label>
            <Input
              type="color"
              value={selectedColor}
              onChange={(e) => setValue("color", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={selectedColor}
              onChange={(e) => setValue("color", e.target.value)}
              className="w-28 font-mono text-sm"
              placeholder="#000000"
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
              {stage ? "Salvar" : "Criar Estágio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
