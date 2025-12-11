"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Workflow,
  BarChart3,
} from "lucide-react"

interface FunnelStats {
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
}

interface FunnelKPICardsProps {
  stats: FunnelStats
  loading?: boolean
}

export function FunnelKPICards({ stats, loading = false }: FunnelKPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              +{stats.leadsToday} hoje
            </Badge>
            <Badge variant="secondary" className="text-xs">
              +{stats.leadsThisMonth} este mês
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <div className="text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{formatCurrency(stats.wonValue)}</span>
            {" "}ganho
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <Target className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant="default" className="text-xs bg-green-600">
              {stats.wonLeads} ganhos
            </Badge>
            <Badge variant="destructive" className="text-xs">
              {stats.lostLeads} perdidos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <Award className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.avgDealValue)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Workflow className="h-3 w-3" />
            {stats.totalFunnels} funis conectados
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
