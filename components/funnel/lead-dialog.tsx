"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, X, Plus, Search, MessageSquare, User, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { funnelService, type FunnelLead, type FunnelStage, type WhatsAppChat } from "@/lib/funnel-api"

const leadSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  value: z.number().min(0).optional(),
  notes: z.string().optional(),
  contexto: z.string().optional(),
  source: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  stageId: z.string().min(1, "Estágio obrigatório"),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: FunnelLead | null
  stages: FunnelStage[]
  defaultStageId?: string
  evolutionInstanceId?: string // ID da instância Evolution para buscar contatos
  onSave: (data: LeadFormData & { tags: string[]; whatsappJid?: string; whatsappProfileName?: string; whatsappProfilePic?: string; evolutionInstanceId?: string }) => Promise<void>
}

export function LeadDialog({
  open,
  onOpenChange,
  lead,
  stages,
  defaultStageId,
  evolutionInstanceId,
  onSave,
}: LeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // WhatsApp contact search state
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [searchingChats, setSearchingChats] = useState(false)
  const [whatsappChats, setWhatsappChats] = useState<WhatsAppChat[]>([])
  const [selectedContact, setSelectedContact] = useState<WhatsAppChat | null>(null)
  const [chatSearchTerm, setChatSearchTerm] = useState("")

  // Auto-suggest contacts based on phone input
  const [suggestedContacts, setSuggestedContacts] = useState<WhatsAppChat[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [phoneValue, setPhoneValue] = useState("")

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      value: 0,
      notes: "",
      contexto: "",
      source: "",
      priority: "medium",
      stageId: defaultStageId || "",
    },
  })

  // Search error message
  const [searchError, setSearchError] = useState<string | null>(null)

  // Search WhatsApp contacts using Evolution API findContacts
  const searchWhatsAppContacts = useCallback(async (searchTerm: string) => {
    if (!evolutionInstanceId || searchTerm.length < 2) {
      setWhatsappChats([])
      setSearchError(null)
      return
    }

    setSearchingChats(true)
    setSearchError(null)
    try {
      const response = await funnelService.getEvolutionContacts(evolutionInstanceId, searchTerm)
      if (response.success && response.data) {
        // Convert contacts to WhatsAppChat format for consistency
        const chats: WhatsAppChat[] = response.data.map((contact) => ({
          id: contact.id,
          remoteJid: contact.remoteJid,
          pushName: contact.pushName,
          profilePictureUrl: contact.profilePictureUrl,
          phoneNumber: contact.phoneNumber,
          unreadCount: 0,
        }))
        setWhatsappChats(chats)
      } else if (!response.success) {
        setSearchError("Erro ao buscar contatos. Verifique se a Evolution API está online.")
      }
    } catch (error) {
      console.error("Error searching WhatsApp contacts:", error)
      setWhatsappChats([])
      setSearchError("Evolution API indisponível. Tente novamente mais tarde.")
    } finally {
      setSearchingChats(false)
    }
  }, [evolutionInstanceId])

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (chatSearchTerm.length >= 2 && evolutionInstanceId) {
      const timer = setTimeout(() => {
        searchWhatsAppContacts(chatSearchTerm)
      }, 300) // 300ms debounce
      return () => clearTimeout(timer)
    } else {
      setWhatsappChats([])
    }
  }, [chatSearchTerm, evolutionInstanceId, searchWhatsAppContacts])

  useEffect(() => {
    if (open) {
      if (lead) {
        reset({
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          value: lead.value || 0,
          notes: lead.notes || "",
          contexto: lead.contexto || "",
          source: lead.source || "",
          priority: lead.priority,
          stageId: lead.stageId,
        })
        setTags(lead.tags || [])
        // Set selected contact if lead has WhatsApp linked
        if (lead.whatsappJid) {
          setSelectedContact({
            id: lead.whatsappJid,
            remoteJid: lead.whatsappJid,
            pushName: lead.whatsappProfileName || lead.name,
            profilePictureUrl: lead.whatsappProfilePic || undefined,
            phoneNumber: lead.whatsappJid.replace("@s.whatsapp.net", ""),
            unreadCount: 0,
          })
          setActiveTab("whatsapp")
        }
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          value: 0,
          notes: "",
          contexto: "",
          source: "",
          priority: "medium",
          stageId: defaultStageId || stages[0]?.id || "",
        })
        setTags([])
        setSelectedContact(null)
        setActiveTab(evolutionInstanceId ? "whatsapp" : "manual")
      }

      // Reset phone suggestions and search
      setSuggestedContacts([])
      setShowSuggestions(false)
      setPhoneValue("")
      setChatSearchTerm("")
      setWhatsappChats([])
    }
  }, [open, lead, reset, defaultStageId, stages, evolutionInstanceId])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSelectContact = (contact: WhatsAppChat) => {
    setSelectedContact(contact)
    // Auto-fill form with contact info
    reset({
      name: contact.pushName || "Sem nome",
      phone: contact.phoneNumber,
      email: "",
      value: 0,
      notes: "",
      source: "WhatsApp",
      priority: "medium",
      stageId: defaultStageId || stages[0]?.id || "",
    })
  }

  const handleClearContact = () => {
    setSelectedContact(null)
  }

  // Search for matching contacts when phone number changes
  const handlePhoneChange = useCallback(async (phone: string, fieldOnChange: (value: string) => void) => {
    fieldOnChange(phone)
    setPhoneValue(phone)

    // Only search if we have at least 4 digits and Evolution instance is configured
    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length >= 4 && evolutionInstanceId) {
      try {
        const response = await funnelService.getEvolutionContacts(evolutionInstanceId, cleanPhone)
        if (response.success && response.data && response.data.length > 0) {
          const matches: WhatsAppChat[] = response.data.slice(0, 5).map((contact) => ({
            id: contact.id,
            remoteJid: contact.remoteJid,
            pushName: contact.pushName,
            profilePictureUrl: contact.profilePictureUrl,
            phoneNumber: contact.phoneNumber,
            unreadCount: 0,
          }))
          setSuggestedContacts(matches)
          setShowSuggestions(true)
        } else {
          setSuggestedContacts([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error("Error searching contacts by phone:", error)
        setSuggestedContacts([])
        setShowSuggestions(false)
      }
    } else {
      setSuggestedContacts([])
      setShowSuggestions(false)
    }
  }, [evolutionInstanceId])

  // Select suggested contact
  const handleSelectSuggestion = (contact: WhatsAppChat) => {
    setSelectedContact(contact)
    setShowSuggestions(false)
    setSuggestedContacts([])
    // Update form with contact info
    reset({
      name: contact.pushName || "Sem nome",
      phone: contact.phoneNumber,
      email: "",
      value: 0,
      notes: "",
      source: "WhatsApp",
      priority: "medium",
      stageId: defaultStageId || stages[0]?.id || "",
    })
  }

  const onSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true)
      await onSave({
        ...data,
        tags,
        whatsappJid: selectedContact?.remoteJid,
        whatsappProfileName: selectedContact?.pushName,
        whatsappProfilePic: selectedContact?.profilePictureUrl,
        evolutionInstanceId: selectedContact ? evolutionInstanceId : undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving lead:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter out fixed stages for new leads (but allow for editing)
  const availableStages = lead
    ? stages
    : stages.filter((s) => !s.isFixed)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>



        {/* Show selected WhatsApp contact info when editing */}
        {lead && lead.whatsappJid && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={lead.whatsappProfilePic} />
              <AvatarFallback className="bg-green-500 text-white">
                {lead.whatsappProfileName?.charAt(0) || lead.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                Vinculado ao WhatsApp
              </p>
              <p className="text-sm text-muted-foreground">
                {lead.whatsappJid.replace("@s.whatsapp.net", "")}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder="Nome do lead"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* WhatsApp Contact Search - Quick select from contacts */}
            {evolutionInstanceId && !selectedContact && (
              <div className="col-span-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  Vincular Contato WhatsApp
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contato por nome ou telefone..."
                    className="pl-9"
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {/* Contact search dropdown */}
                  {chatSearchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                      {searchingChats ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Buscando na Evolution API...</span>
                        </div>
                      ) : whatsappChats.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          {searchError ? (
                            <span className="text-destructive">{searchError}</span>
                          ) : (
                            "Nenhum contato encontrado"
                          )}
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[200px]">
                          {whatsappChats.slice(0, 10).map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              className="w-full flex items-center gap-3 p-2 hover:bg-accent transition-colors text-left bg-zinc-800 hover:text-green-500"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleSelectSuggestion(contact)
                                setChatSearchTerm("")
                              }}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={contact.profilePictureUrl} />
                                <AvatarFallback className="bg-green-500 text-white  text-xs">
                                  {contact.pushName?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 ">
                                <p className="text-sm font-medium truncate">{contact.pushName || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                              </div>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300 hover:bg-green-500 hover:text-white">
                                Selecionar
                              </Badge>
                            </button>
                          ))}
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite pelo menos 2 caracteres para buscar
                </p>
                {searchError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full"></span>
                    {searchError}
                  </p>
                )}
              </div>
            )}

            {/* Show selected WhatsApp contact */}
            {selectedContact && (
              <div className="col-span-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  Contato WhatsApp Vinculado
                </Label>
                <div className="flex items-center gap-3 p-3 mt-1 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedContact.profilePictureUrl} />
                    <AvatarFallback className="bg-green-500 text-white">
                      {selectedContact.pushName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedContact.pushName || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedContact.phoneNumber}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearContact}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            )}

            <div className="relative">
              <Label htmlFor="phone">Telefone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="+55 11 99999-9999"
                      value={field.value || ""}
                      onChange={(e) => handlePhoneChange(e.target.value, field.onChange)}
                      onBlur={() => {
                        field.onBlur()
                        // Delay hiding suggestions to allow click
                        setTimeout(() => setShowSuggestions(false), 200)
                      }}
                      onFocus={() => {
                        if (suggestedContacts.length > 0) setShowSuggestions(true)
                      }}
                    />
                    {/* WhatsApp contact suggestions dropdown */}
                    {showSuggestions && suggestedContacts.length > 0 && !selectedContact && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                        <div className="p-2 border-b">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-green-500" />
                            Contatos encontrados no WhatsApp
                          </p>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {suggestedContacts.map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              className="w-full flex items-center gap-3 p-2 hover:bg-accent transition-colors text-left"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleSelectSuggestion(contact)
                              }}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={contact.profilePictureUrl} />
                                <AvatarFallback className="bg-green-500 text-white text-xs">
                                  {contact.pushName?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{contact.pushName || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                              </div>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                Vincular
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            <div>
              <Label htmlFor="value">Valor (R$)</Label>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="source">Origem</Label>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Input
                    id="source"
                    placeholder="WhatsApp, Site, etc"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="stageId">Estágio *</Label>
              <Controller
                name="stageId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stageId && (
                <p className="text-sm text-destructive mt-1">{errors.stageId.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Digite uma tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="notes"
                    placeholder="Anotações sobre o lead..."
                    rows={3}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="contexto">Contexto para Follow-up (IA)</Label>
              <Controller
                name="contexto"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="contexto"
                    placeholder="Informações de contexto que ajudarão a IA a personalizar as mensagens de follow-up (ex: interesses, produtos discutidos, objeções, etc.)"
                    rows={3}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este campo será usado pela IA para gerar mensagens de follow-up mais personalizadas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {lead ? "Salvar" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
