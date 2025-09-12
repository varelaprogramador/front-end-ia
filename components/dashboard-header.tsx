"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"
import type { Agent } from "@/lib/agents"

interface DashboardHeaderProps {
  agent: Agent
}

export function DashboardHeader({ agent }: DashboardHeaderProps) {
  const statusColor = agent.status === "active" ? "bg-green-500" : "bg-gray-400"
  const statusText = agent.status === "active" ? "Ativo" : "Inativo"

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/workspace" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-balance">{agent.name}</h1>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                  {statusText}
                </Badge>
              </div>
              <p className="text-muted-foreground text-pretty">Dashboard de Analytics e Monitoramento</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/agent/${agent.id}/chat`} className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
