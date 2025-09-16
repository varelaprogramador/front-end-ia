"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Loader2,
  RefreshCw,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  File,
  User,
  Users,
  Clock,
  CheckCheck,
  Check,
  PhoneOff,
  Bot,
  BotOff,
  Smartphone
} from "lucide-react"
import { myMessagesService, type Message } from "@/lib/my-messages-api"
import {
  getDeactivatedAgentsByConfig,
  createDeactivatedAgent,
  updateDeactivatedAgent,
  type DeactivatedAgent
} from "@/lib/deactivated-agents-api"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface ContactChatInterfaceProps {
  contactId: string
  agentId: string
}

export function ContactChatInterface({ contactId, agentId }: ContactChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactInfo, setContactInfo] = useState<{
    isGroup: boolean
    chatId: string
    instanceName?: string
  } | null>(null)
  const [isContactDeactivated, setIsContactDeactivated] = useState(false)
  const [deactivatedAgent, setDeactivatedAgent] = useState<DeactivatedAgent | null>(null)
  const [togglingContactStatus, setTogglingContactStatus] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadMessages = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await myMessagesService.getMessagesByAgent(agentId, {
        contactId: contactId,
        limit: 100, // Aumentar limite para mais mensagens
      })

      if (response.success) {
        // Ordenar mensagens por timestamp para exibir cronologicamente
        const sortedMessages = response.data.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime()
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime()
          return dateA - dateB // Mais antigas primeiro
        })

        setMessages(sortedMessages)

        // Extrair informações do contato da mensagem mais recente
        if (response.data.length > 0) {
          // Buscar mensagem com informações mais completas do contato
          const messageWithContactInfo = response.data.find(msg =>
            msg.senderName && msg.senderName !== contactId
          ) || response.data[0]

          setContactName(messageWithContactInfo.senderName || messageWithContactInfo.senderId || contactId)
          setContactInfo({
            isGroup: messageWithContactInfo.isGroup || false,
            chatId: messageWithContactInfo.chatId || contactId,
            instanceName: messageWithContactInfo.instanceName,
          })
        } else {
          // Se não há mensagens, usar o contactId como nome
          setContactName(contactId)
          setContactInfo({
            isGroup: false,
            chatId: contactId,
            instanceName: undefined,
          })
        }

        console.log(`💬 [CHAT] Carregadas ${response.data.length} mensagens para contato ${contactId}`)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      // Definir valores padrão em caso de erro
      setContactName(contactId)
      setContactInfo({
        isGroup: false,
        chatId: contactId,
        instanceName: undefined,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkContactDeactivationStatus = async () => {
    try {
      const deactivatedAgents = await getDeactivatedAgentsByConfig(agentId, true)

      // Procurar por este contato específico
      // O contactId pode ser o número completo ou apenas o número
      const phoneNumber = contactId.split('@')[0] // Remove @s.whatsapp.net se presente
      const deactivated = deactivatedAgents.find(agent =>
        agent.phoneNumber === phoneNumber ||
        agent.phoneNumber === contactId ||
        agent.phoneNumber.replace(/[^\d]/g, '') === phoneNumber.replace(/[^\d]/g, '')
      )

      setIsContactDeactivated(!!deactivated)
      setDeactivatedAgent(deactivated || null)

      console.log(`🚫 [DEACTIVATION] Status para contato ${contactId}:`, {
        isDeactivated: !!deactivated,
        phoneNumber,
        deactivatedAgent: deactivated
      })
    } catch (error) {
      console.error('Error checking contact deactivation status:', error)
      setIsContactDeactivated(false)
      setDeactivatedAgent(null)
    }
  }

  const handleToggleContactStatus = async () => {
    if (togglingContactStatus) return

    const phoneNumber = contactId.split('@')[0] // Remove @s.whatsapp.net se presente
    const newStatus = !isContactDeactivated

    // Confirmação
    const action = newStatus ? 'desativar a IA' : 'reativar a IA'
    const confirmed = window.confirm(
      `⚠️ Tem certeza que deseja ${action} para este contato?\n\n` +
      `Contato: ${contactName}\n` +
      `Número: ${phoneNumber}\n\n` +
      (newStatus
        ? 'A IA parará de responder às mensagens deste contato.'
        : 'A IA voltará a responder às mensagens deste contato.')
    )

    if (!confirmed) return

    setTogglingContactStatus(true)

    try {
      if (newStatus) {
        // Desativar - criar novo registro
        const newDeactivated = await createDeactivatedAgent({
          configIAId: agentId,
          phoneNumber: phoneNumber,
          reason: `Desativado via interface de chat em ${new Date().toLocaleString('pt-BR')}`,
          blockedBy: 'user'
        })

        if (newDeactivated) {
          setDeactivatedAgent(newDeactivated)
          setIsContactDeactivated(true)
          toast.success(`🚫 IA desativada para ${contactName}`, {
            description: 'O agente não responderá mais às mensagens deste contato'
          })
        }
      } else {
        // Reativar - atualizar registro existente
        if (deactivatedAgent) {
          const updated = await updateDeactivatedAgent(deactivatedAgent.id, { isActive: false })
          if (updated) {
            setDeactivatedAgent(null)
            setIsContactDeactivated(false)
            toast.success(`✅ IA reativada para ${contactName}`, {
              description: 'O agente voltará a responder às mensagens deste contato'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error toggling contact status:', error)
      toast.error('Erro ao alterar status do contato', {
        description: 'Tente novamente em alguns instantes'
      })
    } finally {
      setTogglingContactStatus(false)
    }
  }

  useEffect(() => {
    if (contactId && agentId) {
      console.log(`🔄 [CHAT] Carregando mensagens para contato ${contactId} do agente ${agentId}`)

      // Reset do estado quando muda o contato
      setMessages([])
      setContactName(contactId)
      setContactInfo(null)
      setIsContactDeactivated(false)
      setDeactivatedAgent(null)

      loadMessages()
      checkContactDeactivationStatus()
    }
  }, [contactId, agentId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      // Simular envio de mensagem (seria integrada com Evolution API)
      const messageData = {
        sessionId: `${agentId}_${contactId}`,
        message: newMessage.trim(),
        direction: "sent" as const,
        senderId: contactId,
        senderName: contactName,
        chatId: contactInfo?.chatId || contactId,
        instanceName: "agent-instance",
        messageType: "text",
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isGroup: contactInfo?.isGroup || false,
        isAiResponse: false,
      }

      await myMessagesService.sendMessage(messageData)

      // Recarregar mensagens após enviar
      await loadMessages(true)
      setNewMessage("")

    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleRefresh = () => {
    loadMessages(true)
  }

  const formatMessageTime = (timestamp?: string | null) => {
    if (!timestamp) return ""

    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return format(date, "HH:mm")
    } else {
      return format(date, "dd/MM HH:mm")
    }
  }

  const getMessageStatusIcon = (message: Message) => {
    if (message.direction === "sent") {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando conversa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full overflow-hidden">
      {/* Header do Chat estilo WhatsApp */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar do contato */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                {contactInfo?.isGroup ? (
                  <Users className="h-6 w-6" />
                ) : (
                  <span className="text-sm">
                    {contactName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {contactName}
                </h3>
                {isContactDeactivated && (
                  <BotOff className="h-4 w-4 text-red-500" aria-label="IA desativada para este contato" />
                )}
                {contactInfo?.isGroup && (
                  <Users className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                <span className="truncate">
                  {isContactDeactivated
                    ? "IA desativada"
                    : "online"
                  }
                </span>
                {contactInfo?.instanceName && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Smartphone className="h-3 w-3" />
                      <span className="text-xs font-medium truncate">
                        {contactInfo.instanceName}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar conversa"
              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleContactStatus}
              disabled={togglingContactStatus}
              title={
                togglingContactStatus
                  ? "Alterando status..."
                  : isContactDeactivated
                    ? "Reativar IA para este contato"
                    : "Desativar IA para este contato"
              }
              className={`h-8 w-8 ${isContactDeactivated
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                }`}
            >
              {togglingContactStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isContactDeactivated ? (
                <BotOff className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </Button>

            <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area estilo WhatsApp */}
      <ScrollArea className="flex-1 min-h-3" ref={scrollAreaRef}>
        <div
          className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-opacity='0.03'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {contactInfo?.isGroup ? (
                    <Users className="h-8 w-8 text-gray-400" />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Conversa com {contactName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma mensagem ainda. Envie a primeira mensagem!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.direction === "sent"
                const isAI = message.isAiResponse
                const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId)
                const showName = !isOwn && contactInfo?.isGroup && showAvatar

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="mr-2 mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                          {contactInfo?.isGroup ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <span>
                              {(message.senderName || contactName).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] relative ${isOwn ? "ml-12" : "mr-12"
                        }`}
                    >
                      {showName && (
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-3">
                          {message.senderName || message.senderId}
                        </p>
                      )}

                      <div
                        className={`rounded-lg px-3 py-2 shadow-sm relative ${isOwn
                          ? "bg-green-500 text-white rounded-br-none"
                          : isAI
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700 rounded-bl-none"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                          }`}
                      >
                        {/* Tail da mensagem */}
                        <div
                          className={`absolute bottom-0 w-3 h-3 ${isOwn
                            ? "-right-1 bg-green-500"
                            : isAI
                              ? "-left-1 bg-blue-50 dark:bg-blue-900/30 border-l border-b border-blue-200 dark:border-blue-700"
                              : "-left-1 bg-white dark:bg-gray-700"
                            }`}
                          style={{
                            clipPath: isOwn
                              ? "polygon(0 0, 100% 0, 0 100%)"
                              : "polygon(100% 0, 100% 100%, 0 100%)"
                          }}
                        />

                        {isAI && (
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <Bot className="h-3 w-3 mr-1 text-blue-500" />
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                Assistente IA
                              </span>
                            </div>
                            {message.instanceName && (
                              <div className="flex items-center space-x-1">
                                <Smartphone className="h-3 w-3 text-blue-400" />
                                <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">
                                  {message.instanceName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mostra instância para mensagens normais também (não só IA) */}
                        {!isAI && message.instanceName && (
                          <div className="flex items-center mb-1">
                            <Smartphone className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              via {message.instanceName}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          {/* Mensagem principal */}
                          <p className="text-sm break-words leading-relaxed">
                            {isAI ? message.aiResponse : message.message || message.content}
                          </p>

                          {/* Media content */}
                          {message.mediaType && (
                            <div className="flex items-center space-x-2 mt-2 p-2 rounded bg-black/10">
                              {message.mediaType.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <File className="h-4 w-4" />
                              )}
                              <span className="text-xs">
                                {message.fileName || "Arquivo de mídia"}
                              </span>
                            </div>
                          )}

                          {/* Caption */}
                          {message.caption && (
                            <p className="text-xs opacity-75 italic mt-1">
                              {message.caption}
                            </p>
                          )}
                        </div>

                        {/* Message footer */}
                        <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                          }`}>
                          <span>{formatMessageTime(message.timestamp || message.createdAt)}</span>
                          {isOwn && (
                            <div className="flex items-center space-x-1">
                              {getMessageStatusIcon(message)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isOwn && !showAvatar && <div className="w-10 flex-shrink-0"></div>}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Input Area estilo WhatsApp */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="pr-12 py-3 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-green-500 focus:border-green-500"
              disabled={sending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              😊
            </Button>
          </div>

          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          As mensagens são criptografadas de ponta a ponta e processadas pela IA
        </p>
      </div>
    </div>
  )
}
