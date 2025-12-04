"use client"

import { useState, useMemo, memo, useRef, useEffect } from "react"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box"
import invariant from "tiny-invariant"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  MoreHorizontal,
  Plus,
  User,
  Phone,
  Mail,
  Clock,
  Edit2,
  Trash2,
  MessageSquare,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Timer,
  Send,
  ArrowRight,
  GripVertical,
  Zap,
  AlertTriangle
} from "lucide-react"
import { ActionMenu } from "@/components/ui/action-menu"
import type { FunnelLead } from "@/lib/funnel-api"

// ========================================
// TYPES
// ========================================

export interface FollowUpStep {
  id: string
  name: string
  order: number
  delayDays: number
  delayHours: number
  messageTemplate?: string
  isAutomatic: boolean
  color: string
  type: "followup" | "won" | "lost"
}

export interface LeadInFlow {
  id: string
  lead: FunnelLead
  currentStepId: string
  nextFollowUpAt?: Date
  followUpCount: number
  status: "active" | "paused" | "completed" | "lost"
  enteredAt: Date
  lastFollowUpAt?: Date
}

interface FollowUpFlowBoardProps {
  steps: FollowUpStep[]
  leadsInFlow: LeadInFlow[]
  onMoveLeadToStep: (leadFlowId: string, stepId: string) => Promise<void>
  onSendFollowUp: (leadFlowId: string) => Promise<void>
  onPauseResume: (leadFlowId: string) => Promise<void>
  onRemoveFromFlow: (leadFlowId: string) => Promise<void>
  onMarkAsWon: (leadFlowId: string) => Promise<void>
  onMarkAsLost: (leadFlowId: string) => Promise<void>
  onAddStep: (step: Omit<FollowUpStep, "id">) => Promise<void>
  onEditStep: (stepId: string, step: Partial<FollowUpStep>) => Promise<void>
  onDeleteStep: (stepId: string) => Promise<void>
}

type DragState = 'idle' | 'dragging' | 'over'

// ========================================
// DEFAULT STEPS
// ========================================

export const DEFAULT_FOLLOW_UP_STEPS: Omit<FollowUpStep, "id">[] = [
  { name: "1º Contato", order: 0, delayDays: 0, delayHours: 0, isAutomatic: false, color: "#3b82f6", type: "followup" },
  { name: "Follow-up 3 dias", order: 1, delayDays: 3, delayHours: 0, isAutomatic: true, color: "#8b5cf6", type: "followup" },
  { name: "Follow-up 7 dias", order: 2, delayDays: 7, delayHours: 0, isAutomatic: true, color: "#f59e0b", type: "followup" },
  { name: "Último contato", order: 3, delayDays: 1, delayHours: 0, isAutomatic: true, color: "#ef4444", type: "followup" },
  { name: "Ganho", order: 100, delayDays: 0, delayHours: 0, isAutomatic: false, color: "#22c55e", type: "won" },
  { name: "Perdido", order: 101, delayDays: 0, delayHours: 0, isAutomatic: false, color: "#dc2626", type: "lost" },
]

// ========================================
// UTILITIES
// ========================================

function formatTimeUntil(date: Date | undefined): string {
  if (!date) return ""

  const now = new Date()
  const diffMs = new Date(date).getTime() - now.getTime()

  if (diffMs < 0) return "Atrasado"

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `em ${diffDays}d ${diffHours % 24}h`
  if (diffHours > 0) return `em ${diffHours}h`
  return "em breve"
}

function formatDelay(days: number, hours: number): string {
  if (days === 0 && hours === 0) return "Imediato"
  if (days === 0) return `${hours}h`
  if (hours === 0) return `${days}d`
  return `${days}d ${hours}h`
}

// ========================================
// LEAD IN FLOW CARD
// ========================================

interface LeadFlowCardProps {
  leadInFlow: LeadInFlow
  onSendFollowUp: () => void
  onPauseResume: () => void
  onRemove: () => void
  onMarkAsWon: () => void
  onMarkAsLost: () => void
}

const LeadFlowCard = memo(function LeadFlowCard({
  leadInFlow,
  onSendFollowUp,
  onPauseResume,
  onRemove,
  onMarkAsWon,
  onMarkAsLost
}: LeadFlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  const { lead, status, nextFollowUpAt, followUpCount } = leadInFlow

  useEffect(() => {
    const element = ref.current
    invariant(element)

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          type: 'lead-flow',
          leadFlowId: leadInFlow.id,
          stepId: leadInFlow.currentStepId
        }),
        onDragStart: () => setDragState('dragging'),
        onDrop: () => setDragState('idle'),
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) => {
          const data = {
            type: 'lead-flow',
            leadFlowId: leadInFlow.id,
            stepId: leadInFlow.currentStepId
          }
          return attachClosestEdge(data, { input, element, allowedEdges: ['top', 'bottom'] })
        },
        canDrop: ({ source }) =>
          source.data.type === 'lead-flow' && source.data.leadFlowId !== leadInFlow.id,
        onDragEnter: ({ self }) => {
          setDragState('over')
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDrag: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => {
          setDragState('idle')
          setClosestEdge(null)
        },
        onDrop: () => {
          setDragState('idle')
          setClosestEdge(null)
        },
      })
    )
  }, [leadInFlow.id, leadInFlow.currentStepId])

  const statusConfig = {
    active: { icon: Play, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    paused: { icon: Pause, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    completed: { icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    lost: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
  }

  const currentStatus = statusConfig[status]
  const StatusIcon = currentStatus.icon
  const isOverdue = nextFollowUpAt && new Date(nextFollowUpAt) < new Date()

  const menuItems = [
    {
      label: "Enviar Follow-up",
      icon: <Send className="h-4 w-4" />,
      onClick: onSendFollowUp,
    },
    {
      label: status === "paused" ? "Retomar" : "Pausar",
      icon: status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />,
      onClick: onPauseResume,
    },
    {
      label: "Marcar como Ganho",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      onClick: onMarkAsWon,
    },
    {
      label: "Marcar como Perdido",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      onClick: onMarkAsLost,
    },
    {
      label: "Remover do Fluxo",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onRemove,
      variant: "destructive" as const,
    },
  ]

  return (
    <div className="relative group">
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      <div
        ref={ref}
        className={cn(
          "bg-card border rounded-xl p-3 cursor-grab active:cursor-grabbing",
          "transition-all duration-200 ease-out",
          "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
          dragState === 'dragging' && "opacity-50 shadow-xl scale-[1.02] rotate-1",
          dragState === 'over' && "ring-2 ring-primary/50 bg-primary/5",
          isOverdue && status === "active" && "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
                <Badge className={cn("h-5 px-1.5", currentStatus.bg, currentStatus.color)}>
                  <StatusIcon className="h-3 w-3" />
                </Badge>
              </div>
              {lead.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Phone className="h-3 w-3" />
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>
          </div>

          <ActionMenu
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={menuItems}
          />
        </div>

        {/* Info Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5">
              <MessageSquare className="h-3 w-3 mr-1" />
              {followUpCount} enviados
            </Badge>
          </div>

          {status === "active" && nextFollowUpAt && (
            <div className={cn(
              "flex items-center gap-1 text-[10px]",
              isOverdue ? "text-amber-600 font-medium" : "text-muted-foreground"
            )}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <Timer className="h-3 w-3" />
              {formatTimeUntil(nextFollowUpAt)}
            </div>
          )}
        </div>
      </div>
      {closestEdge === 'bottom' && <DropIndicator edge="bottom" />}
    </div>
  )
})

// ========================================
// FLOW STEP COLUMN
// ========================================

interface FlowStepColumnProps {
  step: FollowUpStep
  leads: LeadInFlow[]
  onMoveLeadToStep: (leadFlowId: string) => void
  onSendFollowUp: (leadFlowId: string) => void
  onPauseResume: (leadFlowId: string) => void
  onRemoveFromFlow: (leadFlowId: string) => void
  onMarkAsWon: (leadFlowId: string) => void
  onMarkAsLost: (leadFlowId: string) => void
  onEditStep: () => void
  onDeleteStep: () => void
  isEditable: boolean
}

const FlowStepColumn = memo(function FlowStepColumn({
  step,
  leads,
  onSendFollowUp,
  onPauseResume,
  onRemoveFromFlow,
  onMarkAsWon,
  onMarkAsLost,
  onEditStep,
  onDeleteStep,
  isEditable
}: FlowStepColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const element = ref.current
    invariant(element)

    return dropTargetForElements({
      element,
      getData: () => ({ type: 'step', stepId: step.id }),
      canDrop: ({ source }) => source.data.type === 'lead-flow',
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: () => setIsDragOver(false),
    })
  }, [step.id])

  const isWon = step.type === "won"
  const isLost = step.type === "lost"
  const isFixedStep = isWon || isLost

  const stepMenuItems = isEditable && !isFixedStep ? [
    {
      label: "Editar Etapa",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: onEditStep,
    },
    {
      label: "Excluir Etapa",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeleteStep,
      variant: "destructive" as const,
    },
  ] : []

  return (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 w-72 bg-muted/30 rounded-xl flex flex-col",
        "transition-all duration-200 ease-out",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]"
      )}
    >
      {/* Header */}
      <div
        className="p-3 border-b flex items-center justify-between rounded-t-xl"
        style={{ borderLeftColor: step.color, borderLeftWidth: 4 }}
      >
        <div className="flex items-center gap-2">
          {isWon && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {isLost && <XCircle className="h-4 w-4 text-red-500" />}
          {!isFixedStep && step.isAutomatic && <Zap className="h-4 w-4 text-amber-500" />}
          <div>
            <h3 className="font-semibold text-sm">{step.name}</h3>
            {!isFixedStep && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDelay(step.delayDays, step.delayHours)}
                {step.isAutomatic && " • Auto"}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium ml-1",
              leads.length > 0 ? "bg-primary/10 text-primary" : ""
            )}
          >
            {leads.length}
          </Badge>
        </div>

        {stepMenuItems.length > 0 && (
          <ActionMenu
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={stepMenuItems}
          />
        )}
      </div>

      {/* Leads Container */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-350px)] min-h-[150px]">
        {leads.map((leadInFlow) => (
          <LeadFlowCard
            key={leadInFlow.id}
            leadInFlow={leadInFlow}
            onSendFollowUp={() => onSendFollowUp(leadInFlow.id)}
            onPauseResume={() => onPauseResume(leadInFlow.id)}
            onRemove={() => onRemoveFromFlow(leadInFlow.id)}
            onMarkAsWon={() => onMarkAsWon(leadInFlow.id)}
            onMarkAsLost={() => onMarkAsLost(leadInFlow.id)}
          />
        ))}

        {leads.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed",
              "text-muted-foreground text-xs transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            )}
          >
            <User className="h-6 w-6 mb-1 opacity-40" />
            <p>Arraste leads aqui</p>
          </div>
        )}
      </div>
    </div>
  )
})

// ========================================
// ADD STEP DIALOG
// ========================================

interface StepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  step?: FollowUpStep | null
  onSave: (step: Omit<FollowUpStep, "id"> | Partial<FollowUpStep>) => void
}

const colorOptions = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#22c55e", "#ef4444", "#6366f1", "#14b8a6"
]

function StepDialog({ open, onOpenChange, step, onSave }: StepDialogProps) {
  const [name, setName] = useState("")
  const [delayDays, setDelayDays] = useState(1)
  const [delayHours, setDelayHours] = useState(0)
  const [isAutomatic, setIsAutomatic] = useState(true)
  const [color, setColor] = useState("#3b82f6")

  useEffect(() => {
    if (open && step) {
      setName(step.name)
      setDelayDays(step.delayDays)
      setDelayHours(step.delayHours)
      setIsAutomatic(step.isAutomatic)
      setColor(step.color)
    } else if (open) {
      setName("")
      setDelayDays(1)
      setDelayHours(0)
      setIsAutomatic(true)
      setColor("#3b82f6")
    }
  }, [open, step])

  const handleSave = () => {
    const data = {
      name,
      delayDays,
      delayHours,
      isAutomatic,
      color,
      order: step?.order ?? 0,
      type: "followup" as const
    }
    onSave(step ? { ...data, id: step.id } : data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{step ? "Editar Etapa" : "Nova Etapa de Follow-up"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nome da Etapa</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Follow-up 3 dias"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dias de espera</Label>
              <Select value={delayDays.toString()} onValueChange={(v) => setDelayDays(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d} {d === 1 ? "dia" : "dias"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Horas adicionais</Label>
              <Select value={delayHours.toString()} onValueChange={(v) => setDelayHours(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 6, 12, 18].map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Envio automático</Label>
              <p className="text-xs text-muted-foreground">
                Enviar mensagem automaticamente
              </p>
            </div>
            <Button
              type="button"
              variant={isAutomatic ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAutomatic(!isAutomatic)}
            >
              {isAutomatic ? <Zap className="h-4 w-4 mr-1" /> : null}
              {isAutomatic ? "Auto" : "Manual"}
            </Button>
          </div>

          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 mt-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c && "ring-2 ring-offset-2 ring-primary scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {step ? "Salvar" : "Criar Etapa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========================================
// MAIN FOLLOW-UP FLOW BOARD
// ========================================

export function FollowUpFlowBoard({
  steps,
  leadsInFlow,
  onMoveLeadToStep,
  onSendFollowUp,
  onPauseResume,
  onRemoveFromFlow,
  onMarkAsWon,
  onMarkAsLost,
  onAddStep,
  onEditStep,
  onDeleteStep,
}: FollowUpFlowBoardProps) {
  const [showStepDialog, setShowStepDialog] = useState(false)
  const [editingStep, setEditingStep] = useState<FollowUpStep | null>(null)

  // Sort steps by order
  const sortedSteps = useMemo(() =>
    [...steps].sort((a, b) => a.order - b.order),
    [steps]
  )

  // Group leads by step
  const leadsByStep = useMemo(() => {
    const map = new Map<string, LeadInFlow[]>()
    steps.forEach(step => map.set(step.id, []))
    leadsInFlow.forEach(lf => {
      const list = map.get(lf.currentStepId) || []
      list.push(lf)
      map.set(lf.currentStepId, list)
    })
    return map
  }, [steps, leadsInFlow])

  // Monitor for drag and drop
  useEffect(() => {
    return monitorForElements({
      onDrop: async ({ source, location }) => {
        const destination = location.current.dropTargets[0]
        if (!destination) return

        const sourceData = source.data
        const destData = destination.data

        if (sourceData.type !== 'lead-flow') return

        const leadFlowId = sourceData.leadFlowId as string

        if (destData.type === 'step') {
          const destStepId = destData.stepId as string
          await onMoveLeadToStep(leadFlowId, destStepId)
        }
      },
    })
  }, [onMoveLeadToStep])

  const handleSaveStep = async (stepData: Omit<FollowUpStep, "id"> | Partial<FollowUpStep>) => {
    if ('id' in stepData && stepData.id) {
      await onEditStep(stepData.id, stepData)
    } else {
      await onAddStep(stepData as Omit<FollowUpStep, "id">)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Fluxo de Follow-up</h3>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingStep(null)
            setShowStepDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Etapa
        </Button>
      </div>

      {/* Flow Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 px-1 -mx-1">
        {sortedSteps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-2">
            <FlowStepColumn
              step={step}
              leads={leadsByStep.get(step.id) || []}
              onMoveLeadToStep={() => {}}
              onSendFollowUp={onSendFollowUp}
              onPauseResume={onPauseResume}
              onRemoveFromFlow={onRemoveFromFlow}
              onMarkAsWon={onMarkAsWon}
              onMarkAsLost={onMarkAsLost}
              onEditStep={() => {
                setEditingStep(step)
                setShowStepDialog(true)
              }}
              onDeleteStep={() => onDeleteStep(step.id)}
              isEditable={step.type === "followup"}
            />
            {index < sortedSteps.length - 1 && step.type === "followup" && (
              <div className="flex items-center self-center pt-16">
                <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Dialog */}
      <StepDialog
        open={showStepDialog}
        onOpenChange={setShowStepDialog}
        step={editingStep}
        onSave={handleSaveStep}
      />
    </div>
  )
}
