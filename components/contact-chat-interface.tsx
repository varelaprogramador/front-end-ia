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
  BotOff
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
          })
        } else {
          // Se não há mensagens, usar o contactId como nome
          setContactName(contactId)
          setContactInfo({
            isGroup: false,
            chatId: contactId,
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
    <div className="flex-1 flex flex-col">
      {/* Header do Chat */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {contactInfo?.isGroup ? (
                <Users className="h-10 w-10 p-2 bg-muted rounded-full" />
              ) : (
                <User className="h-10 w-10 p-2 bg-muted rounded-full" />
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{contactName}</h3>
                {isContactDeactivated && (
                  <BotOff className="h-4 w-4 text-destructive" title="IA desativada para este contato" />
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>ID: {contactId}</span>
                {contactInfo?.isGroup && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="text-xs">Grupo</Badge>
                  </>
                )}
                {isContactDeactivated && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <span className="text-destructive text-xs font-medium">IA Desativada</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar conversa"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Botão para toggle da IA para este contato */}
            <Button
              variant={isContactDeactivated ? "destructive" : "default"}
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
            >
              {togglingContactStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isContactDeactivated ? (
                <BotOff className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" disabled>
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled>
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {contactInfo?.isGroup ? (
                  <Users className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold mb-2">Conversa com {contactName}</h3>
              <p className="text-sm text-muted-foreground">
                Nenhuma mensagem ainda. Envie a primeira mensagem!
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.direction === "sent"
              const isAI = message.isAiResponse
              const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId)
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
                >
                  {!isOwn && showAvatar && (
                    <div className="mr-2 mt-1">
                      {contactInfo?.isGroup ? (
                        <Users className="h-8 w-8 p-1.5 bg-muted rounded-full" />
                      ) : (
                        <User className="h-8 w-8 p-1.5 bg-muted rounded-full" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : isAI
                          ? "bg-green-100 text-green-900 border border-green-200"
                          : "bg-muted"
                    }`}
                  >
                    {!isOwn && contactInfo?.isGroup && showAvatar && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.senderName || message.senderId}
                      </p>
                    )}
                    
                    {isAI && (
                      <div className="flex items-center mb-1">
                        <Badge variant="secondary" className="text-xs mr-2">
                          IA
                        </Badge>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {/* Mensagem principal */}
                      <p className="text-sm break-words">
                        {isAI ? message.aiResponse : message.message || message.content}
                      </p>
                      
                      {/* Media content */}
                      {message.mediaType && (
                        <div className="flex items-center space-x-2">
                          {message.mediaType.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <File className="h-4 w-4" />
                          )}
                          <span className="text-xs opacity-75">
                            {message.fileName || "Mídia"}
                          </span>
                        </div>
                      )}
                      
                      {/* Caption */}
                      {message.caption && (
                        <p className="text-xs opacity-75 italic">
                          {message.caption}
                        </p>
                      )}
                    </div>
                    
                    {/* Message footer */}
                    <div className={`flex items-center justify-between mt-2 text-xs ${
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      <span>{formatMessageTime(message.timestamp || message.createdAt)}</span>
                      <div className="flex items-center space-x-1">
                        {message.status && (
                          <span className="text-xs opacity-75">{message.status}</span>
                        )}
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                  
                  {!isOwn && !showAvatar && <div className="w-10"></div>}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-2">
          Pressione Enter para enviar. As mensagens serão processadas pelo agente.
        </p>
      </div>
    </div>
  )
}
