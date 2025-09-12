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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error assigning instances:', error)
      throw error
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error unassigning instance:', error)
      throw error
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error unassigning instances:', error)
      throw error
    }
  }
}

// Exportar instância singleton
export const configIAInstancesService = new ConfigIAInstancesService()