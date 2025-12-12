const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface FunnelStats {
  totalFunnels: number
  totalLeads: number
  totalValue: number
  wonLeads: number
  wonValue: number
  lostLeads: number
  conversionRate: number
  avgDealValue: number
  leadsThisMonth: number
  leadsToday: number
  funnels: Array<{
    id: string
    name: string
    leadsCount: number
    totalValue: number
    stages: Array<{
      id: string
      name: string
      color: string
      leadsCount: number
    }>
  }>
  stageDistribution: Array<{
    name: string
    count: number
    value: number
  }>
  monthlyTrend: Array<{
    month: string
    leads: number
    value: number
    won: number
  }>
  topFunnels: Array<{
    name: string
    leads: number
    value: number
    conversionRate: number
  }>
}

export async function getFunnelStatsByAgentId(agentId: string): Promise<FunnelStats | null> {
  try {
    console.log(`📊 [FUNNEL-STATS] Buscando estatísticas de funis para agente ${agentId}`)

    const response = await fetch(`${API_BASE_URL}/funnel/stats/agent/${agentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.warn(`⚠️ [FUNNEL-STATS] Erro ao buscar estatísticas: ${response.status}`)
      return null
    }

    const responseData = await response.json()
    console.log(`🔍 [FUNNEL-STATS] Resposta bruta da API:`, responseData)

    // A API retorna os dados dentro de response.data
    const data = responseData.data || responseData

    console.log(`✅ [FUNNEL-STATS] Estatísticas carregadas:`, {
      totalFunnels: data.totalFunnels,
      totalLeads: data.totalLeads,
      conversionRate: data.conversionRate,
      funnelsCount: data.funnels?.length || 0,
    })

    return data
  } catch (error) {
    console.error("❌ [FUNNEL-STATS] Erro ao buscar estatísticas de funis:", error)
    return null
  }
}
