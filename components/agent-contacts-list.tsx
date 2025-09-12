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
  Clock
} from "lucide-react"
import { myMessagesService, type Contact } from "@/lib/my-messages-api"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AgentContactsListProps {
  agentId: string
  selectedContactId?: string
  onSelectContact: (contactId: string) => void
}

export function AgentContactsList({
  agentId,
  selectedContactId,
  onSelectContact,
}: AgentContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
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
    <div className="w-80 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">Contatos</h2>
            <p className="text-sm text-muted-foreground">{agentName}</p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Nenhum contato encontrado"
                  : contacts.length === 0
                    ? "Nenhuma conversa encontrada"
                    : "Nenhum contato corresponde à busca"
                }
              </p>
              {contacts.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  As conversas aparecerão aqui quando houver mensagens
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <div key={contact.contactId}>
                  <button
                    onClick={() => {
                      console.log(`👤 [CONTACT-SELECT] Selecionando contato: ${contact.contactId} (${contact.contactName})`)
                      onSelectContact(contact.contactId)
                    }}
                    className={`w-full p-3 rounded-lg text-left hover:bg-muted transition-colors ${
                      selectedContactId === contact.contactId
                        ? "bg-primary/10 border border-primary/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {contact.isGroup ? (
                          <Users className="h-10 w-10 p-2 bg-muted rounded-full" />
                        ) : (
                          <User className="h-10 w-10 p-2 bg-muted rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {contact.contactName}
                          </p>
                          {contact.isGroup && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Grupo
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {contact.lastMessageTime
                            ? formatDistanceToNow(new Date(contact.lastMessageTime), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : "Sem mensagens"
                          }
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          ID: {contact.contactId}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{filteredContacts.length} de {contacts.length} contatos</span>
          {refreshing && (
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Atualizando...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
