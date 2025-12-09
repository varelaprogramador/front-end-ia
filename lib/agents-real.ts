import { configIAService } from "./config-ia-api";
import {
  configIAToAgent,
  agentToCreateConfigIA,
  agentToUpdateConfigIA,
  configIAListToAgentList,
  Agent,
} from "./adapters";
import { MOCK_USER_ID } from "./api-config";

// Exportar o tipo Agent do adaptador para manter consistência
export type { Agent } from "./adapters";

// Função para obter agentes do backend
export const getAgents = async (userId?: string): Promise<Agent[]> => {
  try {
    const userIdToUse = userId || MOCK_USER_ID;
    const response = await configIAService.getConfigsByUser(userIdToUse);

    if (response.success && response.data) {
      console.log("AGENTE BUSCADO:", response.data);
      return configIAListToAgentList(response.data);
    }

    console.error("Failed to fetch agents:", response.error);
    return [];
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
};

// Função para obter todos os agentes (alias para getAgents)
export const getAllAgents = async (userId?: string): Promise<Agent[]> => {
  return getAgents(userId);
};

// Função para obter apenas agentes ativos
export const getActiveAgents = async (userId?: string): Promise<Agent[]> => {
  try {
    const userIdToUse = userId || MOCK_USER_ID;
    const response = await configIAService.getActiveConfigsByUser(userIdToUse);

    if (response.success && response.data) {
      return configIAListToAgentList(response.data);
    }

    console.error("Failed to fetch active agents:", response.error);
    return [];
  } catch (error) {
    console.error("Error fetching active agents:", error);
    return [];
  }
};

// Função para obter agente por ID
export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  try {
    const response = await configIAService.getConfigById(id);

    if (response.success && response.data) {
      return configIAToAgent(response.data);
    }

    console.error("Failed to fetch agent by ID:", response.error);
    return undefined;
  } catch (error) {
    console.error("Error fetching agent by ID:", error);
    return undefined;
  }
};

// Função para criar agente
export const createAgent = async (
  agentData: Omit<
    Agent,
    "id" | "createdAt" | "totalMessages" | "confirmedAppointments"
  >,
  userId?: string
): Promise<Agent | null> => {
  try {
    const userIdToUse = userId || MOCK_USER_ID;
    const createData = agentToCreateConfigIA(agentData, userIdToUse);
    const response = await configIAService.createConfig(createData);

    if (response.success && response.data) {
      return configIAToAgent(response.data);
    }

    console.error("Failed to create agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error creating agent:", error);
    return null;
  }
};

// Função para atualizar agente
export const updateAgent = async (
  id: string,
  updates: Partial<Agent>
): Promise<Agent | null> => {
  try {
    const updateData = agentToUpdateConfigIA(updates);
    const response = await configIAService.updateConfig(id, updateData);

    if (response.success && response.data) {
      return configIAToAgent(response.data);
    }

    console.error("Failed to update agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error updating agent:", error);
    return null;
  }
};

// Função para deletar agente
export const deleteAgent = async (id: string): Promise<boolean> => {
  try {
    const response = await configIAService.deleteConfig(id);

    if (response.success) {
      return true;
    }

    console.error("Failed to delete agent:", response.error);
    return false;
  } catch (error) {
    console.error("Error deleting agent:", error);
    return false;
  }
};

// Função para clonar agente
export const cloneAgent = async (
  id: string,
  newName: string
): Promise<Agent | null> => {
  try {
    const response = await configIAService.cloneConfig(id, newName);

    if (response.success && response.data) {
      return configIAToAgent(response.data);
    }

    console.error("Failed to clone agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error cloning agent:", error);
    return null;
  }
};

// Função para alterar status do agente
export const toggleAgentStatus = async (
  id: string,
  newStatus: "active" | "inactive" | "development"
): Promise<Agent | null> => {
  try {
    const status = newStatus === "active" ? "ativo" : newStatus === "development" ? "em desenvolvimento" : "inativo";
    console.log(`🔄 Updating agent ${id} status to: ${status}`);

    const response = await configIAService.updateStatus(id, status);
    console.log("📦 Status update response:", response);

    if (response.success) {
      // Backend pode retornar dados parciais (apenas id, nome, status, userId)
      // Sempre buscar dados completos do agente após atualização de status
      console.log("📥 Fetching complete agent data after status update...");
      const updatedAgent = await getAgentById(id);

      if (updatedAgent) {
        console.log(`✅ Agent ${updatedAgent.name} fetched with status: ${updatedAgent.status}`);
        return updatedAgent;
      }

      // Fallback: se não conseguir buscar, tentar usar os dados parciais
      if (response.data) {
        console.log("⚠️ Using partial data from response");
        return configIAToAgent(response.data);
      }

      console.error("Failed to fetch updated agent data");
      return null;
    }

    console.error("Failed to update agent status:", response.error);
    return null;
  } catch (error) {
    console.error("Error updating agent status:", error);
    return null;
  }
};

// Função para buscar agentes
export const searchAgents = async (
  searchTerm: string,
  userId?: string
): Promise<Agent[]> => {
  try {
    const userIdToUse = userId || MOCK_USER_ID;
    const response = await configIAService.getConfigs({
      userId: userIdToUse,
      search: searchTerm,
    });

    if (response.success && response.data) {
      return configIAListToAgentList(response.data);
    }

    console.error("Failed to search agents:", response.error);
    return [];
  } catch (error) {
    console.error("Error searching agents:", error);
    return [];
  }
};

// Função para criar workspace no N8N
export const createN8NWorkspace = async (
  agentId: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await configIAService.createN8NWorkspace(agentId);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }

    console.error("Failed to create N8N workspace:", response.error);
    return {
      success: false,
      error: response.message || response.error || "Erro ao criar workspace no N8N",
    };
  } catch (error) {
    console.error("Error creating N8N workspace:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};
