export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
  status: "sent" | "delivered" | "read"
}

export interface ChatSession {
  id: string
  agentId: string
  agentName: string
  isActive: boolean
  lastMessage?: ChatMessage
  messages: ChatMessage[]
}

// Mock chat data
const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    content: "Olá! Como posso ajudá-lo hoje?",
    sender: "agent",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: "read",
  },
  {
    id: "2",
    content: "Oi! Gostaria de saber mais sobre os seus serviços de IA.",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 28),
    status: "read",
  },
  {
    id: "3",
    content:
      "Perfeito! Oferecemos soluções completas de inteligência artificial para empresas. Nossos agentes podem automatizar atendimento, vendas e suporte. Gostaria de agendar uma demonstração?",
    sender: "agent",
    timestamp: new Date(Date.now() - 1000 * 60 * 27),
    status: "read",
  },
  {
    id: "4",
    content: "Sim, seria ótimo! Qual seria o melhor horário?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    status: "read",
  },
  {
    id: "5",
    content: "Que tal amanhã às 14h? Posso agendar uma reunião de 30 minutos para mostrar todas as funcionalidades.",
    sender: "agent",
    timestamp: new Date(Date.now() - 1000 * 60 * 24),
    status: "read",
  },
  {
    id: "6",
    content: "Perfeito! Confirmo o agendamento para amanhã às 14h.",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 22),
    status: "read",
  },
  {
    id: "7",
    content:
      "Excelente! Agendamento confirmado para amanhã, 16 de março, às 14h. Você receberá um email de confirmação com o link da reunião em alguns minutos. Há mais alguma coisa que posso esclarecer?",
    sender: "agent",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    status: "read",
  },
]

const chatMessages = [...MOCK_CHAT_MESSAGES]

export const getChatSession = (agentId: string): ChatSession => {
  return {
    id: `chat_${agentId}`,
    agentId,
    agentName: "Agente IA",
    isActive: true,
    messages: chatMessages,
    lastMessage: chatMessages[chatMessages.length - 1],
  }
}

export const sendMessage = (content: string, sender: "user" | "agent"): ChatMessage => {
  const newMessage: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    content,
    sender,
    timestamp: new Date(),
    status: "sent",
  }

  chatMessages.push(newMessage)
  return newMessage
}

export const simulateAgentResponse = (userMessage: string): ChatMessage => {
  // Simple response simulation based on keywords
  let response = "Obrigado pela sua mensagem. Como posso ajudá-lo melhor?"

  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes("preço") || lowerMessage.includes("valor") || lowerMessage.includes("custo")) {
    response =
      "Nossos preços são personalizados de acordo com suas necessidades. Gostaria de agendar uma conversa para discutirmos um orçamento específico para sua empresa?"
  } else if (
    lowerMessage.includes("agendar") ||
    lowerMessage.includes("reunião") ||
    lowerMessage.includes("demonstração")
  ) {
    response =
      "Claro! Vou agendar uma demonstração para você. Qual seria o melhor dia e horário? Temos disponibilidade de segunda a sexta, das 9h às 18h."
  } else if (lowerMessage.includes("suporte") || lowerMessage.includes("ajuda") || lowerMessage.includes("problema")) {
    response =
      "Entendo que você precisa de suporte. Vou conectá-lo com nossa equipe técnica especializada. Pode me descrever qual é o problema específico?"
  } else if (lowerMessage.includes("obrigado") || lowerMessage.includes("valeu") || lowerMessage.includes("thanks")) {
    response = "De nada! Fico feliz em ajudar. Se precisar de mais alguma coisa, estarei aqui!"
  }

  return sendMessage(response, "agent")
}

// Simulate new messages arriving
export const simulateIncomingMessages = (callback: (message: ChatMessage) => void) => {
  const messages = [
    "Olá, tudo bem?",
    "Gostaria de saber mais sobre os preços",
    "Vocês têm suporte 24h?",
    "Como funciona a integração?",
    "Posso agendar uma demonstração?",
    "Obrigado pela ajuda!",
  ]

  const interval = setInterval(() => {
    if (Math.random() > 0.7) {
      // 30% chance of new message
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      const newMessage = sendMessage(randomMessage, "user")
      callback(newMessage)

      // Simulate agent response after 2-5 seconds
      setTimeout(
        () => {
          const agentResponse = simulateAgentResponse(randomMessage)
          callback(agentResponse)
        },
        Math.random() * 3000 + 2000,
      )
    }
  }, 5000) // Check every 5 seconds

  return () => clearInterval(interval)
}
