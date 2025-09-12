export interface Message {
  id: string
  chatId: string
  message: string
  type: "input" | "output"
  createdAt: Date
  processed: boolean
  hasAppointment?: boolean
}

// Mock messages data
export const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    chatId: "chat_001",
    message: "Olá, gostaria de saber mais sobre seus serviços",
    type: "input",
    createdAt: new Date("2024-03-15T10:30:00"),
    processed: true,
  },
  {
    id: "2",
    chatId: "chat_001",
    message:
      "Olá! Ficamos felizes em ajudar. Oferecemos soluções completas de IA para empresas. Gostaria de agendar uma reunião para conversarmos melhor?",
    type: "output",
    createdAt: new Date("2024-03-15T10:31:00"),
    processed: true,
  },
  {
    id: "3",
    chatId: "chat_001",
    message: "Sim, gostaria de agendar uma reunião para amanhã às 14h",
    type: "input",
    createdAt: new Date("2024-03-15T10:32:00"),
    processed: true,
    hasAppointment: true,
  },
  {
    id: "4",
    chatId: "chat_001",
    message: "Perfeito! Agendamento confirmado para amanhã às 14h. Você receberá um email de confirmação em breve.",
    type: "output",
    createdAt: new Date("2024-03-15T10:33:00"),
    processed: true,
    hasAppointment: true,
  },
  {
    id: "5",
    chatId: "chat_002",
    message: "Preciso de suporte técnico urgente",
    type: "input",
    createdAt: new Date("2024-03-15T14:20:00"),
    processed: true,
  },
  {
    id: "6",
    chatId: "chat_002",
    message: "Entendo a urgência. Vou te conectar com nossa equipe técnica. Qual é o problema específico?",
    type: "output",
    createdAt: new Date("2024-03-15T14:21:00"),
    processed: true,
  },
  {
    id: "7",
    chatId: "chat_003",
    message: "Quero cancelar minha assinatura",
    type: "input",
    createdAt: new Date("2024-03-15T16:45:00"),
    processed: false,
  },
  {
    id: "8",
    chatId: "chat_004",
    message: "Gostaria de agendar uma demonstração do produto",
    type: "input",
    createdAt: new Date("2024-03-15T17:10:00"),
    processed: true,
    hasAppointment: true,
  },
  {
    id: "9",
    chatId: "chat_004",
    message: "Claro! Vamos agendar uma demonstração. Qual horário seria melhor para você?",
    type: "output",
    createdAt: new Date("2024-03-15T17:11:00"),
    processed: true,
  },
  {
    id: "10",
    chatId: "chat_004",
    message: "Sexta-feira às 10h seria perfeito",
    type: "input",
    createdAt: new Date("2024-03-15T17:12:00"),
    processed: true,
    hasAppointment: true,
  },
]

export const getMessagesByAgentId = (agentId: string): Message[] => {
  // In a real app, this would filter by agent ID
  return MOCK_MESSAGES
}

export const getAppointmentMessages = (agentId: string): Message[] => {
  return getMessagesByAgentId(agentId).filter((msg) => msg.hasAppointment)
}

export const getMessageStats = (agentId: string) => {
  const messages = getMessagesByAgentId(agentId)
  const appointmentMessages = getAppointmentMessages(agentId)

  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisYear = new Date(today.getFullYear(), 0, 1)

  const todayMessages = messages.filter((msg) => msg.createdAt.toDateString() === today.toDateString()).length

  const monthMessages = messages.filter((msg) => msg.createdAt >= thisMonth).length

  const yearMessages = messages.filter((msg) => msg.createdAt >= thisYear).length

  const confirmedAppointments = appointmentMessages.length / 2 // Assuming pairs of messages for appointments

  return {
    total: messages.length,
    today: todayMessages,
    month: monthMessages,
    year: yearMessages,
    confirmedAppointments: Math.floor(confirmedAppointments),
  }
}

export const getChartData = (agentId: string) => {
  const messages = getMessagesByAgentId(agentId)

  // Daily appointments for the current month
  const dailyAppointments = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))

    const dayAppointments = messages.filter(
      (msg) => msg.hasAppointment && msg.createdAt.toDateString() === date.toDateString(),
    ).length

    return {
      day: date.getDate(),
      appointments: Math.floor(dayAppointments / 2), // Pairs of messages
    }
  })

  // Message growth over time
  const messageGrowth = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))

    const monthMessages = messages.filter(
      (msg) => msg.createdAt.getMonth() === date.getMonth() && msg.createdAt.getFullYear() === date.getFullYear(),
    ).length

    return {
      month: date.toLocaleDateString("pt-BR", { month: "short" }),
      messages: monthMessages,
    }
  })

  // Message type distribution
  const inputMessages = messages.filter((msg) => msg.type === "input").length
  const outputMessages = messages.filter((msg) => msg.type === "output").length

  const messageTypes = [
    { name: "Recebidas", value: inputMessages, fill: "var(--color-chart-1)" },
    { name: "Enviadas", value: outputMessages, fill: "var(--color-chart-2)" },
  ]

  return {
    dailyAppointments,
    messageGrowth,
    messageTypes,
  }
}
