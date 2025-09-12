"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface AnalyticsChartsProps {
  chartData: {
    dailyAppointments: Array<{ day: number; appointments: number }>
    messageGrowth: Array<{ month: string; messages: number }>
    messageTypes: Array<{ name: string; value: number; fill: string }>
  }
}

const chartConfig = {
  appointments: {
    label: "Agendamentos",
    color: "hsl(var(--chart-1))",
  },
  messages: {
    label: "Mensagens",
    color: "hsl(var(--chart-2))",
  },
}

export function AnalyticsCharts({ chartData }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Appointments Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Agendamentos por Dia</CardTitle>
          <CardDescription className="text-pretty">
            Quantidade de agendamentos confirmados nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyAppointments}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                <Bar dataKey="appointments" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Message Growth Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Crescimento de Conversas</CardTitle>
          <CardDescription className="text-pretty">Evolução do número de mensagens ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.messageGrowth}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="var(--color-chart-2)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-chart-2)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "var(--color-chart-2)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Message Types Pie Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-balance">Distribuição de Mensagens</CardTitle>
          <CardDescription className="text-pretty">
            Proporção entre mensagens recebidas e enviadas pelo agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.messageTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.messageTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="space-y-4">
              {chartData.messageTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.fill }} />
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-muted-foreground">{type.value} mensagens</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
