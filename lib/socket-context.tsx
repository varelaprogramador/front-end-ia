"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { Message, Contact } from "./my-messages-api"
import { API_BASE_URL } from "./api-config"

// ===================================================
// Types
// ===================================================

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error"

interface SocketContextValue {
  socket: Socket | null
  status: ConnectionStatus
  isConnected: boolean

  // Métodos para gerenciar rooms
  joinAgentRoom: (agentId: string) => void
  leaveAgentRoom: (agentId: string) => void
  joinContactRoom: (agentId: string, contactId: string) => void
  leaveContactRoom: (agentId: string, contactId: string) => void

  // Eventos customizados
  onNewMessage: (callback: (message: Message) => void) => () => void
  onMessageUpdate: (callback: (message: Message) => void) => () => void
  onContactUpdate: (callback: (contact: Contact) => void) => () => void
  onTyping: (callback: (data: { contactId: string; isTyping: boolean }) => void) => () => void
}

// ===================================================
// Context
// ===================================================

const SocketContext = createContext<SocketContextValue | undefined>(undefined)

// ===================================================
// Provider Component
// ===================================================

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [isConnected, setIsConnected] = useState(false)

  // Refs para armazenar callbacks
  const messageCallbacksRef = useRef<Set<(message: Message) => void>>(new Set())
  const messageUpdateCallbacksRef = useRef<Set<(message: Message) => void>>(new Set())
  const contactUpdateCallbacksRef = useRef<Set<(contact: Contact) => void>>(new Set())
  const typingCallbacksRef = useRef<Set<(data: { contactId: string; isTyping: boolean }) => void>>(new Set())

  // ===================================================
  // Inicialização do Socket
  // ===================================================

  useEffect(() => {
    console.log("🔌 [SOCKET] Inicializando conexão com:", API_BASE_URL)

    const socketInstance = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    // Eventos de conexão
    socketInstance.on("connect", () => {
      console.log("✅ [SOCKET] Conectado! Socket ID:", socketInstance.id)
      setStatus("connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("⚠️ [SOCKET] Desconectado:", reason)
      setStatus("disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("❌ [SOCKET] Erro de conexão:", error.message)
      setStatus("error")
      setIsConnected(false)
    })

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`🔄 [SOCKET] Reconectado após ${attemptNumber} tentativas`)
      setStatus("connected")
      setIsConnected(true)
    })

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 [SOCKET] Tentativa de reconexão ${attemptNumber}...`)
      setStatus("connecting")
    })

    socketInstance.on("reconnect_error", (error) => {
      console.error("❌ [SOCKET] Erro ao reconectar:", error.message)
      setStatus("error")
    })

    socketInstance.on("reconnect_failed", () => {
      console.error("❌ [SOCKET] Falha ao reconectar após todas as tentativas")
      setStatus("error")
    })

    // ===================================================
    // Eventos customizados do backend
    // ===================================================

    // Nova mensagem
    socketInstance.on("new_message", (message: Message) => {
      console.log("📨 [SOCKET] Nova mensagem recebida:", message)
      messageCallbacksRef.current.forEach(callback => callback(message))
    })

    // Atualização de mensagem (status de leitura, etc)
    socketInstance.on("message_update", (message: Message) => {
      console.log("🔄 [SOCKET] Mensagem atualizada:", message)
      messageUpdateCallbacksRef.current.forEach(callback => callback(message))
    })

    // Atualização de contato
    socketInstance.on("contact_update", (contact: Contact) => {
      console.log("👤 [SOCKET] Contato atualizado:", contact)
      contactUpdateCallbacksRef.current.forEach(callback => callback(contact))
    })

    // Evento de digitação
    socketInstance.on("typing", (data: { contactId: string; isTyping: boolean }) => {
      console.log("⌨️ [SOCKET] Evento de digitação:", data)
      typingCallbacksRef.current.forEach(callback => callback(data))
    })

    setSocket(socketInstance)

    // Cleanup ao desmontar
    return () => {
      console.log("🔌 [SOCKET] Desconectando...")
      socketInstance.disconnect()
    }
  }, [])

  // ===================================================
  // Room Management
  // ===================================================

  const joinAgentRoom = useCallback((agentId: string) => {
    if (!socket) {
      console.warn("⚠️ [SOCKET] Socket não conectado")
      return
    }

    const room = `agent:${agentId}`
    console.log("🚪 [SOCKET] Entrando no room:", room)
    socket.emit("join_room", { room })
  }, [socket])

  const leaveAgentRoom = useCallback((agentId: string) => {
    if (!socket) return

    const room = `agent:${agentId}`
    console.log("🚪 [SOCKET] Saindo do room:", room)
    socket.emit("leave_room", { room })
  }, [socket])

  const joinContactRoom = useCallback((agentId: string, contactId: string) => {
    if (!socket) {
      console.warn("⚠️ [SOCKET] Socket não conectado")
      return
    }

    const room = `agent:${agentId}:contact:${contactId}`
    console.log("🚪 [SOCKET] Entrando no room:", room)
    socket.emit("join_room", { room })
  }, [socket])

  const leaveContactRoom = useCallback((agentId: string, contactId: string) => {
    if (!socket) return

    const room = `agent:${agentId}:contact:${contactId}`
    console.log("🚪 [SOCKET] Saindo do room:", room)
    socket.emit("leave_room", { room })
  }, [socket])

  // ===================================================
  // Event Listeners Customizados
  // ===================================================

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    messageCallbacksRef.current.add(callback)

    // Retorna função de cleanup
    return () => {
      messageCallbacksRef.current.delete(callback)
    }
  }, [])

  const onMessageUpdate = useCallback((callback: (message: Message) => void) => {
    messageUpdateCallbacksRef.current.add(callback)

    return () => {
      messageUpdateCallbacksRef.current.delete(callback)
    }
  }, [])

  const onContactUpdate = useCallback((callback: (contact: Contact) => void) => {
    contactUpdateCallbacksRef.current.add(callback)

    return () => {
      contactUpdateCallbacksRef.current.delete(callback)
    }
  }, [])

  const onTyping = useCallback((callback: (data: { contactId: string; isTyping: boolean }) => void) => {
    typingCallbacksRef.current.add(callback)

    return () => {
      typingCallbacksRef.current.delete(callback)
    }
  }, [])

  // ===================================================
  // Context Value
  // ===================================================

  const value: SocketContextValue = {
    socket,
    status,
    isConnected,
    joinAgentRoom,
    leaveAgentRoom,
    joinContactRoom,
    leaveContactRoom,
    onNewMessage,
    onMessageUpdate,
    onContactUpdate,
    onTyping,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

// ===================================================
// Hook para usar o contexto
// ===================================================

export function useSocket() {
  const context = useContext(SocketContext)

  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }

  return context
}

// ===================================================
// Hook customizado para mensagens
// ===================================================

export function useSocketMessages(agentId: string, contactId?: string) {
  const { joinAgentRoom, leaveAgentRoom, joinContactRoom, leaveContactRoom, onNewMessage, isConnected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!isConnected) return

    // Entrar nos rooms apropriados
    joinAgentRoom(agentId)

    if (contactId) {
      joinContactRoom(agentId, contactId)
    }

    // Limpar ao desmontar
    return () => {
      leaveAgentRoom(agentId)
      if (contactId) {
        leaveContactRoom(agentId, contactId)
      }
    }
  }, [agentId, contactId, isConnected, joinAgentRoom, leaveAgentRoom, joinContactRoom, leaveContactRoom])

  // Escutar novas mensagens
  useEffect(() => {
    const cleanup = onNewMessage((message) => {
      // Filtrar mensagens relevantes
      if (contactId && message.chatId !== contactId) return

      setMessages(prev => [...prev, message])
    })

    return cleanup
  }, [contactId, onNewMessage])

  return { messages, setMessages }
}

// ===================================================
// Hook para indicador de digitação
// ===================================================

export function useTypingIndicator(contactId: string) {
  const { socket, onTyping } = useSocket()
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Escutar eventos de digitação
  useEffect(() => {
    const cleanup = onTyping((data) => {
      if (data.contactId === contactId) {
        setIsTyping(data.isTyping)

        // Auto-limpar após 3 segundos
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }

          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
          }, 3000)
        }
      }
    })

    return () => {
      cleanup()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [contactId, onTyping])

  // Emitir evento de digitação
  const emitTyping = useCallback((typing: boolean) => {
    if (!socket) return

    socket.emit("typing", { contactId, isTyping: typing })
  }, [socket, contactId])

  return { isTyping, emitTyping }
}
