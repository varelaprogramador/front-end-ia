import { ConfigIA, EvolutionInstanceSummary } from './api-config'

// Interface Agent do frontend (baseada no arquivo agents.ts existente)
export interface Agent {
  id: string
  name: string
  webhookDev: string
  webhookProd: string
  prompt: string
  status: "active" | "inactive" | "development"
  createdAt: Date
  totalMessages: number
  confirmedAppointments: number
  avatar?: string
  description: string
  evolutionInstances?: EvolutionInstanceSummary[]
}

// Adaptador para converter ConfigIA (backend) para Agent (frontend)
export const configIAToAgent = (config: ConfigIA): Agent => {
  return {
    id: config.id,
    name: config.nome,
    webhookDev: config.webhookUrlDev || '',
    webhookProd: config.webhookUrlProd || '',
    prompt: config.prompt,
    status: config.status === 'ativo' ? 'active' : config.status === 'em desenvolvimento' ? 'development' : 'inactive',
    createdAt: new Date(config.createdAt),
    totalMessages: 0, // Será implementado posteriormente com dados reais
    confirmedAppointments: 0, // Será implementado posteriormente com dados reais
    avatar: undefined, // Será implementado posteriormente
    description: config.prompt.length > 100 ? config.prompt.substring(0, 100) + '...' : config.prompt, // Descrição baseada no prompt
    evolutionInstances: config.evolutionInstances || [], // Incluir instâncias Evolution
  }
}

// Adaptador para converter Agent (frontend) para dados de criação/atualização
export const agentToCreateConfigIA = (agent: Omit<Agent, 'id' | 'createdAt' | 'totalMessages' | 'confirmedAppointments'>, userId: string) => {
  return {
    userId,
    nome: agent.name,
    prompt: agent.prompt,
    status: agent.status === 'active' ? 'ativo' : agent.status === 'development' ? 'em desenvolvimento' : 'inativo',
    webhookUrlProd: agent.webhookProd || undefined,
    webhookUrlDev: agent.webhookDev || undefined,
  }
}

// Adaptador para converter Agent (frontend) para dados de atualização
export const agentToUpdateConfigIA = (agent: Partial<Agent>) => {
  const updateData: any = {}
  
  if (agent.name) updateData.nome = agent.name
  if (agent.prompt) updateData.prompt = agent.prompt
  if (agent.status) updateData.status = agent.status === 'active' ? 'ativo' : agent.status === 'development' ? 'em desenvolvimento' : 'inativo'
  if (agent.webhookProd !== undefined) updateData.webhookUrlProd = agent.webhookProd || undefined
  if (agent.webhookDev !== undefined) updateData.webhookUrlDev = agent.webhookDev || undefined
  
  return updateData
}

// Função para converter lista de ConfigIA para lista de Agents
export const configIAListToAgentList = (configs: ConfigIA[]): Agent[] => {
  return configs.map(configIAToAgent)
}