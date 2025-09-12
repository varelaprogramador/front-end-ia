"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import Link from "next/link"
import type { Agent } from "@/lib/agents"

interface ChatHeaderProps {
  agent: Agent
}

export function ChatHeader({ agent }: ChatHeaderProps) {
  return (
    <div className="border-b bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/agent/${agent.id}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">{agent.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-semibold text-balance">{agent.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                Online
              </Badge>
              <span className="text-xs text-muted-foreground">Última atividade: agora</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
