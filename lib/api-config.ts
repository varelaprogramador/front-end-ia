// Configuração da API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
export const MOCK_USER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID || "user_123";

// Tipos da API baseados no backend
export interface EvolutionInstanceSummary {
  id: string
  instanceName: string
  displayName: string
  connectionState: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR"
  status: "active" | "inactive" | "suspended"
}

export interface ConfigIA {
  id: string;
  userId: string;
  nome: string;
  prompt: string;
  status?: string;
  webhookUrlProd?: string;
  webhookUrlDev?: string;
  createdAt: string;
  updatedAt: string;
  evolutionInstances?: EvolutionInstanceSummary[];
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    primaryEmailId?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  instances?: T[];
  stats?: T;
  qrcode?: T;
  instance?: T;
  count?: number;
  userId?: string;
  metadata?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    [key: string]: any;
  };
}

export interface CreateConfigIARequest {
  userId: string;
  nome: string;
  prompt: string;
  status?: string;
  webhookUrlProd?: string;
  webhookUrlDev?: string;
}

export interface UpdateConfigIARequest {
  nome?: string;
  prompt?: string;
  status?: string;
  webhookUrlProd?: string;
  webhookUrlDev?: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  search?: string;
}
