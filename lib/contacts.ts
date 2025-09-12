export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  lastMessage: string
  lastMessageTime: Date
  status: "online" | "offline" | "away"
  unreadCount: number
  agentId: string
}

export interface Message {
  id: string
  contactId: string
  agentId: string
  content: string
  sender: "agent" | "contact"
  timestamp: Date
  read: boolean
}

// Mock data for contacts
export const MOCK_CONTACTS: Contact[] = [
  // Contacts for Sales Agent (id: "1")
  {
    id: "c1",
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "+55 11 99999-1111",
    avatar: "/diverse-businessman.png",
    lastMessage: "Gostaria de saber mais sobre os planos premium",
    lastMessageTime: new Date("2024-03-15T14:30:00"),
    status: "online",
    unreadCount: 2,
    agentId: "1",
  },
  {
    id: "c2",
    name: "Maria Santos",
    email: "maria.santos@empresa.com",
    phone: "+55 11 99999-2222",
    avatar: "/confident-businesswoman.png",
    lastMessage: "Quando podemos agendar uma demonstração?",
    lastMessageTime: new Date("2024-03-15T13:45:00"),
    status: "away",
    unreadCount: 0,
    agentId: "1",
  },
  {
    id: "c3",
    name: "Pedro Costa",
    email: "pedro.costa@startup.com",
    avatar: "/young-professional.jpg",
    lastMessage: "Preciso de um orçamento personalizado",
    lastMessageTime: new Date("2024-03-15T12:20:00"),
    status: "offline",
    unreadCount: 1,
    agentId: "1",
  },

  // Contacts for Support Agent (id: "2")
  {
    id: "c4",
    name: "Ana Oliveira",
    email: "ana.oliveira@cliente.com",
    phone: "+55 11 99999-3333",
    avatar: "/professional-woman.png",
    lastMessage: "O sistema está apresentando erro 404",
    lastMessageTime: new Date("2024-03-15T15:10:00"),
    status: "online",
    unreadCount: 3,
    agentId: "2",
  },
  {
    id: "c5",
    name: "Carlos Ferreira",
    email: "carlos.ferreira@tech.com",
    avatar: "/tech-support.jpg",
    lastMessage: "Consegui resolver o problema, obrigado!",
    lastMessageTime: new Date("2024-03-15T14:55:00"),
    status: "online",
    unreadCount: 0,
    agentId: "2",
  },
  {
    id: "c6",
    name: "Lucia Mendes",
    email: "lucia.mendes@usuario.com",
    phone: "+55 11 99999-4444",
    avatar: "/customer-service.jpg",
    lastMessage: "Como faço para resetar minha senha?",
    lastMessageTime: new Date("2024-03-15T11:30:00"),
    status: "away",
    unreadCount: 1,
    agentId: "2",
  },

  // Contacts for Marketing Agent (id: "3")
  {
    id: "c7",
    name: "Roberto Lima",
    email: "roberto.lima@marketing.com",
    avatar: "/marketing-manager.jpg",
    lastMessage: "Vamos discutir a nova campanha",
    lastMessageTime: new Date("2024-03-15T10:15:00"),
    status: "offline",
    unreadCount: 0,
    agentId: "3",
  },
  {
    id: "c8",
    name: "Fernanda Rocha",
    email: "fernanda.rocha@agencia.com",
    phone: "+55 11 99999-5555",
    avatar: "/creative-director.jpg",
    lastMessage: "Os resultados da campanha estão ótimos!",
    lastMessageTime: new Date("2024-03-15T09:45:00"),
    status: "online",
    unreadCount: 2,
    agentId: "3",
  },
]

// Mock messages data
export const MOCK_MESSAGES: Message[] = [
  // Messages for João Silva (c1) with Sales Agent
  {
    id: "m1",
    contactId: "c1",
    agentId: "1",
    content: "Olá! Gostaria de saber mais sobre os seus serviços.",
    sender: "contact",
    timestamp: new Date("2024-03-15T14:25:00"),
    read: true,
  },
  {
    id: "m2",
    contactId: "c1",
    agentId: "1",
    content:
      "Olá João! Fico feliz em ajudar. Temos diversos planos que podem atender suas necessidades. Gostaria de agendar uma conversa?",
    sender: "agent",
    timestamp: new Date("2024-03-15T14:26:00"),
    read: true,
  },
  {
    id: "m3",
    contactId: "c1",
    agentId: "1",
    content: "Gostaria de saber mais sobre os planos premium",
    sender: "contact",
    timestamp: new Date("2024-03-15T14:30:00"),
    read: false,
  },

  // Messages for Ana Oliveira (c4) with Support Agent
  {
    id: "m4",
    contactId: "c4",
    agentId: "2",
    content: "Estou com problemas para acessar o sistema",
    sender: "contact",
    timestamp: new Date("2024-03-15T15:05:00"),
    read: true,
  },
  {
    id: "m5",
    contactId: "c4",
    agentId: "2",
    content: "Vou verificar isso para você. Pode me informar qual erro está aparecendo?",
    sender: "agent",
    timestamp: new Date("2024-03-15T15:06:00"),
    read: true,
  },
  {
    id: "m6",
    contactId: "c4",
    agentId: "2",
    content: "O sistema está apresentando erro 404",
    sender: "contact",
    timestamp: new Date("2024-03-15T15:10:00"),
    read: false,
  },
]

export const getContactsByAgentId = (agentId: string): Contact[] => {
  return MOCK_CONTACTS.filter((contact) => contact.agentId === agentId)
}

export const getContactById = (contactId: string): Contact | undefined => {
  return MOCK_CONTACTS.find((contact) => contact.id === contactId)
}

export const getMessagesByContactId = (contactId: string): Message[] => {
  return MOCK_MESSAGES.filter((message) => message.contactId === contactId).sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  )
}

export const sendMessage = (
  contactId: string,
  agentId: string,
  content: string,
  sender: "agent" | "contact",
): Message => {
  const newMessage: Message = {
    id: Math.random().toString(36).substr(2, 9),
    contactId,
    agentId,
    content,
    sender,
    timestamp: new Date(),
    read: sender === "agent",
  }

  MOCK_MESSAGES.push(newMessage)

  // Update contact's last message
  const contactIndex = MOCK_CONTACTS.findIndex((c) => c.id === contactId)
  if (contactIndex !== -1) {
    MOCK_CONTACTS[contactIndex].lastMessage = content
    MOCK_CONTACTS[contactIndex].lastMessageTime = new Date()
    if (sender === "contact") {
      MOCK_CONTACTS[contactIndex].unreadCount += 1
    }
  }

  return newMessage
}
