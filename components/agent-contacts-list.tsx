"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Users,
  User,
  MessageCircle,
  Loader2,
  RefreshCw,
  Clock,
  CheckCheck,
  Bot,
  Smartphone
} from "lucide-react"
import { myMessagesService, type Contact, type Message } from "@/lib/my-messages-api"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSocket } from "@/lib/socket-context"
import { FixedSizeList as List } from "react-window"
import type { ListChildComponentProps } from "react-window"

interface AgentContactsListProps {
  agentId: string
  selectedContactId?: string
  onSelectContact: (contactId: string) => void
  collapsed?: boolean
}

export function AgentContactsList({
  agentId,
  selectedContactId,
  onSelectContact,
  collapsed = false,
}: AgentContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [lastMessages, setLastMessages] = useState<{ [contactId: string]: Message }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [listHeight, setListHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  // ===================================================
  // WebSocket Integration
  // ===================================================

  const {
    socket,
    joinAgentRoom,
    leaveAgentRoom,
    onNewMessage,
    onContactUpdate,
    isConnected: socketConnected,
    status: socketStatus,
  } = useSocket()

  // Debug WebSocket connection
  useEffect(() => {
    console.log(`🔌 [WEBSOCKET-CONTACTS] Status: ${socketStatus}, Connected: ${socketConnected}`)
  }, [socketStatus, socketConnected])

  // Calculate list height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight
        setListHeight(height)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Join agent room for contact updates
  useEffect(() => {
    if (!socketConnected || !agentId) {
      console.log(`⚠️ [WEBSOCKET-CONTACTS] Não entrando no room. socketConnected: ${socketConnected}, agentId: ${agentId}`)
      return
    }

    console.log(`🚪 [WEBSOCKET-CONTACTS] Entrando no room do agente: agent:${agentId}`)
    joinAgentRoom(agentId)

    return () => {
      console.log(`🚪 [WEBSOCKET-CONTACTS] Saindo do room do agente: agent:${agentId}`)
      leaveAgentRoom(agentId)
    }
  }, [socketConnected, agentId, joinAgentRoom, leaveAgentRoom])

  // Listen for new messages to update last message preview
  useEffect(() => {
    if (!socketConnected) return

    const cleanup = onNewMessage((newMessage) => {
      const contactId = newMessage.direction === "received"
        ? (newMessage.senderId || newMessage.chatId)
        : (newMessage.chatId || newMessage.senderId)

      // Update last message for this contact
      setLastMessages(prev => ({
        ...prev,
        [contactId]: { ...newMessage }
      }))

      // Update contact's last message time and move to top
      setContacts(prev => {
        const contactExists = prev.some(c => c.contactId === contactId)
        if (!contactExists) return prev

        const updatedContacts = prev.map(contact =>
          contact.contactId === contactId
            ? {
                ...contact,
                lastMessageTime: newMessage.timestamp || newMessage.createdAt || new Date().toISOString()
              }
            : contact
        )

        // Sort contacts by last message time (most recent first)
        return updatedContacts.sort((a, b) => {
          const dateA = new Date(a.lastMessageTime || 0).getTime()
          const dateB = new Date(b.lastMessageTime || 0).getTime()
          return dateB - dateA
        })
      })
    })

    return cleanup
  }, [socketConnected, onNewMessage])

  // Update filtered contacts when contacts or search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts([...contacts])
    } else {
      const filtered = contacts.filter(contact =>
        contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.contactId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredContacts(filtered)
    }
  }, [searchTerm, contacts, lastMessages])

  // Listen for contact updates
  useEffect(() => {
    if (!socketConnected) return

    const cleanup = onContactUpdate((updatedContact) => {
      setContacts(prev => {
        const existingIndex = prev.findIndex(c => c.contactId === updatedContact.contactId)

        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], ...updatedContact }
          return updated
        } else {
          return [updatedContact, ...prev]
        }
      })
    })

    return cleanup
  }, [socketConnected, onContactUpdate])

  const loadContacts = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await myMessagesService.getContactsByAgent(agentId)

      if (response.success) {
        const sortedContacts = response.data.sort((a, b) => {
          const dateA = new Date(a.lastMessageTime || 0).getTime()
          const dateB = new Date(b.lastMessageTime || 0).getTime()
          return dateB - dateA
        })

        setContacts(sortedContacts)
        setFilteredContacts(sortedContacts)
        setAgentName(response.metadata.agentName)

        // Buscar última mensagem para cada contato
        const lastMessagesMap: { [contactId: string]: Message } = {}

        await Promise.all(
          response.data.map(async (contact) => {
            try {
              const messagesResponse = await myMessagesService.getMessagesByAgent(agentId, {
                contactId: contact.contactId,
                limit: 1
              })

              if (messagesResponse.success && messagesResponse.data.length > 0) {
                lastMessagesMap[contact.contactId] = messagesResponse.data[0]
              }
            } catch (error) {
              console.warn(`Erro ao buscar última mensagem para ${contact.contactId}:`, error)
            }
          })
        )

        setLastMessages(lastMessagesMap)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (agentId) {
      loadContacts()
    }
  }, [agentId])

  const handleRefresh = () => {
    loadContacts(true)
  }

  // Render individual contact item
  const ContactRow = ({ index, style }: ListChildComponentProps) => {
    const contact = filteredContacts[index]
    const lastMessage = lastMessages[contact.contactId]
    const isSelected = selectedContactId === contact.contactId

    if (collapsed) {
      return (
        <div style={style} className="px-2">
          <button
            onClick={() => onSelectContact(contact.contactId)}
            className={`w-full p-2 flex justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg ${
              isSelected ? "bg-green-50 dark:bg-green-900/20" : "bg-transparent"
            }`}
            title={contact.contactName}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                {contact.isGroup ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <span>{contact.contactName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              {lastMessage && lastMessage.direction === "received" && !lastMessage.isAiResponse && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
              )}
            </div>
          </button>
        </div>
      )
    }

    return (
      <div style={style} className="px-3">
        <button
          onClick={() => onSelectContact(contact.contactId)}
          className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg ${
            isSelected ? "bg-green-50 dark:bg-green-900/20" : "bg-transparent"
          }`}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-base">
                {contact.isGroup ? (
                  <Users className="h-6 w-6" />
                ) : (
                  <span>{contact.contactName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header: Name and Time */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {contact.contactName}
                  </h3>
                  {contact.isGroup && (
                    <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                  {contact.lastMessageTime
                    ? formatDistanceToNow(new Date(contact.lastMessageTime), {
                        addSuffix: false,
                        locale: ptBR,
                      }).replace('aproximadamente ', '').replace('cerca de ', '')
                    : ""}
                </span>
              </div>

              {/* Message Preview */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  {lastMessage && (
                    <>
                      {lastMessage.direction === "sent" && (
                        <CheckCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      )}
                      {lastMessage.isAiResponse && (
                        <Bot className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {lastMessage
                      ? lastMessage.isAiResponse
                        ? lastMessage.aiResponse || "Resposta da IA"
                        : lastMessage.message || lastMessage.content || "Mensagem"
                      : "Nenhuma mensagem"}
                  </p>
                </div>
                {lastMessage && lastMessage.direction === "received" && !lastMessage.isAiResponse && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar lista"
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      socketStatus === 'connected' ? 'bg-green-500' :
                      socketStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                      'bg-red-500'
                    }`}
                    title={`WebSocket: ${socketStatus}`}
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                    Conversas
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{agentName}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Atualizar lista"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </>
        )}
      </div>

      {/* Virtualized Contact List */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {searchTerm ? "Nenhum contato encontrado" : "Nenhuma conversa ainda"}
            </p>
          </div>
        ) : (
          <List
            height={listHeight}
            itemCount={filteredContacts.length}
            itemSize={collapsed ? 64 : 76}
            width="100%"
            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          >
            {ContactRow}
          </List>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredContacts.length} {filteredContacts.length === 1 ? 'conversa' : 'conversas'}
          </p>
        </div>
      )}
    </div>
  )
}
