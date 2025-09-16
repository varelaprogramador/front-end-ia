import { WorkspaceAPI } from "./workspace-api";
import {
  configIAToAgent,
  agentToCreateConfigIA,
  agentToUpdateConfigIA,
  configIAListToAgentList,
  Agent,
} from "./adapters";

// Exportar o tipo Agent do adaptador para manter consistência
export type { Agent } from "./adapters";

// Função para obter agentes de um workspace
export const getWorkspaceAgents = async (workspaceId: string, params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}): Promise<Agent[]> => {
  try {
    const response = await WorkspaceAPI.getWorkspaceAgents(workspaceId, params);

    if (response.success && response.data) {
      console.log("WORKSPACE AGENTS FETCHED:", response.data);
      return configIAListToAgentList(response.data);
    }

    console.error("Failed to fetch workspace agents:", response.error);
    return [];
  } catch (error) {
    console.error("Error fetching workspace agents:", error);
    return [];
  }
};

// Função para obter apenas agentes ativos de um workspace
export const getActiveWorkspaceAgents = async (workspaceId: string): Promise<Agent[]> => {
  try {
    const response = await WorkspaceAPI.getWorkspaceAgents(workspaceId, { status: 'ativo' });

    if (response.success && response.data) {
      return configIAListToAgentList(response.data);
    }

    console.error("Failed to fetch active workspace agents:", response.error);
    return [];
  } catch (error) {
    console.error("Error fetching active workspace agents:", error);
    return [];
  }
};

// Função para obter um agente específico de um workspace
export const getWorkspaceAgent = async (workspaceId: string, agentId: string): Promise<Agent | null> => {
  try {
    const response = await WorkspaceAPI.getWorkspaceAgent(workspaceId, agentId);

    if (response.success && response.data) {
      return configIAToAgent(response.data);
    }

    console.error("Failed to fetch workspace agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error fetching workspace agent:", error);
    return null;
  }
};

// Função para criar um novo agente em um workspace
export const createWorkspaceAgent = async (workspaceId: string, agent: Omit<Agent, 'id' | 'createdAt' | 'totalMessages' | 'confirmedAppointments'>): Promise<Agent | null> => {
  try {
    // Ensure the agent has the workspace ID
    const agentWithWorkspace = { ...agent, workspaceId };
    const createData = agentToCreateConfigIA(agentWithWorkspace);
    const response = await WorkspaceAPI.createWorkspaceAgent(workspaceId, createData);

    if (response.success && response.data) {
      console.log("WORKSPACE AGENT CREATED:", response.data);
      return configIAToAgent(response.data);
    }

    console.error("Failed to create workspace agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error creating workspace agent:", error);
    return null;
  }
};

// Função para atualizar um agente em um workspace
export const updateWorkspaceAgent = async (workspaceId: string, agentId: string, agent: Partial<Agent>): Promise<Agent | null> => {
  try {
    const updateData = agentToUpdateConfigIA(agent);
    const response = await WorkspaceAPI.updateWorkspaceAgent(workspaceId, agentId, updateData);

    if (response.success && response.data) {
      console.log("WORKSPACE AGENT UPDATED:", response.data);
      return configIAToAgent(response.data);
    }

    console.error("Failed to update workspace agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error updating workspace agent:", error);
    return null;
  }
};

// Função para excluir um agente de um workspace
export const deleteWorkspaceAgent = async (workspaceId: string, agentId: string): Promise<boolean> => {
  try {
    const response = await WorkspaceAPI.deleteWorkspaceAgent(workspaceId, agentId);

    if (response.success) {
      console.log("WORKSPACE AGENT DELETED:", agentId);
      return true;
    }

    console.error("Failed to delete workspace agent:", response.error);
    return false;
  } catch (error) {
    console.error("Error deleting workspace agent:", error);
    return false;
  }
};

// Função para alterar o status de um agente em um workspace
export const toggleWorkspaceAgentStatus = async (workspaceId: string, agentId: string, newStatus: "active" | "inactive" | "development"): Promise<Agent | null> => {
  try {
    const statusMap = {
      active: 'ativo',
      inactive: 'inativo',
      development: 'em desenvolvimento'
    };

    const response = await WorkspaceAPI.updateWorkspaceAgentStatus(workspaceId, agentId, statusMap[newStatus]);

    if (response.success && response.data) {
      console.log("WORKSPACE AGENT STATUS UPDATED:", response.data);
      return configIAToAgent(response.data);
    }

    console.error("Failed to toggle workspace agent status:", response.error);
    return null;
  } catch (error) {
    console.error("Error toggling workspace agent status:", error);
    return null;
  }
};

// Função para clonar um agente em um workspace
export const cloneWorkspaceAgent = async (workspaceId: string, agentId: string, newName: string): Promise<Agent | null> => {
  try {
    const response = await WorkspaceAPI.cloneWorkspaceAgent(workspaceId, agentId, newName);

    if (response.success && response.data) {
      console.log("WORKSPACE AGENT CLONED:", response.data);
      return configIAToAgent(response.data);
    }

    console.error("Failed to clone workspace agent:", response.error);
    return null;
  } catch (error) {
    console.error("Error cloning workspace agent:", error);
    return null;
  }
};

// Wrapper functions to maintain compatibility with existing code
export const getAgents = (userId?: string) => getWorkspaceAgents('default-workspace', {});
export const getAllAgents = (userId?: string) => getWorkspaceAgents('default-workspace', {});
export const getActiveAgents = (userId?: string) => getActiveWorkspaceAgents('default-workspace');
export const deleteAgent = (agentId: string) => deleteWorkspaceAgent('default-workspace', agentId);
export const toggleAgentStatus = (agentId: string, newStatus: "active" | "inactive" | "development") =>
  toggleWorkspaceAgentStatus('default-workspace', agentId, newStatus);