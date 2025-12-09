import { API_BASE_URL } from './api-config'

// ========================================
// TYPES
// ========================================

// API Response type following backend format
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data: T
}

export interface FunnelStage {
  id: string
  funnelId: string
  name: string
  color: string
  order: number
  isFixed: boolean
  fixedType?: 'won' | 'lost' | null
  createdAt: string
  updatedAt: string
  leads?: FunnelLead[]
}

export interface FunnelLead {
  id: string
  funnelId: string
  stageId: string
  name: string
  email?: string
  phone?: string
  value?: number
  notes?: string
  tags: string[]
  source?: string
  assignedTo?: string
  priority: 'low' | 'medium' | 'high'
  expectedCloseDate?: string
  lastContactAt?: string
  isInFollowUpFlow?: boolean // Se está no fluxo de follow-up (removido do Kanban principal)
  // Integração com WhatsApp
  whatsappJid?: string // JID do contato no WhatsApp
  whatsappProfileName?: string // Nome do perfil no WhatsApp
  whatsappProfilePic?: string // URL da foto do perfil
  evolutionInstanceId?: string // ID da instância Evolution vinculada
  order: number
  createdAt: string
  updatedAt: string
  stage?: FunnelStage
  _count?: { followUps: number }
}

// ========================================
// EVOLUTION API INTEGRATION TYPES
// ========================================

export interface WhatsAppContact {
  id: string
  remoteJid: string
  pushName: string
  profilePictureUrl?: string
  phoneNumber: string
}

export interface WhatsAppChat {
  id: string
  remoteJid: string
  pushName: string
  profilePictureUrl?: string
  phoneNumber: string
  lastMessageAt?: string
  unreadCount: number
}

export interface WhatsAppMessage {
  id: string
  remoteJid?: string
  fromMe: boolean
  pushName?: string
  message: string
  messageType: string
  timestamp: string
  status?: string
  sender?: string
}

export interface WhatsAppHistoryResponse {
  lead: {
    id: string
    name: string
    whatsappJid: string
  }
  messages: WhatsAppMessage[]
  total: number
  conversationContext: string // Ready for AI consumption
}

export interface FollowUpAgent {
  id: string
  funnelId: string
  name: string
  isActive: boolean
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  followUpPrompt?: string
  autoFollowUp: boolean
  followUpDelayHours: number
  maxFollowUps: number
  workingHoursStart?: string
  workingHoursEnd?: string
  workingDays: number[]
  timezone: string
  evolutionInstanceId?: string
  openaiApiKey?: string
  credentialId?: string
  createdAt: string
  updatedAt: string
  followUpHistory?: FollowUpHistory[]
}

export interface FollowUpHistory {
  id: string
  leadId: string
  agentId: string
  message: string
  response?: string
  channel: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'responded' | 'failed'
  sentAt: string
  deliveredAt?: string
  readAt?: string
  respondedAt?: string
  aiModel?: string
  promptUsed?: string
  tokensUsed?: number
  createdAt: string
  lead?: { name: string; phone?: string; email?: string }
}

// ========================================
// FOLLOW-UP FLOW TYPES
// ========================================

export interface FollowUpFlowStep {
  id: string
  funnelId: string
  name: string
  order: number
  delayDays: number
  delayHours: number
  messageTemplate?: string
  isAutomatic: boolean
  color: string
  type: 'followup' | 'won' | 'lost'
  createdAt: string
  updatedAt: string
}

export interface LeadInFollowUpFlow {
  id: string
  leadId: string
  funnelId: string
  currentStepId: string
  nextFollowUpAt?: string
  followUpCount: number
  status: 'active' | 'paused' | 'completed' | 'lost'
  enteredAt: string
  lastFollowUpAt?: string
  createdAt: string
  updatedAt: string
  lead: FunnelLead
  currentStep?: FollowUpFlowStep
}

export interface CreateFollowUpStepRequest {
  name: string
  order: number
  delayDays: number
  delayHours: number
  messageTemplate?: string
  isAutomatic?: boolean
  color?: string
  type?: 'followup' | 'won' | 'lost'
}

export interface UpdateFollowUpStepRequest {
  name?: string
  order?: number
  delayDays?: number
  delayHours?: number
  messageTemplate?: string
  isAutomatic?: boolean
  color?: string
}

export interface AddLeadToFlowRequest {
  leadId: string
  stepId?: string
}

export interface MoveLeadInFlowRequest {
  stepId: string
}

// Histórico de contatos no fluxo
export interface FollowUpFlowContact {
  id: string
  leadId: string
  leadFlowId: string
  stepId: string
  contactType: 'message' | 'call' | 'email' | 'whatsapp' | 'manual'
  message?: string
  response?: string
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed'
  isAutomatic: boolean
  outcome?: 'positive' | 'negative' | 'neutral' | 'no_response'
  notes?: string
  contactedAt: string
  respondedAt?: string
  createdAt: string
  step?: { name: string; color: string }
}

export interface CreateContactRequest {
  contactType?: 'message' | 'call' | 'email' | 'whatsapp' | 'manual'
  message?: string
  response?: string
  status?: 'sent' | 'delivered' | 'read' | 'replied' | 'failed'
  isAutomatic?: boolean
  outcome?: 'positive' | 'negative' | 'neutral' | 'no_response'
  notes?: string
  moveToNextStep?: boolean
}

export interface UpdateContactRequest {
  response?: string
  status?: string
  outcome?: string
  notes?: string
}

export interface Funnel {
  id: string
  userId: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Vinculação com Agente/Workspace
  configIaId?: string | null
  configIa?: { id: string; nome: string; status: string } | null
  stages?: FunnelStage[]
  leads?: FunnelLead[]
  followUpAgent?: FollowUpAgent | { id: string; isActive: boolean; name: string }
  _count?: { leads: number }
  stats?: {
    totalLeads: number
    totalValue: number
    wonLeads: number
    lostLeads: number
  }
}

export interface CreateFunnelRequest {
  userId: string
  name: string
  description?: string
  isActive?: boolean
  configIaId?: string | null // Vinculação com Agente/Workspace
}

export interface UpdateFunnelRequest {
  name?: string
  description?: string
  isActive?: boolean
  configIaId?: string | null // Vinculação com Agente/Workspace
}

export interface CreateStageRequest {
  name: string
  color?: string
  order: number
}

export interface UpdateStageRequest {
  name?: string
  color?: string
  order?: number
}

export interface CreateLeadRequest {
  stageId: string
  name: string
  email?: string
  phone?: string
  value?: number
  notes?: string
  tags?: string[]
  source?: string
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high'
  expectedCloseDate?: string
  order?: number
  // Integração com WhatsApp
  whatsappJid?: string
  whatsappProfileName?: string
  whatsappProfilePic?: string
  evolutionInstanceId?: string
}

export interface UpdateLeadRequest {
  stageId?: string
  name?: string
  email?: string
  phone?: string
  value?: number
  notes?: string
  tags?: string[]
  source?: string
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high'
  expectedCloseDate?: string
  order?: number
}

export interface MoveLeadRequest {
  stageId: string
  order: number
}

export interface CreateFollowUpAgentRequest {
  name?: string
  isActive?: boolean
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt: string
  followUpPrompt?: string
  autoFollowUp?: boolean
  followUpDelayHours?: number
  maxFollowUps?: number
  workingHoursStart?: string
  workingHoursEnd?: string
  workingDays?: number[]
  timezone?: string
  evolutionInstanceId?: string
  openaiApiKey?: string
  credentialId?: string
}

// ========================================
// SERVICE
// ========================================

class FunnelService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/funnel`
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      console.log('[Funnel API] Request:', { method: options.method || 'GET', url })

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Funnel API] Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseText = await response.text()
      if (!responseText.trim()) {
        return { success: true, data: null as T }
      }

      return JSON.parse(responseText)
    } catch (error) {
      console.error('[Funnel API] Request failed:', error)
      throw error
    }
  }

  // ========================================
  // FUNNEL ENDPOINTS
  // ========================================

  async getFunnels(params?: { page?: number; limit?: number; userId?: string; search?: string; isActive?: boolean }): Promise<ApiResponse<{ funnels: Funnel[]; pagination: any }>> {
    const queryString = new URLSearchParams()
    if (params?.page) queryString.append('page', params.page.toString())
    if (params?.limit) queryString.append('limit', params.limit.toString())
    if (params?.userId) queryString.append('userId', params.userId)
    if (params?.search) queryString.append('search', params.search)
    if (params?.isActive !== undefined) queryString.append('isActive', params.isActive.toString())

    const endpoint = queryString.toString() ? `?${queryString.toString()}` : ''
    return this.makeRequest<{ funnels: Funnel[]; pagination: any }>(endpoint)
  }

  async getFunnelsByUser(userId: string): Promise<ApiResponse<Funnel[]>> {
    return this.makeRequest<Funnel[]>(`/user/${userId}`)
  }

  async getFunnelById(id: string): Promise<ApiResponse<Funnel>> {
    return this.makeRequest<Funnel>(`/${id}`)
  }

  async createFunnel(data: CreateFunnelRequest): Promise<ApiResponse<Funnel>> {
    return this.makeRequest<Funnel>('', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFunnel(id: string, data: UpdateFunnelRequest): Promise<ApiResponse<Funnel>> {
    return this.makeRequest<Funnel>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteFunnel(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/${id}`, {
      method: 'DELETE',
    })
  }

  // ========================================
  // STAGE ENDPOINTS
  // ========================================

  async createStage(funnelId: string, data: CreateStageRequest): Promise<ApiResponse<FunnelStage>> {
    return this.makeRequest<FunnelStage>(`/${funnelId}/stage`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateStage(stageId: string, data: UpdateStageRequest): Promise<ApiResponse<FunnelStage>> {
    return this.makeRequest<FunnelStage>(`/stage/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteStage(stageId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/stage/${stageId}`, {
      method: 'DELETE',
    })
  }

  async reorderStages(funnelId: string, stages: { id: string; order: number }[]): Promise<ApiResponse<FunnelStage[]>> {
    return this.makeRequest<FunnelStage[]>(`/${funnelId}/stages/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ stages }),
    })
  }

  // ========================================
  // LEAD ENDPOINTS
  // ========================================

  async createLead(funnelId: string, data: CreateLeadRequest): Promise<ApiResponse<FunnelLead>> {
    return this.makeRequest<FunnelLead>(`/${funnelId}/lead`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLead(leadId: string, data: UpdateLeadRequest): Promise<ApiResponse<FunnelLead>> {
    return this.makeRequest<FunnelLead>(`/lead/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async moveLead(leadId: string, data: MoveLeadRequest): Promise<ApiResponse<FunnelLead>> {
    return this.makeRequest<FunnelLead>(`/lead/${leadId}/move`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteLead(leadId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/lead/${leadId}`, {
      method: 'DELETE',
    })
  }

  // ========================================
  // FOLLOW-UP AGENT ENDPOINTS
  // ========================================

  async getFollowUpAgent(funnelId: string): Promise<ApiResponse<FollowUpAgent | null>> {
    return this.makeRequest<FollowUpAgent | null>(`/${funnelId}/follow-up-agent`)
  }

  async saveFollowUpAgent(funnelId: string, data: CreateFollowUpAgentRequest): Promise<ApiResponse<FollowUpAgent>> {
    return this.makeRequest<FollowUpAgent>(`/${funnelId}/follow-up-agent`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async toggleFollowUpAgent(funnelId: string): Promise<ApiResponse<FollowUpAgent>> {
    return this.makeRequest<FollowUpAgent>(`/${funnelId}/follow-up-agent/toggle`, {
      method: 'PATCH',
    })
  }

  async sendFollowUp(leadId: string, message?: string): Promise<ApiResponse<FollowUpHistory>> {
    return this.makeRequest<FollowUpHistory>(`/lead/${leadId}/send-follow-up`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }

  async getFollowUpHistory(funnelId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ history: FollowUpHistory[]; pagination: any }>> {
    const queryString = new URLSearchParams()
    if (params?.page) queryString.append('page', params.page.toString())
    if (params?.limit) queryString.append('limit', params.limit.toString())

    const endpoint = `/${funnelId}/follow-up-history${queryString.toString() ? `?${queryString.toString()}` : ''}`
    return this.makeRequest<{ history: FollowUpHistory[]; pagination: any }>(endpoint)
  }

  // ========================================
  // FOLLOW-UP FLOW ENDPOINTS
  // ========================================

  async getFollowUpFlowSteps(funnelId: string): Promise<ApiResponse<FollowUpFlowStep[]>> {
    return this.makeRequest<FollowUpFlowStep[]>(`/${funnelId}/follow-up-flow/steps`)
  }

  async createFollowUpFlowStep(funnelId: string, data: CreateFollowUpStepRequest): Promise<ApiResponse<FollowUpFlowStep>> {
    return this.makeRequest<FollowUpFlowStep>(`/${funnelId}/follow-up-flow/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFollowUpFlowStep(stepId: string, data: UpdateFollowUpStepRequest): Promise<ApiResponse<FollowUpFlowStep>> {
    return this.makeRequest<FollowUpFlowStep>(`/follow-up-flow/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteFollowUpFlowStep(stepId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/follow-up-flow/steps/${stepId}`, {
      method: 'DELETE',
    })
  }

  async getLeadsInFlow(funnelId: string): Promise<ApiResponse<LeadInFollowUpFlow[]>> {
    return this.makeRequest<LeadInFollowUpFlow[]>(`/${funnelId}/follow-up-flow/leads`)
  }

  async addLeadToFlow(funnelId: string, data: AddLeadToFlowRequest): Promise<ApiResponse<LeadInFollowUpFlow>> {
    return this.makeRequest<LeadInFollowUpFlow>(`/${funnelId}/follow-up-flow/leads`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async moveLeadInFlow(leadFlowId: string, data: MoveLeadInFlowRequest): Promise<ApiResponse<LeadInFollowUpFlow>> {
    return this.makeRequest<LeadInFollowUpFlow>(`/follow-up-flow/leads/${leadFlowId}/move`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async pauseResumeLeadInFlow(leadFlowId: string): Promise<ApiResponse<LeadInFollowUpFlow>> {
    return this.makeRequest<LeadInFollowUpFlow>(`/follow-up-flow/leads/${leadFlowId}/toggle-pause`, {
      method: 'PATCH',
    })
  }

  async removeLeadFromFlow(leadFlowId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/follow-up-flow/leads/${leadFlowId}`, {
      method: 'DELETE',
    })
  }

  async sendFollowUpInFlow(leadFlowId: string): Promise<ApiResponse<FollowUpHistory>> {
    return this.makeRequest<FollowUpHistory>(`/follow-up-flow/leads/${leadFlowId}/send`, {
      method: 'POST',
    })
  }

  async markLeadAsWonInFlow(leadFlowId: string): Promise<ApiResponse<LeadInFollowUpFlow>> {
    return this.makeRequest<LeadInFollowUpFlow>(`/follow-up-flow/leads/${leadFlowId}/won`, {
      method: 'PATCH',
    })
  }

  async markLeadAsLostInFlow(leadFlowId: string): Promise<ApiResponse<LeadInFollowUpFlow>> {
    return this.makeRequest<LeadInFollowUpFlow>(`/follow-up-flow/leads/${leadFlowId}/lost`, {
      method: 'PATCH',
    })
  }

  async initializeDefaultFlowSteps(funnelId: string): Promise<ApiResponse<FollowUpFlowStep[]>> {
    return this.makeRequest<FollowUpFlowStep[]>(`/${funnelId}/follow-up-flow/initialize`, {
      method: 'POST',
    })
  }

  // ========================================
  // FOLLOW-UP FLOW CONTACTS ENDPOINTS
  // ========================================

  async getFlowContacts(leadFlowId: string): Promise<ApiResponse<FollowUpFlowContact[]>> {
    return this.makeRequest<FollowUpFlowContact[]>(`/follow-up-flow/leads/${leadFlowId}/contacts`)
  }

  async createFlowContact(leadFlowId: string, data: CreateContactRequest): Promise<ApiResponse<FollowUpFlowContact>> {
    return this.makeRequest<FollowUpFlowContact>(`/follow-up-flow/leads/${leadFlowId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFlowContact(contactId: string, data: UpdateContactRequest): Promise<ApiResponse<FollowUpFlowContact>> {
    return this.makeRequest<FollowUpFlowContact>(`/follow-up-flow/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ========================================
  // EVOLUTION API INTEGRATION ENDPOINTS
  // ========================================

  async getEvolutionContacts(instanceId: string, search?: string): Promise<ApiResponse<WhatsAppContact[]>> {
    const queryString = search ? `?search=${encodeURIComponent(search)}` : ''
    return this.makeRequest<WhatsAppContact[]>(`/evolution/${instanceId}/contacts${queryString}`)
  }

  async getEvolutionChats(instanceId: string): Promise<ApiResponse<WhatsAppChat[]>> {
    return this.makeRequest<WhatsAppChat[]>(`/evolution/${instanceId}/chats`)
  }

  async getEvolutionMessages(instanceId: string, remoteJid: string, limit?: number): Promise<ApiResponse<{ messages: WhatsAppMessage[]; remoteJid: string; total: number }>> {
    const queryString = limit ? `?limit=${limit}` : ''
    return this.makeRequest<{ messages: WhatsAppMessage[]; remoteJid: string; total: number }>(`/evolution/${instanceId}/messages/${encodeURIComponent(remoteJid)}${queryString}`)
  }

  async getLeadWhatsAppHistory(leadId: string, limit?: number): Promise<ApiResponse<WhatsAppHistoryResponse>> {
    const queryString = limit ? `?limit=${limit}` : ''
    return this.makeRequest<WhatsAppHistoryResponse>(`/lead/${leadId}/whatsapp-history${queryString}`)
  }
}

// Exportar instância singleton
export const funnelService = new FunnelService()
