"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { myMessagesService } from "@/lib/my-messages-api"
import { useUserId } from "@/lib/use-user-id"
import { MessageSquare, Calendar, Smartphone, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import type { Agent } from "@/lib/agents-real"

interface KPICardsProps {
  agents: Agent[]
}

interface KPIData {
  totalMessages: number
  totalInstances: number
  connectedInstances: number
  totalSchedules: number
  messagesTrend: "up" | "down" | "stable"
  instancesTrend: "up" | "down" | "stable"
}

export function KPICards({ agents }: KPICardsProps) {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalMessages: 0,
    totalInstances: 0,
    connectedInstances: 0,
    totalSchedules: 0,
    messagesTrend: "stable",
    instancesTrend: "stable",
  })
  const [loading, setLoading] = useState(true)
  const userId = useUserId()

  useEffect(() => {
    if (userId) {
      loadKPIData()
    }
  }, [userId, agents])

  const loadKPIData = async () => {
    if (!userId) return

    console.log("🚀 [KPI] Iniciando carregamento dos KPIs")
    console.log("🚀 [KPI] UserId:", userId)
    console.log("🚀 [KPI] Agents:", (agents || []).length)

    try {
      setLoading(true)

      // Primeiro, calcular estatísticas das instâncias Evolution (não depende de API externa)
      let totalInstances = 0
      let connectedInstances = 0

      console.log("🔍 [KPI] Calculando estatísticas das instâncias Evolution")

      for (const agent of (agents || [])) {
        console.log(`🔍 [KPI] Agente ${agent.name}:`, {
          id: agent.id,
          hasEvolutionInstances: !!agent.evolutionInstances,
          evolutionInstancesLength: agent.evolutionInstances?.length || 0,
          evolutionInstances: agent.evolutionInstances
        })

        if (agent.evolutionInstances && Array.isArray(agent.evolutionInstances)) {
          totalInstances += agent.evolutionInstances.length
          const agentConnectedInstances = agent.evolutionInstances.filter(
            instance => instance.connectionState === "CONNECTED"
          ).length
          connectedInstances += agentConnectedInstances

          console.log(`🔍 [KPI] Agente ${agent.name} - Instâncias:`, {
            total: agent.evolutionInstances.length,
            conectadas: agentConnectedInstances
          })
        }
      }

      console.log("🔍 [KPI] Resultado instâncias:", { totalInstances, connectedInstances })

      // Definir dados básicos primeiro (sem mensagens)
      const basicKpiData = {
        totalMessages: 0, // Será atualizado depois
        totalInstances,
        connectedInstances,
        totalSchedules: 0,
        messagesTrend: "stable" as const,
        instancesTrend: connectedInstances > (totalInstances - connectedInstances) ? "up" as const :
                       connectedInstances < (totalInstances - connectedInstances) ? "down" as const : "stable" as const,
      }

      // Atualizar primeiro com dados básicos
      setKpiData(basicKpiData)
      setLoading(false)

      console.log("🔍 [KPI] Dados básicos definidos, carregando mensagens...")

      // Carregar mensagens de forma assíncrona (não bloqueia a interface)
      let totalMessages = 0
      try {
        for (const agent of (agents || [])) {
          try {
            console.log(`🔍 [KPI] Carregando mensagens para agente ${agent.name}`)
            const messagesResponse = await Promise.race([
              myMessagesService.getMessagesByAgent(agent.id, { limit: 1 }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]) as any

            const agentMessages = messagesResponse.metadata?.pagination?.total || 0
            totalMessages += agentMessages
            console.log(`🔍 [KPI] Agente ${agent.name}: ${agentMessages} mensagens`)
          } catch (error) {
            console.warn(`Timeout ou erro ao carregar mensagens para ${agent.name}:`, error)
            // Continua sem bloquear
          }
        }

        console.log("🔍 [KPI] Total de mensagens:", totalMessages)

        // Atualizar com dados de mensagens
        setKpiData(prev => ({
          ...prev,
          totalMessages
        }))
      } catch (error) {
        console.warn("Erro ao carregar mensagens, mantendo valor 0:", error)
      }

    } catch (error) {
      console.error("Error loading KPI data:", error)
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total de Mensagens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
          <MessageSquare className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.totalMessages.toLocaleString()}</div>
          <div className={`text-xs flex items-center ${getTrendColor(kpiData.messagesTrend)}`}>
            {getTrendIcon(kpiData.messagesTrend)}
            <span className="ml-1">Todas as conversas</span>
          </div>
        </CardContent>
      </Card>

      {/* Instâncias Evolution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Instâncias Evolution</CardTitle>
          <Smartphone className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpiData.connectedInstances}/{kpiData.totalInstances}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge
              variant={kpiData.connectedInstances > 0 ? "default" : "secondary"}
              className="text-xs"
            >
              {kpiData.connectedInstances} Conectadas
            </Badge>
            {getTrendIcon(kpiData.instancesTrend)}
          </div>
        </CardContent>
      </Card>

      {/* Total de Agendamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.totalSchedules}</div>
          <div className="text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Em breve
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Total de Agentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(agents || []).filter(agent => agent.status === "active").length}/{(agents || []).length}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge
              variant={(agents || []).filter(agent => agent.status === "active").length > 0 ? "default" : "secondary"}
              className="text-xs"
            >
              {(agents || []).filter(agent => agent.status === "active").length} Ativos
            </Badge>
            <Badge
              variant={(agents || []).filter(agent => agent.status === "development").length > 0 ? "outline" : "secondary"}
              className="text-xs text-yellow-600"
            >
              {(agents || []).filter(agent => agent.status === "development").length} Em Desenvolvimento
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
