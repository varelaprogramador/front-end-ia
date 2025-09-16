"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  const loadContacts = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await myMessagesService.getContactsByAgent(agentId)

      if (response.success) {
        setContacts(response.data)
        setFilteredContacts(response.data)
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
        console.log(`📋 [CONTACTS] Carregados ${response.data.length} contatos para agente ${response.metadata.agentName}`)
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

  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(contacts)
    } else {
      const filtered = contacts.filter(contact =>
        contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.contactId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredContacts(filtered)
    }
  }, [searchTerm, contacts])

  const handleRefresh = () => {
    loadContacts(true)
  }

  if (loading) {
    return (
      <div className="w-80 border-r bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 flex flex-col h-full border-r border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Header estilo WhatsApp */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {collapsed ? (
          // Header colapsado - apenas avatar e botão refresh
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
              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        ) : (
          // Header expandido - layout normal
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-medium text-lg text-gray-900 dark:text-gray-100">Chats</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{agentName}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Atualizar lista"
                className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                className="pl-10 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm"
              />
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-0 min-w-0">
          {filteredContacts.length === 0 ? (
            <div className={`text-center py-12 ${collapsed ? 'px-2' : 'px-4'}`}>
              <MessageCircle className={`${collapsed ? 'h-6 w-6' : 'h-12 w-12'} text-gray-400 mx-auto mb-3`} />
              {!collapsed && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? "Nenhum contato encontrado"
                      : contacts.length === 0
                        ? "Nenhuma conversa encontrada"
                        : "Nenhum contato corresponde à busca"
                    }
                  </p>
                  {contacts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      As conversas aparecerão aqui quando houver mensagens
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden max-w-full">
              {filteredContacts.map((contact) => (
                <div key={contact.contactId} className="min-w-0">
                  <button
                    onClick={() => {
                      console.log(`👤 [CONTACT-SELECT] Selecionando contato: ${contact.contactId} (${contact.contactName})`)
                      onSelectContact(contact.contactId)
                    }}
                    className={`w-full ${collapsed ? 'p-2' : 'p-4'} text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-none focus:outline-none overflow-hidden ${selectedContactId === contact.contactId
                      ? "bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500"
                      : "bg-white dark:bg-gray-900"
                      }`}
                    title={collapsed ? contact.contactName : undefined}
                  >
                    {collapsed ? (
                      // Layout colapsado - apenas avatar
                      <div className="flex justify-center">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                            {contact.isGroup ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              <span>
                                {contact.contactName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {/* Status online indicator */}
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
                          {/* Badge de mensagens não lidas */}
                          {lastMessages[contact.contactId] && lastMessages[contact.contactId].direction === "received" && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">1</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Layout expandido - layout normal
                      <div className="flex items-center space-x-3 max-w-[85%] overflow-hidden">
                        {/* Avatar estilo WhatsApp */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
                            {contact.isGroup ? (
                              <Users className="h-6 w-6" />
                            ) : (
                              <span>
                                {contact.contactName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {/* Status online indicator */}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          {/* Nome e timestamp */}
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm flex-1 min-w-0">
                              {contact.contactName}
                            </h3>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {contact.isGroup && (
                                <Users className="h-3 w-3 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {contact.lastMessageTime
                                  ? formatDistanceToNow(new Date(contact.lastMessageTime), {
                                    addSuffix: false,
                                    locale: ptBR,
                                  }).replace('aproximadamente ', '').replace('cerca de ', '')
                                  : ""}
                              </span>
                            </div>
                          </div>

                          {/* Prévia da última mensagem */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                              {lastMessages[contact.contactId] && (
                                <>
                                  {/* Indicador de direção da mensagem */}
                                  {lastMessages[contact.contactId].direction === "sent" && (
                                    <CheckCheck className="h-3 w-3 text-blue-500 mr-1 flex-shrink-0" />
                                  )}
                                  {lastMessages[contact.contactId].isAiResponse && (
                                    <Bot className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                  )}
                                </>
                              )}
                              <div className="flex items-center space-x-1 flex-1 min-w-0 overflow-hidden">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
                                  {lastMessages[contact.contactId]
                                    ? lastMessages[contact.contactId].isAiResponse
                                      ? lastMessages[contact.contactId].aiResponse?.substring(0, 30) + "..."
                                      : (lastMessages[contact.contactId].message || lastMessages[contact.contactId].content)?.substring(0, 30) + "..."
                                    : contact.lastMessageTime
                                      ? "Última mensagem..."
                                      : "Nenhuma mensagem ainda"
                                  }
                                </p>
                                {lastMessages[contact.contactId]?.instanceName && (
                                  <div className="flex items-center space-x-1 flex-shrink-0 max-w-[80px]">
                                    <span className="text-gray-400">•</span>
                                    <Smartphone className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                                      {lastMessages[contact.contactId].instanceName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Badge de mensagens não lidas */}
                            {lastMessages[contact.contactId] && lastMessages[contact.contactId].direction === "received" && (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-medium">1</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer com contador */}
      {!collapsed && (
        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>{filteredContacts.length} de {contacts.length} conversas</span>
            {refreshing && (
              <span className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Atualizando...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
