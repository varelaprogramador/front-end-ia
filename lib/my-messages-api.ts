"use client"

import { API_BASE_URL } from "./api-config"

export interface Message {
  id: string
  sessionId: string
  message: string
  direction: "sent" | "received"
  createdAt: string
  messageId?: string
  instanceName?: string
  chatId?: string
  senderId?: string
  senderName?: string
  messageType?: string
  content?: string
  mediaUrl?: string
  mediaType?: string
  mediaBase64?: string
  caption?: string
  fileName?: string
  timestamp?: string
  isGroup?: boolean
  status?: string
  serverUrl?: string
  apikey?: string
  webhookData?: any
  aiResponse?: string
  isAiResponse: boolean
}

export interface Contact {
  contactId: string
  contactName: string
  chatId: string
  isGroup: boolean
  lastMessageTime: string
}

export interface MessagesResponse {
  success: boolean
  data: Message[]
  metadata: {
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    agentId?: string
    agentName?: string
    instanceNames?: string[]
    contactId?: string
  }
  message?: string
}

export interface ContactsResponse {
  success: boolean
  data: Contact[]
  metadata: {
    agentId: string
    agentName: string
    contactCount: number
  }
  message?: string
}

class MyMessagesService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/my-messages${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || "Erro na requisição")
    }
    
    return data
  }

  async getMessagesByAgent(
    agentId: string,
    options?: {
      page?: number
      limit?: number
      contactId?: string
    }
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams()
    if (options?.page) params.append("page", options.page.toString())
    if (options?.limit) params.append("limit", options.limit.toString())
    if (options?.contactId) params.append("contactId", options.contactId)

    const query = params.toString()
    const endpoint = `/agent/${agentId}${query ? `?${query}` : ""}`
    
    return this.request<MessagesResponse>(endpoint)
  }

  async getContactsByAgent(agentId: string): Promise<ContactsResponse> {
    return this.request<ContactsResponse>(`/agent/${agentId}/contacts`)
  }

  async getMessagesByChat(
    chatId: string,
    options?: {
      page?: number
      limit?: number
      direction?: "sent" | "received"
    }
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams()
    if (options?.page) params.append("page", options.page.toString())
    if (options?.limit) params.append("limit", options.limit.toString())
    if (options?.direction) params.append("direction", options.direction)

    const query = params.toString()
    const endpoint = `/chat/${chatId}${query ? `?${query}` : ""}`
    
    return this.request<MessagesResponse>(endpoint)
  }

  async sendMessage(messageData: {
    sessionId: string
    message: string
    direction: "sent" | "received"
    messageId?: string
    instanceName?: string
    chatId?: string
    senderId?: string
    senderName?: string
    messageType?: string
    content?: string
    timestamp?: string
    isGroup?: boolean
    aiResponse?: string
    isAiResponse?: boolean
  }): Promise<{ success: boolean; data: Message; message: string }> {
    return this.request<{ success: boolean; data: Message; message: string }>("/", {
      method: "POST",
      body: JSON.stringify(messageData),
    })
  }
}

export const myMessagesService = new MyMessagesService()