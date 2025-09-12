import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MessageSquareIcon = () => (
  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
)

const CalendarIcon = () => (
  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const BarChart3Icon = () => (
  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
)

interface KPICardsProps {
  stats: {
    total: number
    today: number
    month: number
    year: number
    confirmedAppointments: number
  }
}

export function KPICards({ stats }: KPICardsProps) {
  const kpis = [
    {
      title: "Total de Mensagens",
      value: stats.total.toLocaleString(),
      icon: MessageSquareIcon,
      description: "Todas as conversas",
    },
    {
      title: "Agendamentos Confirmados",
      value: stats.confirmedAppointments.toLocaleString(),
      icon: CalendarIcon,
      description: "Total de agendamentos",
    },
    {
      title: "Mensagens do Mês",
      value: stats.month.toLocaleString(),
      icon: TrendingUpIcon,
      description: "Mês atual",
    },
    {
      title: "Mensagens Hoje",
      value: stats.today.toLocaleString(),
      icon: BarChart3Icon,
      description: "Últimas 24h",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-balance">{kpi.title}</CardTitle>
              <Icon />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
