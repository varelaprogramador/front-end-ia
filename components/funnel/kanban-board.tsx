"use client"

import { useEffect, useRef, useState, memo } from "react"
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
  MessageSquare
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

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

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

  return (
    <div className="relative">
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      <div
        ref={ref}
        className={cn(
          "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all",
          "hover:shadow-md hover:border-primary/30",
          dragState === 'dragging' && "opacity-50 shadow-lg scale-105",
          dragState === 'over' && "ring-2 ring-primary/50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
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
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={menuItems}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          {lead.value && lead.value > 0 ? (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <DollarSign className="h-3 w-3" />
              {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          ) : (
            <div />
          )}
          <Badge variant="secondary" className={cn("text-xs", priorityColors[lead.priority])}>
            {lead.priority === 'high' ? 'Alta' : lead.priority === 'medium' ? 'Média' : 'Baixa'}
          </Badge>
        </div>

        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
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
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)

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
        "flex-shrink-0 w-80 bg-muted/30 rounded-xl flex flex-col transition-all",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Header */}
      <div
        className="p-3 border-b flex items-center justify-between rounded-t-xl"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
      >
        <div className="flex items-center gap-2">
          {isWon && <Trophy className="h-4 w-4 text-green-500" />}
          {isLost && <XCircle className="h-4 w-4 text-red-500" />}
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddLead}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Value Summary */}
      {totalValue > 0 && (
        <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Total: {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}

      {/* Leads Container */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[200px]">
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
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <User className="h-8 w-8 mb-2 opacity-50" />
            <p>Nenhum lead</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={onAddLead}
            >
              Adicionar lead
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
  const sortedStages = [...stages].sort((a, b) => {
    if (a.isFixed && !b.isFixed) return 1
    if (!a.isFixed && b.isFixed) return -1
    return a.order - b.order
  })

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
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
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
