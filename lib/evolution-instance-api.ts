import { API_BASE_URL, ApiResponse } from "./api-config";

import type {
  EvolutionInstance,
  CreateEvolutionInstanceRequest,
  UpdateEvolutionInstanceRequest,
  EvolutionInstanceStats,
  QRCodeResponse,
  ConnectionStatus,
} from "./types/evolution-instance";

// Classe para gerenciar chamadas da API de Instâncias Evolution
class EvolutionInstanceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/evolution-instances`;
  }

  // Função auxiliar para fazer requisições
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log("🌐 [REQUEST] URL completa:", fullUrl);
    console.log("🔧 [REQUEST] Método:", options.method || "GET");
    console.log("📋 [REQUEST] Headers:", options.headers);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Verificar se há conteúdo na resposta
      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");

      // Se não há conteúdo ou é vazio
      if (contentLength === "0" || !contentType?.includes("application/json")) {
        console.warn("Resposta vazia ou não-JSON recebida:", {
          status: response.status,
          contentLength,
          contentType,
        });

        // Retornar resposta padrão para respostas vazias
        return {
          success: true,
          message: "Operação concluída com sucesso",
        } as ApiResponse<T>;
      }

      const text = await response.text();

      // Se o texto está vazio
      if (!text.trim()) {
        console.warn("Resposta com texto vazio");
        return {
          success: true,
          message: "Operação concluída com sucesso",
        } as ApiResponse<T>;
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError);
        console.error("Texto da resposta:", text);
        throw new Error(
          `Resposta inválida do servidor: ${text.substring(0, 100)}`
        );
      }
    } catch (error) {
      console.error("Evolution Instance API Request failed:", error);
      throw error;
    }
  }

  // GET /evolution-instances - Listar todas as instâncias
  async getInstances(
    userId?: string
  ): Promise<ApiResponse<EvolutionInstance[]>> {
    const queryString = userId ? `?userId=${userId}` : "";
    return this.makeRequest<EvolutionInstance[]>(queryString);
  }

  // GET /evolution-instances/user/:userId - Obter instâncias por usuário
  async getInstancesByUser(
    userId: string
  ): Promise<ApiResponse<EvolutionInstance[]>> {
    if (!userId) {
      throw new Error("UserId é obrigatório");
    }
    return this.makeRequest<EvolutionInstance[]>(`/user/${userId}`);
  }

  // GET /evolution-instances/stats/:userId - Obter estatísticas das instâncias
  async getInstanceStats(
    userId: string
  ): Promise<ApiResponse<EvolutionInstanceStats>> {
    if (!userId) {
      throw new Error("UserId é obrigatório");
    }
    return this.makeRequest<EvolutionInstanceStats>(`/stats/${userId}`);
  }

  // GET /evolution-instances/:id - Obter instância por ID
  async getInstanceById(id: string): Promise<ApiResponse<EvolutionInstance>> {
    return this.makeRequest<EvolutionInstance>(`/${id}`);
  }

  // POST /evolution-instances - Criar instância
  async createInstance(
    data: CreateEvolutionInstanceRequest
  ): Promise<ApiResponse<EvolutionInstance>> {
    return this.makeRequest<EvolutionInstance>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT /evolution-instances/:id - Atualizar instância
  async updateInstance(
    id: string,
    data: UpdateEvolutionInstanceRequest
  ): Promise<ApiResponse<EvolutionInstance>> {
    return this.makeRequest<EvolutionInstance>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE /evolution-instances/:id - Deletar instância
  async deleteInstance(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  // POST /evolution-instances/:id/connect - Conectar instância e gerar QR Code
  async connectInstance(id: string): Promise<ApiResponse<QRCodeResponse>> {
    console.log("🔄 [API] Conectando instância via POST /:id/connect");
    return this.makeRequest<QRCodeResponse>(`/${id}/connect`, {
      method: "POST",
    });
  }

  // POST /evolution-instances/:id/disconnect - Desconectar instância
  async disconnectInstance(id: string): Promise<ApiResponse<void>> {
    console.log("🔌 [API] Desconectando instância via POST /:id/disconnect");
    return this.makeRequest<void>(`/${id}/disconnect`, {
      method: "POST",
    });
  }

  // GET /evolution-instances/:id/status - Obter status da instância
  async getConnectionStatus(
    id: string
  ): Promise<ApiResponse<ConnectionStatus>> {
    console.log("📊 [API] Obtendo status via GET /:id/status");
    return this.makeRequest<ConnectionStatus>(`/${id}/status`);
  }
}

// Exportar instância singleton
export const evolutionInstanceService = new EvolutionInstanceService();
