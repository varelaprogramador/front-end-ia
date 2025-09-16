import { API_BASE_URL } from './api-config'

export interface EvolutionInstanceSummary {
  id: string
  instanceName: string
  displayName: string
  connectionState: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR"
  status: "active" | "inactive" | "suspended"
}

export interface ConfigIAWithInstances {
  id: string
  userId: string
  nome: string
  prompt: string
  status?: string
  webhookUrlProd?: string
  webhookUrlDev?: string
  createdAt: string
  updatedAt: string
  evolutionInstances: EvolutionInstanceSummary[]
  user?: {
    id: string
    firstName?: string
    lastName?: string
    username?: string
    primaryEmailId?: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
  metadata?: {
    configIAId?: string
    count?: number
  }
}

export class ConfigIAInstancesService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/config-ia`
  }

  /**
   * Get available Evolution instances for assignment to a ConfigIA
   */
  async getAvailableInstances(configIAId: string): Promise<ApiResponse<EvolutionInstanceSummary[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/${configIAId}/available-instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching available instances:', error)
      throw error
    }
  }

  /**
   * Assign Evolution instances to a ConfigIA
   */
  async assignInstances(configIAId: string, instanceIds: string[]): Promise<ApiResponse<EvolutionInstanceSummary[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/${configIAId}/assign-instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceIds }),
      })

      if (!response.ok) {
        // Tentar obter mensagem de erro do servidor
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          if (errorData) {
            const parsedError = JSON.parse(errorData)
            errorMessage = parsedError.message || errorMessage
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      // Verificar se a resposta tem conteúdo antes de fazer parse
      const responseText = await response.text()
      if (!responseText) {
        return {
          success: true,
          message: 'Instâncias atribuídas com sucesso',
          data: []
        }
      }

      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        console.error('Response text:', responseText)
        return {
          success: true,
          message: 'Instâncias atribuídas com sucesso (resposta inválida)',
          data: []
        }
      }
    } catch (error) {
      console.error('Error assigning instances:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao atribuir instâncias',
        data: []
      }
    }
  }

  /**
   * Unassign a single Evolution instance from a ConfigIA
   */
  async unassignInstance(configIAId: string, instanceId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${configIAId}/unassign-instance/${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Tentar obter mensagem de erro do servidor
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          if (errorData) {
            const parsedError = JSON.parse(errorData)
            errorMessage = parsedError.message || errorMessage
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      // Verificar se a resposta tem conteúdo antes de fazer parse
      const responseText = await response.text()
      if (!responseText) {
        return {
          success: true,
          message: 'Instância desatribuída com sucesso'
        }
      }

      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        console.error('Response text:', responseText)
        return {
          success: true,
          message: 'Instância desatribuída com sucesso (resposta inválida)'
        }
      }
    } catch (error) {
      console.error('Error unassigning instance:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao desatribuir instância'
      }
    }
  }

  /**
   * Unassign multiple Evolution instances from a ConfigIA
   */
  async unassignInstances(configIAId: string, instanceIds: string[]): Promise<ApiResponse<EvolutionInstanceSummary[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/${configIAId}/unassign-instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceIds }),
      })

      if (!response.ok) {
        // Tentar obter mensagem de erro do servidor
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          if (errorData) {
            const parsedError = JSON.parse(errorData)
            errorMessage = parsedError.message || errorMessage
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      // Verificar se a resposta tem conteúdo antes de fazer parse
      const responseText = await response.text()
      if (!responseText) {
        return {
          success: true,
          message: 'Instâncias desatribuídas com sucesso',
          data: []
        }
      }

      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        console.error('Response text:', responseText)
        return {
          success: true,
          message: 'Instâncias desatribuídas com sucesso (resposta inválida)',
          data: []
        }
      }
    } catch (error) {
      console.error('Error unassigning instances:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao desatribuir instâncias',
        data: []
      }
    }
  }
}

// Exportar instância singleton
export const configIAInstancesService = new ConfigIAInstancesService()