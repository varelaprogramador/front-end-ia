"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export interface SendTextMessageParams {
  instanceName: string
  remoteJid: string
  message: string
  agentId?: string
}

export interface SendAudioMessageParams {
  instanceName: string
  remoteJid: string
  audioBase64: string
  agentId?: string
}

export interface GetMediaParams {
  instanceName: string
  messageKey: {
    id: string
    remoteJid?: string
    fromMe?: boolean
  }
  convertToMp4?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: any
}

class EvolutionAPIService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      console.log('📡 [Evolution API] Request:', { method: options.method || 'GET', url })

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      console.log('📥 [Evolution API] Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ [Evolution API] Parsed response:', data)

      return {
        success: data.status === 'success',
        data: data.data,
        message: data.message,
      }
    } catch (error) {
      console.error(`❌ [Evolution API] Request failed for ${endpoint}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Request failed',
        error,
      }
    }
  }

  async sendTextMessage(params: SendTextMessageParams): Promise<ApiResponse<any>> {
    return this.makeRequest('/evolution/send-message/text', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async sendAudioMessage(params: SendAudioMessageParams): Promise<ApiResponse<any>> {
    return this.makeRequest('/evolution/send-message/audio', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getMediaBase64(params: GetMediaParams): Promise<ApiResponse<any>> {
    return this.makeRequest('/evolution/get-media', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }
}

export const evolutionAPIService = new EvolutionAPIService()
