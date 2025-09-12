"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KPICards } from "@/components/kpi-cards"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { MessagesTable } from "@/components/messages-table"
import { getAgentById, type Agent } from "@/lib/agents"
import { getMessagesByAgentId, getAppointmentMessages, getMessageStats, getChartData, type Message } from "@/lib/messages-real"

interface AgentDashboardPageProps {
  params: { id: string }
}

export default function AgentDashboardPage({ params }: AgentDashboardPageProps) {
  const [agent, setAgent] = useState<Agent | null>(null)

  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [appointmentMessages, setAppointmentMessages] = useState<Message[]>([])
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    month: 0,
    year: 0,
    confirmedAppointments: 0,
  })
  const [chartData, setChartData] = useState<any>(null)
  const router = useRouter()

  // Carregar dados do agente
  useEffect(() => {
    const loadAgent = async () => {
      try {
        console.log(`📊 [DASHBOARD] Carregando agente ${params.id}`)
        const agentData = await getAgentById(params.id)
        console.log("TESTEEEEEE", agentData)
        if (!agentData) {
          console.warn(`⚠️ [DASHBOARD] Agente ${params.id} não encontrado`)
          router.push("/workspace")
          return
        }

        setAgent(agentData)
        console.log(`✅ [DASHBOARD] Agente carregado: ${agentData.name}`)
      } catch (error) {
        console.error('Erro ao carregar agente:', error)
        router.push("/workspace")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadAgent()
    }
  }, [params.id, router])

  // Carregar dados do dashboard quando o agente estiver disponível
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!agent) return

      try {
        setDashboardLoading(true)
        console.log(`📊 [DASHBOARD] Carregando dados para ${agent.name}`)

        // Carregar todos os dados em paralelo
        const [messagesData, appointmentMessagesData, statsData, chartDataResult] = await Promise.all([
          getMessagesByAgentId(agent.id),
          getAppointmentMessages(agent.id),
          getMessageStats(agent.id),
          getChartData(agent.id)
        ])

        setMessages(messagesData)
        setAppointmentMessages(appointmentMessagesData)
        setStats(statsData)
        setChartData(chartDataResult)

        console.log(`✅ [DASHBOARD] Dados carregados:`, {
          totalMessages: messagesData.length,
          appointments: statsData.confirmedAppointments,
          todayMessages: statsData.today
        })
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setDashboardLoading(false)
      }
    }

    loadDashboardData()
  }, [agent])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agente...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return null
  }

  if (dashboardLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Agent Info Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">{agent.name}</h1>
              <p className="text-muted-foreground text-pretty">Dashboard de Analytics e Monitoramento</p>
            </div>
          </div>

          {/* Loading State */}
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Carregando dados do dashboard...</p>
              <p className="text-sm text-muted-foreground">Analisando mensagens das instâncias</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-8">
        {/* Agent Info Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">{agent.name}</h1>
            <p className="text-muted-foreground text-pretty">Dashboard de Analytics e Monitoramento</p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            🔄 Atualizar Dados
          </button>
        </div>

        {/* KPI Cards */}
        <KPICards stats={stats} />

        {/* Analytics Charts */}
        {chartData && <AnalyticsCharts chartData={chartData} />}

        {/* Messages Table */}
        <MessagesTable messages={messages} appointmentMessages={appointmentMessages} />
      </div>
    </div>
  )
}
