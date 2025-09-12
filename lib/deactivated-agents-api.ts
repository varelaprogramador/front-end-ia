import { API_BASE_URL } from './api-config';

// Tipos
export interface DeactivatedAgent {
  id: string;
  userId: string;
  configIAId: string;
  phoneNumber: string;
  reason?: string;
  isActive: boolean;
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
  configIA?: {
    id: string;
    nome: string;
  };
}

export interface CreateDeactivatedAgentRequest {
  configIAId: string;
  phoneNumber: string;
  reason?: string;
  blockedBy?: string;
}

export interface UpdateDeactivatedAgentRequest {
  reason?: string;
  isActive?: boolean;
}

export interface DeactivatedAgentResponse {
  success: boolean;
  data?: DeactivatedAgent;
  message?: string;
}

export interface DeactivatedAgentsListResponse {
  success: boolean;
  data?: DeactivatedAgent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface CheckBlockedResponse {
  success: boolean;
  data?: {
    isBlocked: boolean;
    reason?: string;
    blockedBy?: string;
    blockedAt?: string;
  };
  message?: string;
}

// API Service
class DeactivatedAgentsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/deactivated-agents`;
  }

  // Função auxiliar para fazer requisições
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      if (!contentType?.includes('application/json') || contentLength === '0') {
        console.warn('Response has no JSON content');
        return { success: true } as T;
      }

      const responseText = await response.text();
      
      if (!responseText.trim()) {
        console.warn('Empty response body');
        return { success: true } as T;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET /deactivated-agents - Listar números desativados
  async getDeactivatedAgents(params?: {
    configIAId?: string;
    phoneNumber?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DeactivatedAgentsListResponse> {
    const queryString = new URLSearchParams();
    
    if (params?.configIAId) queryString.append('configIAId', params.configIAId);
    if (params?.phoneNumber) queryString.append('phoneNumber', params.phoneNumber);
    if (params?.isActive !== undefined) queryString.append('isActive', params.isActive.toString());
    if (params?.page) queryString.append('page', params.page.toString());
    if (params?.limit) queryString.append('limit', params.limit.toString());

    const endpoint = queryString.toString() ? `?${queryString.toString()}` : '';
    return this.makeRequest<DeactivatedAgentsListResponse>(endpoint);
  }

  // GET /deactivated-agents/config/:configIAId - Listar por agente
  async getDeactivatedAgentsByConfig(
    configIAId: string,
    params?: { isActive?: boolean }
  ): Promise<DeactivatedAgentsListResponse> {
    const queryString = new URLSearchParams();
    if (params?.isActive !== undefined) queryString.append('isActive', params.isActive.toString());
    
    const endpoint = `/config/${configIAId}${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return this.makeRequest<DeactivatedAgentsListResponse>(endpoint);
  }

  // POST /deactivated-agents - Criar novo número desativado
  async createDeactivatedAgent(data: CreateDeactivatedAgentRequest): Promise<DeactivatedAgentResponse> {
    return this.makeRequest<DeactivatedAgentResponse>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT /deactivated-agents/:id - Atualizar número desativado
  async updateDeactivatedAgent(id: string, data: UpdateDeactivatedAgentRequest): Promise<DeactivatedAgentResponse> {
    return this.makeRequest<DeactivatedAgentResponse>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE /deactivated-agents/:id - Remover número desativado
  async deleteDeactivatedAgent(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest<{ success: boolean; message?: string }>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // POST /deactivated-agents/check - Verificar se número está bloqueado
  async checkBlockedNumber(configIAId: string, phoneNumber: string): Promise<CheckBlockedResponse> {
    return this.makeRequest<CheckBlockedResponse>('/check', {
      method: 'POST',
      body: JSON.stringify({ configIAId, phoneNumber }),
    });
  }
}

// Exportar instância singleton
export const deactivatedAgentsService = new DeactivatedAgentsService();

// Funções auxiliares para compatibilidade
export const getDeactivatedAgents = async (params?: {
  configIAId?: string;
  phoneNumber?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<DeactivatedAgent[]> => {
  try {
    const response = await deactivatedAgentsService.getDeactivatedAgents(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching deactivated agents:', error);
    return [];
  }
};

export const getDeactivatedAgentsByConfig = async (
  configIAId: string,
  isActiveOnly = true
): Promise<DeactivatedAgent[]> => {
  try {
    const response = await deactivatedAgentsService.getDeactivatedAgentsByConfig(
      configIAId,
      { isActive: isActiveOnly }
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching deactivated agents by config:', error);
    return [];
  }
};

export const createDeactivatedAgent = async (data: CreateDeactivatedAgentRequest): Promise<DeactivatedAgent | null> => {
  try {
    const response = await deactivatedAgentsService.createDeactivatedAgent(data);
    return response.data || null;
  } catch (error) {
    console.error('Error creating deactivated agent:', error);
    return null;
  }
};

export const updateDeactivatedAgent = async (
  id: string,
  data: UpdateDeactivatedAgentRequest
): Promise<DeactivatedAgent | null> => {
  try {
    const response = await deactivatedAgentsService.updateDeactivatedAgent(id, data);
    return response.data || null;
  } catch (error) {
    console.error('Error updating deactivated agent:', error);
    return null;
  }
};

export const deleteDeactivatedAgent = async (id: string): Promise<boolean> => {
  try {
    const response = await deactivatedAgentsService.deleteDeactivatedAgent(id);
    return response.success;
  } catch (error) {
    console.error('Error deleting deactivated agent:', error);
    return false;
  }
};

export const checkBlockedNumber = async (configIAId: string, phoneNumber: string): Promise<{
  isBlocked: boolean;
  reason?: string;
  blockedBy?: string;
  blockedAt?: string;
} | null> => {
  try {
    const response = await deactivatedAgentsService.checkBlockedNumber(configIAId, phoneNumber);
    return response.data || { isBlocked: false };
  } catch (error) {
    console.error('Error checking blocked number:', error);
    return null;
  }
};