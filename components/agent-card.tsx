"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Agent } from "@/lib/agents-real"
import { BarChart3, MessageSquare, MoreHorizontal, Settings, Trash2, Link as LinkIcon, Power, PhoneOff, Key, RefreshCw, Database, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface AgentCardProps {
  agent: Agent
  onDelete?: (agentId: string) => void
  onManageInstances?: (agent: Agent) => void
  onToggleStatus?: (agentId: string, newStatus: "active" | "inactive" | "development") => void
  onManageBlockedNumbers?: (agent: Agent) => void
  onManageCredentials?: (agent: Agent) => void
  onGenerateRdToken?: (agent: Agent) => void
  onRefreshRdToken?: (agent: Agent) => void
}

export function AgentCard({ agent, onDelete, onManageInstances, onToggleStatus, onManageBlockedNumbers, onManageCredentials, onGenerateRdToken, onRefreshRdToken }: AgentCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  // Verificar se precisa gerar token do RD Station (tem clientId e clientSecret mas não tem accessToken)
  const needsRdToken = agent.rdstationClientId && agent.rdstationClientSecret && !agent.rdstationAccessToken

  // Verificar se pode atualizar token do RD Station (já tem accessToken e refreshToken)
  const canRefreshRdToken = agent.rdstationClientId && agent.rdstationClientSecret && agent.rdstationAccessToken && agent.rdstationRefreshToken

  // Verificar conexões com CRMs
  const isKommoConnected = !!(agent.kommoSubdomain && agent.kommoAccessToken)
  const isRdStationConnected = !!(agent.rdstationClientId && agent.rdstationAccessToken)
  const hasAnyCrmConnection = isKommoConnected || isRdStationConnected

  const menuRef = useRef<HTMLDivElement>(null)
  const statusColor = agent.status === "active" ? "bg-green-500" : agent.status === "development" ? "bg-yellow-500" : "bg-gray-400"
  const statusText = agent.status === "active" ? "Ativo" : agent.status === "development" ? "Em Desenvolvimento" : "Inativo"

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-balance">{agent.name}</CardTitle>
            <CardDescription className="text-pretty">
              Criado em {agent.createdAt.toLocaleDateString("pt-BR")}
            </CardDescription>
            {/* Indicadores de CRM conectados */}
            {hasAnyCrmConnection && (
              <div className="flex items-center gap-1.5 pt-1">
                <TooltipProvider>
                  {isKommoConnected && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Kommo
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Conectado ao Kommo CRM</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isRdStationConnected && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          RD Station
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Conectado ao RD Station CRM</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              {statusText}
            </Badge>
            <div className="relative" ref={menuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {onToggleStatus && (
                      <button
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          agent.status === "active" 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-green-600 dark:text-green-400"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          let newStatus: "active" | "inactive" | "development";
                          if (agent.status === "active") {
                            newStatus = "development";
                          } else if (agent.status === "development") {
                            newStatus = "inactive";
                          } else {
                            newStatus = "active";
                          }
                          console.log(`Toggle status clicked for agent: ${agent.name}, current: ${agent.status}, new: ${newStatus}`);
                          onToggleStatus(agent.id, newStatus);
                        }}
                      >
                        <Power className="h-4 w-4" />
                        {agent.status === "active" ? "Para Desenvolvimento" : agent.status === "development" ? "Desativar" : "Ativar"}
                      </button>
                    )}
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        console.log('Edit clicked for agent:', agent.name);
                        router.push(`/workspace/editar/${agent.id}`);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Editar
                    </button>
                    {onManageInstances && (
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onManageInstances(agent);
                        }}
                      >
                        <LinkIcon className="h-4 w-4" />
                        Gerenciar Instâncias
                      </button>
                    )}
                    {onManageCredentials && (
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onManageCredentials(agent);
                        }}
                      >
                        <Key className="h-4 w-4" />
                        Atribuir Credenciais
                      </button>
                    )}
                    {onManageBlockedNumbers && (
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onManageBlockedNumbers(agent);
                        }}
                      >
                        <PhoneOff className="h-4 w-4" />
                        Números Bloqueados
                      </button>
                    )}
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        console.log('Delete clicked for agent:', agent.name);
                        onDelete?.(agent.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{agent.totalMessages}</p>
              <p className="text-xs text-muted-foreground">Mensagens</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{agent.confirmedAppointments}</p>
              <p className="text-xs text-muted-foreground">Agendamentos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon className={`h-4 w-4 ${(agent.evolutionInstances?.length || 0) > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-sm font-medium">
                {agent.evolutionInstances?.length || 0}
                {(agent.evolutionInstances?.length || 0) > 0 && (
                  <span className="ml-1 text-xs text-green-600">
                    ({agent.evolutionInstances?.filter(i => i.connectionState === "CONNECTED").length || 0} on)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Instâncias</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Prompt:</p>
          <p className="text-xs text-muted-foreground line-clamp-2 text-pretty">{agent.prompt}</p>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/agent/${agent.id}`}>Ver Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
            <Link href={`/agent/${agent.id}/chat`}>Chat</Link>
          </Button>
        </div>

        {/* Botão para gerar token do RD Station (quando tem clientId/secret mas não tem accessToken) */}
        {needsRdToken && onGenerateRdToken && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
            onClick={() => onGenerateRdToken(agent)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Gerar Token RD Station
          </Button>
        )}

        {/* Botão para atualizar token do RD Station (quando já tem accessToken) */}
        {canRefreshRdToken && onRefreshRdToken && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
            onClick={() => onRefreshRdToken(agent)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Token RD Station
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
