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

// Palavras-chave FORTES para detectar agendamentos confirmados
// Reduzi para evitar falsos positivos
const APPOINTMENT_CONFIRMATION_KEYWORDS = [
  // Confirmações explícitas de agendamento
  'agendado para',
  'marcado para',
  'confirmado para',
  'reunião marcada para',
  'consulta marcada para',
  'horário confirmado',
  'está agendado',
  'está marcado',
  'ficou agendado',
  'vou agendar',
  'vou marcar',
  'agendamento confirmado',
  'reserva confirmada'
]

// Padrões regex que indicam confirmação de agendamento
const CONFIRMATION_PATTERNS = [
  /agendado\s+para\s+.*(dia|segunda|terça|quarta|quinta|sexta|sábado|domingo|\d{1,2}[\/\-]\d{1,2}|\d{1,2}h|\d{1,2}:\d{2})/i,
  /marcado\s+para\s+.*(dia|segunda|terça|quarta|quinta|sexta|sábado|domingo|\d{1,2}[\/\-]\d{1,2}|\d{1,2}h|\d{1,2}:\d{2})/i,
  /confirmado\s+para\s+.*(dia|segunda|terça|quarta|quinta|sexta|sábado|domingo|\d{1,2}[\/\-]\d{1,2}|\d{1,2}h|\d{1,2}:\d{2})/i,
  /consulta\s+(marcada|agendada)\s+para/i,
  /reunião\s+(marcada|agendada)\s+para/i,
  /horário\s+confirmado/i,
  /agendamento\s+confirmado/i,
  /ficou\s+(agendado|marcado)/i,
  /vou\s+(agendar|marcar)\s+para/i,
  /fica\s+(agendado|marcado)\s+então/i
]

// Detectar se uma mensagem contém indicadores de agendamento confirmado
// Esta função é mais restritiva para evitar falsos positivos
const detectAppointment = (message: string): boolean => {
  const lowerMessage = message.toLowerCase()

  // Verificar padrões de confirmação diretos (mais confiáveis)
  const hasConfirmationPattern = CONFIRMATION_PATTERNS.some(pattern =>
    pattern.test(lowerMessage)
  )

  if (hasConfirmationPattern) return true

  // Verificar se contém palavras-chave de confirmação explícita
  const hasExplicitKeyword = APPOINTMENT_CONFIRMATION_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword.toLowerCase())
  )

  return hasExplicitKeyword
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
  // - Recebidas: mensagens do contato (input/received, não são respostas da IA)
  // - Enviadas (Manual): mensagens enviadas manualmente pelo operador
  // - IA: mensagens enviadas automaticamente pela IA
  const inputMessages = messages.filter((msg) => msg.type === "input" && !msg.isAiResponse).length
  const manualOutputMessages = messages.filter((msg) => msg.type === "output" && !msg.isAiResponse).length
  const aiMessages = messages.filter((msg) => msg.isAiResponse === true).length

  const messageTypes = [
    { name: "Recebidas", value: inputMessages, fill: "var(--color-chart-1)" },
    { name: "Enviadas (Manual)", value: manualOutputMessages, fill: "var(--color-chart-2)" },
    { name: "Respostas IA", value: aiMessages, fill: "var(--color-chart-3)" },
  ]

  return {
    dailyAppointments,
    messageGrowth,
    messageTypes,
  }
}