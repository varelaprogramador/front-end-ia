import { 
  API_BASE_URL, 
  ConfigIA, 
  ApiResponse, 
  CreateConfigIARequest, 
  UpdateConfigIARequest, 
  QueryParams 
} from './api-config'

// Classe para gerenciar chamadas da API
class ConfigIAService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/config-ia`
  }

  // Função auxiliar para fazer requisições
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Verificar se há conteúdo na resposta antes de fazer parse JSON
      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')
      
      // Se não há content-type JSON ou content-length é 0, retornar resposta padrão
      if (!contentType?.includes('application/json') || contentLength === '0') {
        console.warn('Response has no JSON content, returning default response')
        return { success: true, data: null as T }
      }

      const responseText = await response.text()
      
      // Se a resposta está vazia, retornar resposta padrão
      if (!responseText.trim()) {
        console.warn('Empty response body, returning default response')
        return { success: true, data: null as T }
      }

      return JSON.parse(responseText)
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // GET /config-ia - Listar configurações de IA
  async getConfigs(params?: QueryParams): Promise<ApiResponse<ConfigIA[]>> {
    const queryString = new URLSearchParams()
    
    if (params?.page) queryString.append('page', params.page.toString())
    if (params?.limit) queryString.append('limit', params.limit.toString())
    if (params?.userId) queryString.append('userId', params.userId)
    if (params?.status) queryString.append('status', params.status)
    if (params?.search) queryString.append('search', params.search)

    const endpoint = queryString.toString() ? `?${queryString.toString()}` : ''
    return this.makeRequest<ConfigIA[]>(endpoint)
  }

  // GET /config-ia/user/:userId - Obter configurações por usuário
  async getConfigsByUser(userId: string, status?: string): Promise<ApiResponse<ConfigIA[]>> {
    const endpoint = `/user/${userId}${status ? `?status=${status}` : ''}`
    return this.makeRequest<ConfigIA[]>(endpoint)
  }

  // GET /config-ia/active/user/:userId - Obter configurações ativas por usuário
  async getActiveConfigsByUser(userId: string): Promise<ApiResponse<ConfigIA[]>> {
    return this.makeRequest<ConfigIA[]>(`/active/user/${userId}`)
  }

  // GET /config-ia/:id - Obter configuração por ID
  async getConfigById(id: string): Promise<ApiResponse<ConfigIA>> {
    return this.makeRequest<ConfigIA>(`/${id}`)
  }

  // POST /config-ia - Criar configuração
  async createConfig(data: CreateConfigIARequest): Promise<ApiResponse<ConfigIA>> {
    return this.makeRequest<ConfigIA>('', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT /config-ia/:id - Atualizar configuração
  async updateConfig(id: string, data: UpdateConfigIARequest): Promise<ApiResponse<ConfigIA>> {
    return this.makeRequest<ConfigIA>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // PATCH /config-ia/:id/status - Atualizar status
  async updateStatus(id: string, status: string): Promise<ApiResponse<ConfigIA>> {
    return this.makeRequest<ConfigIA>(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // POST /config-ia/:id/clone - Clonar configuração
  async cloneConfig(id: string, nome: string): Promise<ApiResponse<ConfigIA>> {
    return this.makeRequest<ConfigIA>(`/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ nome }),
    })
  }

  // DELETE /config-ia/:id - Deletar configuração
  async deleteConfig(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/${id}`, {
      method: 'DELETE',
    })
  }
}

// Exportar instância singleton
export const configIAService = new ConfigIAService()

// Funções auxiliares para compatibilidade com o sistema atual
export const getAgents = async (userId?: string): Promise<ConfigIA[]> => {
  try {
    const response = userId 
      ? await configIAService.getConfigsByUser(userId)
      : await configIAService.getConfigs()
    
    return response.data || []
  } catch (error) {
    console.error('Error fetching agents:', error)
    return []
  }
}

export const getActiveAgents = async (userId: string): Promise<ConfigIA[]> => {
  try {
    const response = await configIAService.getActiveConfigsByUser(userId)
    return response.data || []
  } catch (error) {
    console.error('Error fetching active agents:', error)
    return []
  }
}

export const getAgentById = async (id: string): Promise<ConfigIA | null> => {
  try {
    const response = await configIAService.getConfigById(id)
    return response.data || null
  } catch (error) {
    console.error('Error fetching agent by ID:', error)
    return null
  }
}

export const createAgent = async (data: CreateConfigIARequest): Promise<ConfigIA | null> => {
  try {
    const response = await configIAService.createConfig(data)
    return response.data || null
  } catch (error) {
    console.error('Error creating agent:', error)
    return null
  }
}

export const updateAgent = async (id: string, data: UpdateConfigIARequest): Promise<ConfigIA | null> => {
  try {
    const response = await configIAService.updateConfig(id, data)
    return response.data || null
  } catch (error) {
    console.error('Error updating agent:', error)
    return null
  }
}

export const deleteAgent = async (id: string): Promise<boolean> => {
  try {
    await configIAService.deleteConfig(id)
    return true
  } catch (error) {
    console.error('Error deleting agent:', error)
    return false
  }
}

export const cloneAgent = async (id: string, nome: string): Promise<ConfigIA | null> => {
  try {
    const response = await configIAService.cloneConfig(id, nome)
    return response.data || null
  } catch (error) {
    console.error('Error cloning agent:', error)
    return null
  }
}

export const toggleAgentStatus = async (id: string, status: string): Promise<ConfigIA | null> => {
  try {
    const response = await configIAService.updateStatus(id, status)
    return response.data || null
  } catch (error) {
    console.error('Error updating agent status:', error)
    return null
  }
}