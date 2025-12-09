import { ConfigIA, EvolutionInstanceSummary } from './api-config'

// Interface Agent do frontend (baseada no arquivo agents.ts existente)
// Nota: webhookDev e webhookProd são gerados automaticamente pelo backend
export interface Agent {
  id: string
  name: string
  webhookDev?: string
  webhookProd?: string
  prompt: string
  status: "active" | "inactive" | "development"
  createdAt: Date
  totalMessages: number
  confirmedAppointments: number
  avatar?: string
  description: string
  evolutionInstances?: EvolutionInstanceSummary[]
  // Campos de integração com Kommo
  kommoSubdomain?: string
  kommoAccessToken?: string
  kommodPipelineId?: string
  // Campos de integração com RD Station
  rdstationClientId?: string
  rdstationClientSecret?: string
  rdstationAccessToken?: string
  rdstationRefreshToken?: string
  rdstationCode?: string
  // Credenciais vinculadas
  credentialIds?: string[]
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
    totalMessages: config.totalMessages || 0, // Dados reais do backend
    confirmedAppointments: config.confirmedAppointments || 0, // Dados reais do backend
    avatar: undefined, // Será implementado posteriormente
    description: config.prompt.length > 100 ? config.prompt.substring(0, 100) + '...' : config.prompt, // Descrição baseada no prompt
    evolutionInstances: config.evolutionInstances || [], // Incluir instâncias Evolution
    // Campos Kommo
    kommoSubdomain: config.kommoSubdomain || undefined,
    kommoAccessToken: config.kommoAccessToken || undefined,
    kommodPipelineId: config.kommodPipelineId || undefined,
    // Campos RD Station
    rdstationClientId: config.rdstationClientId || undefined,
    rdstationClientSecret: config.rdstationClientSecret || undefined,
    rdstationAccessToken: config.rdstationAccessToken || undefined,
    rdstationRefreshToken: config.rdstationRefreshToken || undefined,
    rdstationCode: config.rdstationCode || undefined,
    // Credenciais
    credentialIds: (config as any).credentialIds || [],
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
    kommoSubdomain: agent.kommoSubdomain || undefined,
    kommoAccessToken: agent.kommoAccessToken || undefined,
    kommodPipelineId: agent.kommodPipelineId || undefined,
    rdstationClientId: agent.rdstationClientId || undefined,
    rdstationClientSecret: agent.rdstationClientSecret || undefined,
    rdstationAccessToken: agent.rdstationAccessToken || undefined,
    rdstationRefreshToken: agent.rdstationRefreshToken || undefined,
    rdstationCode: agent.rdstationCode || undefined,
    credentialIds: agent.credentialIds || [],
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
  if (agent.kommoSubdomain !== undefined) updateData.kommoSubdomain = agent.kommoSubdomain || undefined
  if (agent.kommoAccessToken !== undefined) updateData.kommoAccessToken = agent.kommoAccessToken || undefined
  if (agent.kommodPipelineId !== undefined) updateData.kommodPipelineId = agent.kommodPipelineId || undefined
  if (agent.rdstationClientId !== undefined) updateData.rdstationClientId = agent.rdstationClientId || undefined
  if (agent.rdstationClientSecret !== undefined) updateData.rdstationClientSecret = agent.rdstationClientSecret || undefined
  if (agent.rdstationAccessToken !== undefined) updateData.rdstationAccessToken = agent.rdstationAccessToken || undefined
  if (agent.rdstationRefreshToken !== undefined) updateData.rdstationRefreshToken = agent.rdstationRefreshToken || undefined
  if (agent.rdstationCode !== undefined) updateData.rdstationCode = agent.rdstationCode || undefined
  if (agent.credentialIds !== undefined) updateData.credentialIds = agent.credentialIds

  return updateData
}

// Função para converter lista de ConfigIA para lista de Agents
export const configIAListToAgentList = (configs: ConfigIA[]): Agent[] => {
  return configs.map(configIAToAgent)
}