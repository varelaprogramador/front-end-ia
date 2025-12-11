"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface FunnelAnalyticsChartsProps {
  chartData: {
    stageDistribution: Array<{ name: string; count: number; value: number }>
    monthlyTrend: Array<{ month: string; leads: number; value: number; won: number }>
    topFunnels: Array<{ name: string; leads: number; value: number; conversionRate: number }>
  }
}

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  value: {
    label: "Valor",
    color: "hsl(var(--chart-2))",
  },
  won: {
    label: "Ganhos",
    color: "hsl(var(--chart-3))",
  },
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
]

export function FunnelAnalyticsCharts({ chartData }: FunnelAnalyticsChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value)
  }

  // Prepare pie chart data with colors
  const pieData = chartData.stageDistribution.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics de Funis de Vendas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Evolução Mensal de Leads</CardTitle>
            <CardDescription className="text-pretty">
              Quantidade de leads e ganhos nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthlyTrend}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Total Leads"
                  />
                  <Line
                    type="monotone"
                    dataKey="won"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Ganhos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Distribuição por Etapa</CardTitle>
            <CardDescription className="text-pretty">
              Quantidade de leads em cada etapa do funil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {pieData.map((stage, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.fill }} />
                    <span className="truncate max-w-[120px]" title={stage.name}>{stage.name}</span>
                    <span className="text-muted-foreground">({stage.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Funnels Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-balance">Performance dos Funis</CardTitle>
            <CardDescription className="text-pretty">
              Comparativo de leads e taxa de conversão por funil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.topFunnels.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.topFunnels} layout="vertical">
                    <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Leads: {data.leads}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Valor: {formatCurrency(data.value)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Conversão: {data.conversionRate.toFixed(1)}%
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="leads"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 4, 4, 0]}
                      name="Leads"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum funil encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
