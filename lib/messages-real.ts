"use client"

import { myMessagesService, type Message as APIMessage } from "@/lib/my-messages-api"

export interface Message {
  id: string
  chatId: string
  message: string
  type: "input" | "output"
  createdAt: Date
  processed: boolean
  hasAppointment?: boolean
  isAiResponse?: boolean
  senderId?: string
  senderName?: string
  instanceName?: string
}

// Palavras-chave para detectar agendamentos
const APPOINTMENT_KEYWORDS = [
  // Confirmações diretas
  'agendado', 'agendamento', 'marcado', 'confirmado', 'confirmação',
  'reunião marcada', 'consulta marcada', 'horário confirmado',
  'reservado', 'reserva confirmada', 'compromisso',
  
  // Expressões de confirmação
  'perfeito', 'ótimo', 'certo', 'combinado', 'fechado', 'beleza',
  'vou anotar', 'está marcado', 'anote aí', 'anotado', 'ok',
  
  // Frases de confirmação
  'então fica', 'então vamos', 'pode ser', 'está bom', 'tá bom',
  'confirmo', 'pode confirmar', 'vou confirmar', 'confirmando',
  'pode marcar', 'vou marcar', 'agendando', 'marcando',
  
  // Horários e datas
  'às ', ' às ', 'na ', ' na ', 'dia ', 'hoje', 'amanhã',
  'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo',
  'manhã', 'tarde', 'noite', 'madrugada',
  
  // Contexto de agendamento
  'reunião', 'consulta', 'encontro', 'visita', 'atendimento',
  'demonstração', 'apresentação', 'meeting', 'call', 'ligação'
]

// Padrões que indicam confirmação de agendamento
const CONFIRMATION_PATTERNS = [
  /agendado para/i,
  /marcado para/i,
  /confirmado para/i,
  /então fica/i,
  /pode confirmar/i,
  /vou confirmar/i,
  /está confirmado/i,
  /reunião confirmada/i,
  /horário confirmado/i,
  /encontro marcado/i,
  /consulta marcada/i
]

// Detectar se uma mensagem contém indicadores de agendamento confirmado
const detectAppointment = (message: string): boolean => {
  const lowerMessage = message.toLowerCase()
  
  // Primeiro, verificar padrões de confirmação diretos
  const hasConfirmationPattern = CONFIRMATION_PATTERNS.some(pattern => 
    pattern.test(lowerMessage)
  )
  
  if (hasConfirmationPattern) return true
  
  // Verificar se contém palavras-chave de agendamento
  const hasKeyword = APPOINTMENT_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  )
  
  // Padrões regex para horários e datas
  const timePatterns = [
    /\d{1,2}:\d{2}/, // 14:30, 9:15
    /\d{1,2}h\d{0,2}/, // 14h30, 9h, 14h
    /\d{1,2} ?h ?(\d{2})?/i, // 14h30, 9 h 15, 14h
    /\d{1,2} horas?/i, // 2 horas, 14 horas
    /\d{1,2}\/\d{1,2}/, // 15/03, 5/12
    /\d{1,2}-\d{1,2}/, // 15-03, 5-12
    /(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i,
    /(amanhã|hoje|ontem)/i,
    /(manhã|tarde|noite)/i
  ]
  
  const hasTimePattern = timePatterns.some(pattern => pattern.test(lowerMessage))
  
  // Retorna true se tem palavra-chave E padrão de tempo
  return hasKeyword && hasTimePattern
}

// Converter mensagem da API para formato interno
const convertAPIMessage = (apiMsg: APIMessage): Message => ({
  id: apiMsg.id,
  chatId: apiMsg.chatId || apiMsg.sessionId,
  message: apiMsg.message || apiMsg.content || '',
  type: apiMsg.direction === 'sent' ? 'output' : 'input',
  createdAt: new Date(apiMsg.timestamp || apiMsg.createdAt),
  processed: true,
  hasAppointment: detectAppointment(apiMsg.message || apiMsg.content || ''),
  isAiResponse: apiMsg.isAiResponse,
  senderId: apiMsg.senderId,
  senderName: apiMsg.senderName,
  instanceName: apiMsg.instanceName
})

// Buscar todas as mensagens das instâncias do agente
export const getMessagesByAgentId = async (agentId: string): Promise<Message[]> => {
  try {
    console.log(`📊 [DASHBOARD] Buscando todas as mensagens do agente ${agentId}`)
    
    const response = await myMessagesService.getMessagesByAgent(agentId, {
      limit: 1000 // Buscar muitas mensagens para análise completa
    })
    
    if (response.success) {
      const messages = response.data.map(convertAPIMessage)
      console.log(`📊 [DASHBOARD] ${messages.length} mensagens carregadas`)
      return messages
    }
    
    console.warn(`⚠️ [DASHBOARD] Falha ao carregar mensagens: ${response.message}`)
    return []
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

// Buscar mensagens com agendamentos
export const getAppointmentMessages = async (agentId: string): Promise<Message[]> => {
  const messages = await getMessagesByAgentId(agentId)
  return messages.filter((msg) => msg.hasAppointment)
}

// Calcular estatísticas das mensagens
export const getMessageStats = async (agentId: string) => {
  const messages = await getMessagesByAgentId(agentId)
  const appointmentMessages = messages.filter(msg => msg.hasAppointment)

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisYear = new Date(today.getFullYear(), 0, 1)

  const todayMessages = messages.filter((msg) => 
    msg.createdAt >= todayStart
  ).length

  const monthMessages = messages.filter((msg) => 
    msg.createdAt >= thisMonth
  ).length

  const yearMessages = messages.filter((msg) => 
    msg.createdAt >= thisYear
  ).length

  // Contar agendamentos únicos por conversa
  const appointmentsByChat = new Map<string, boolean>()
  appointmentMessages.forEach(msg => {
    appointmentsByChat.set(msg.chatId, true)
  })
  
  const confirmedAppointments = appointmentsByChat.size

  console.log(`📊 [STATS] Total: ${messages.length}, Hoje: ${todayMessages}, Mês: ${monthMessages}, Agendamentos: ${confirmedAppointments}`)

  return {
    total: messages.length,
    today: todayMessages,
    month: monthMessages,
    year: yearMessages,
    confirmedAppointments,
  }
}

// Gerar dados para gráficos
export const getChartData = async (agentId: string) => {
  const messages = await getMessagesByAgentId(agentId)
  const appointmentMessages = messages.filter(msg => msg.hasAppointment)

  // Agendamentos diários dos últimos 30 dias
  const dailyAppointments = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    // Contar agendamentos únicos por conversa neste dia
    const dayAppointmentChats = new Set<string>()
    appointmentMessages
      .filter(msg => msg.createdAt >= dayStart && msg.createdAt < dayEnd)
      .forEach(msg => dayAppointmentChats.add(msg.chatId))

    return {
      day: date.getDate(),
      appointments: dayAppointmentChats.size
    }
  })

  // Crescimento de mensagens por mês (últimos 12 meses)
  const messageGrowth = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthMessages = messages.filter(
      (msg) => msg.createdAt >= monthStart && msg.createdAt <= monthEnd
    ).length

    return {
      month: date.toLocaleDateString("pt-BR", { month: "short" }),
      messages: monthMessages,
    }
  })

  // Distribuição de tipos de mensagem
  const inputMessages = messages.filter((msg) => msg.type === "input").length
  const outputMessages = messages.filter((msg) => msg.type === "output").length
  const aiMessages = messages.filter((msg) => msg.isAiResponse).length

  const messageTypes = [
    { name: "Recebidas", value: inputMessages, fill: "var(--color-chart-1)" },
    { name: "Enviadas", value: outputMessages, fill: "var(--color-chart-2)" },
    { name: "IA", value: aiMessages, fill: "var(--color-chart-3)" },
  ]

  return {
    dailyAppointments,
    messageGrowth,
    messageTypes,
  }
}