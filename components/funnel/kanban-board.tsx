"use client"

import { useEffect, useRef, useState, memo, useMemo } from "react"
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
import {
  MoreHorizontal,
  Plus,
  User,
  Phone,
  Mail,
  DollarSign,
  GripVertical,
  Trophy,
  XCircle,
  Edit2,
  Trash2,
  MessageSquare,
  Clock,
  Calendar,
  Hash,
  ExternalLink,
  Star,
  Building2
} from "lucide-react"
import { ActionMenu } from "@/components/ui/action-menu"
import type { FunnelStage, FunnelLead } from "@/lib/funnel-api"

// ========================================
// TYPES
// ========================================

interface KanbanBoardProps {
  stages: FunnelStage[]
  onMoveLead: (leadId: string, stageId: string, order: number) => Promise<void>
  onEditLead: (lead: FunnelLead) => void
  onDeleteLead: (leadId: string) => void
  onAddLead: (stageId: string) => void
  onEditStage: (stage: FunnelStage) => void
  onDeleteStage: (stageId: string) => void
  onSendFollowUp?: (leadId: string) => void
}

interface LeadCardProps {
  lead: FunnelLead
  onEdit: () => void
  onDelete: () => void
  onSendFollowUp?: () => void
}

interface StageColumnProps {
  stage: FunnelStage
  leads: FunnelLead[]
  onAddLead: () => void
  onEditLead: (lead: FunnelLead) => void
  onDeleteLead: (leadId: string) => void
  onEditStage: () => void
  onDeleteStage: () => void
  onSendFollowUp?: (leadId: string) => void
}

type DragState = 'idle' | 'dragging' | 'over'

// ========================================
// UTILITIES
// ========================================

function formatRelativeDate(dateString: string | Date | undefined): string {
  if (!dateString) return ""

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Ontem"
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatExpectedCloseDate(dateString: string | undefined): { text: string; isOverdue: boolean; isDueSoon: boolean } {
  if (!dateString) return { text: "", isOverdue: false, isDueSoon: false }

  const date = new Date(dateString)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: `Atrasado ${Math.abs(diffDays)}d`, isOverdue: true, isDueSoon: false }
  }
  if (diffDays === 0) {
    return { text: "Vence hoje", isOverdue: false, isDueSoon: true }
  }
  if (diffDays <= 3) {
    return { text: `Vence em ${diffDays}d`, isOverdue: false, isDueSoon: true }
  }
  if (diffDays <= 7) {
    return { text: `Vence em ${diffDays}d`, isOverdue: false, isDueSoon: false }
  }
  return { text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), isOverdue: false, isDueSoon: false }
}

function truncateId(id: string, length: number = 8): string {
  if (!id) return ""
  return id.length > length ? `${id.slice(0, length)}...` : id
}

// ========================================
// LEAD CARD COMPONENT
// ========================================

const LeadCard = memo(function LeadCard({ lead, onEdit, onDelete, onSendFollowUp }: LeadCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  useEffect(() => {
    const element = ref.current
    invariant(element)

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'lead', leadId: lead.id, stageId: lead.stageId }),
        onDragStart: () => setDragState('dragging'),
        onDrop: () => setDragState('idle'),
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) => {
          const data = { type: 'lead', leadId: lead.id, stageId: lead.stageId }
          return attachClosestEdge(data, { input, element, allowedEdges: ['top', 'bottom'] })
        },
        canDrop: ({ source }) => source.data.type === 'lead' && source.data.leadId !== lead.id,
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
  }, [lead.id, lead.stageId])

  const priorityConfig = {
    low: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      label: 'Baixa'
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      label: 'Média'
    },
    high: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      label: 'Alta'
    },
  }

  const priority = priorityConfig[lead.priority]

  const menuItems = [
    {
      label: "Editar",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: onEdit,
    },
    ...(onSendFollowUp
      ? [
          {
            label: "Enviar Follow-up",
            icon: <MessageSquare className="h-4 w-4" />,
            onClick: onSendFollowUp,
          },
        ]
      : []),
    {
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: "destructive" as const,
    },
  ]

  const expectedClose = formatExpectedCloseDate(lead.expectedCloseDate)

  return (
    <div className="relative group">
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      <div
        ref={ref}
        className={cn(
          "bg-card border rounded-xl p-3 cursor-grab active:cursor-grabbing",
          "transition-all duration-200 ease-out",
          "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
          "group-hover:shadow-md",
          dragState === 'dragging' && "opacity-50 shadow-xl scale-[1.02] rotate-1",
          dragState === 'over' && "ring-2 ring-primary/50 bg-primary/5"
        )}
      >
        {/* Header com ID e Prioridade */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 font-medium",
                priority.bg,
                priority.text,
                priority.border
              )}
            >
              {priority.label}
            </Badge>
            {lead.rdstationDealId && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                RD
              </Badge>
            )}
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

        {/* Nome e ID */}
        <div className="mb-2">
          <h4 className="font-semibold text-sm truncate leading-tight">{lead.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
              <Hash className="h-2.5 w-2.5" />
              {truncateId(lead.id)}
            </span>
            {lead.source && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Building2 className="h-2.5 w-2.5" />
                {lead.source}
              </span>
            )}
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-1 mb-2">
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Valor e Data de Fechamento */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {lead.value && lead.value > 0 ? (
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" />
                {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">Sem valor</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {expectedClose.text && (
              <span className={cn(
                "text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded",
                expectedClose.isOverdue && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                expectedClose.isDueSoon && !expectedClose.isOverdue && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                !expectedClose.isOverdue && !expectedClose.isDueSoon && "text-muted-foreground"
              )}>
                <Calendar className="h-2.5 w-2.5" />
                {expectedClose.text}
              </span>
            )}
          </div>
        </div>

        {/* Rodapé com Tempo e Tags */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            {lead.createdAt && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatRelativeDate(lead.createdAt)}
              </span>
            )}
            {lead.lastContactAt && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-2">
                <MessageSquare className="h-2.5 w-2.5" />
                {formatRelativeDate(lead.lastContactAt)}
              </span>
            )}
          </div>

          {lead._count?.followUps && lead._count.followUps > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {lead._count.followUps} follow-ups
            </Badge>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 bg-muted/50"
              >
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 bg-muted/50"
              >
                +{lead.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      {closestEdge === 'bottom' && <DropIndicator edge="bottom" />}
    </div>
  )
})

// ========================================
// STAGE COLUMN COMPONENT
// ========================================

const StageColumn = memo(function StageColumn({
  stage,
  leads,
  onAddLead,
  onEditLead,
  onDeleteLead,
  onEditStage,
  onDeleteStage,
  onSendFollowUp
}: StageColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const element = ref.current
    invariant(element)

    return dropTargetForElements({
      element,
      getData: () => ({ type: 'stage', stageId: stage.id }),
      canDrop: ({ source }) => source.data.type === 'lead',
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: () => setIsDragOver(false),
    })
  }, [stage.id])

  const isWon = stage.fixedType === 'won'
  const isLost = stage.fixedType === 'lost'
  const totalValue = useMemo(() =>
    leads.reduce((sum, lead) => sum + (lead.value || 0), 0),
    [leads]
  )

  const stageMenuItems = [
    {
      label: "Editar Estágio",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: onEditStage,
    },
    {
      label: "Excluir Estágio",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeleteStage,
      variant: "destructive" as const,
    },
  ]

  return (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 w-80 bg-muted/30 rounded-xl flex flex-col",
        "transition-all duration-200 ease-out",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]"
      )}
    >
      {/* Header */}
      <div
        className="p-3 border-b flex items-center justify-between rounded-t-xl"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
      >
        <div className="flex items-center gap-2">
          {isWon && <Trophy className="h-4 w-4 text-emerald-500" />}
          {isLost && <XCircle className="h-4 w-4 text-red-500" />}
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              leads.length > 0 ? "bg-primary/10 text-primary" : ""
            )}
          >
            {leads.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {!stage.isFixed && (
            <ActionMenu
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
              items={stageMenuItems}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
            onClick={onAddLead}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Value Summary */}
      {totalValue > 0 && (
        <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Total: {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}

      {/* Leads Container */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[200px] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onDelete={() => onDeleteLead(lead.id)}
            onSendFollowUp={onSendFollowUp ? () => onSendFollowUp(lead.id) : undefined}
          />
        ))}

        {leads.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed",
              "text-muted-foreground text-sm transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            )}
          >
            <User className="h-8 w-8 mb-2 opacity-40" />
            <p className="font-medium">Nenhum lead</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1 h-auto p-0"
              onClick={onAddLead}
            >
              + Adicionar lead
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})

// ========================================
// MAIN KANBAN BOARD COMPONENT
// ========================================

export function KanbanBoard({
  stages,
  onMoveLead,
  onEditLead,
  onDeleteLead,
  onAddLead,
  onEditStage,
  onDeleteStage,
  onSendFollowUp
}: KanbanBoardProps) {
  // Sort stages: custom stages by order, then fixed stages at the end
  // Also filter out leads that are in the follow-up flow
  const sortedStages = useMemo(() =>
    [...stages]
      .sort((a, b) => {
        if (a.isFixed && !b.isFixed) return 1
        if (!a.isFixed && b.isFixed) return -1
        return a.order - b.order
      })
      .map(stage => ({
        ...stage,
        // Filter out leads that are in follow-up flow (they appear in the follow-up Kanban)
        leads: (stage.leads || []).filter(lead => !lead.isInFollowUpFlow)
      })),
    [stages]
  )

  // Monitor for drag and drop
  useEffect(() => {
    return monitorForElements({
      onDrop: async ({ source, location }) => {
        const destination = location.current.dropTargets[0]
        if (!destination) return

        const sourceData = source.data
        const destData = destination.data

        if (sourceData.type !== 'lead') return

        const leadId = sourceData.leadId as string
        const sourceStageId = sourceData.stageId as string

        // Dropped on a stage
        if (destData.type === 'stage') {
          const destStageId = destData.stageId as string

          // Find the stage and get leads count for order
          const destStage = stages.find(s => s.id === destStageId)
          const newOrder = destStage?.leads?.length || 0

          await onMoveLead(leadId, destStageId, newOrder)
        }
        // Dropped on another lead
        else if (destData.type === 'lead') {
          const destStageId = destData.stageId as string
          const destLeadId = destData.leadId as string
          const closestEdge = extractClosestEdge(destData)

          // Find destination stage and lead
          const destStage = stages.find(s => s.id === destStageId)
          const destLeads = destStage?.leads || []
          const destLeadIndex = destLeads.findIndex(l => l.id === destLeadId)

          // Calculate new order
          let newOrder = destLeadIndex
          if (closestEdge === 'bottom') {
            newOrder = destLeadIndex + 1
          }

          // If moving within the same stage, adjust for removal
          if (sourceStageId === destStageId) {
            const sourceLeadIndex = destLeads.findIndex(l => l.id === leadId)
            if (sourceLeadIndex < newOrder) {
              newOrder -= 1
            }
          }

          await onMoveLead(leadId, destStageId, Math.max(0, newOrder))
        }
      },
    })
  }, [stages, onMoveLead])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1 -mx-1">
      {sortedStages.map((stage) => (
        <StageColumn
          key={stage.id}
          stage={stage}
          leads={stage.leads || []}
          onAddLead={() => onAddLead(stage.id)}
          onEditLead={onEditLead}
          onDeleteLead={onDeleteLead}
          onEditStage={() => onEditStage(stage)}
          onDeleteStage={() => onDeleteStage(stage.id)}
          onSendFollowUp={onSendFollowUp}
        />
      ))}
    </div>
  )
}
