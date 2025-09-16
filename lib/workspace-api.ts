import { API_BASE_URL, ApiResponse, Workspace, WorkspaceInvitation, ConfigIA } from './api-config'

export class WorkspaceAPI {
  private static baseUrl = API_BASE_URL

  // Workspace operations
  static async createWorkspace(data: {
    name: string
    description?: string
    slug: string
    logoUrl?: string
    primaryColor?: string
  }): Promise<ApiResponse<Workspace>> {
    const response = await fetch(`${this.baseUrl}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  static async getWorkspaces(params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<Workspace[]>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const response = await fetch(`${this.baseUrl}/workspaces?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async updateWorkspace(id: string, data: {
    name?: string
    description?: string
    logoUrl?: string
    primaryColor?: string
  }): Promise<ApiResponse<Workspace>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  static async deleteWorkspace(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  // Invitation operations
  static async sendInvitation(workspaceId: string, data: {
    email: string
    role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  }): Promise<ApiResponse<WorkspaceInvitation>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  static async getInvitations(workspaceId: string): Promise<ApiResponse<WorkspaceInvitation[]>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/invitations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async acceptInvitation(token: string): Promise<ApiResponse<{ workspace: Workspace; role: string }>> {
    const response = await fetch(`${this.baseUrl}/workspaces/invitations/${token}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async cancelInvitation(workspaceId: string, invitationId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/invitations/${invitationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  // Agent operations within workspace
  static async getWorkspaceAgents(workspaceId: string, params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<ApiResponse<ConfigIA[]>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.search) searchParams.append('search', params.search)

    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async getWorkspaceAgent(workspaceId: string, agentId: string): Promise<ApiResponse<ConfigIA>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async createWorkspaceAgent(workspaceId: string, data: {
    nome: string
    prompt: string
    status?: string
    webhookUrlProd?: string
    webhookUrlDev?: string
  }): Promise<ApiResponse<ConfigIA>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  static async updateWorkspaceAgent(workspaceId: string, agentId: string, data: {
    nome?: string
    prompt?: string
    status?: string
    webhookUrlProd?: string
    webhookUrlDev?: string
  }): Promise<ApiResponse<ConfigIA>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  static async deleteWorkspaceAgent(workspaceId: string, agentId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  static async updateWorkspaceAgentStatus(workspaceId: string, agentId: string, status: string): Promise<ApiResponse<ConfigIA>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents/${agentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    return response.json()
  }

  static async cloneWorkspaceAgent(workspaceId: string, agentId: string, nome: string): Promise<ApiResponse<ConfigIA>> {
    const response = await fetch(`${this.baseUrl}/workspaces/${workspaceId}/agents/${agentId}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome }),
    })
    return response.json()
  }
}