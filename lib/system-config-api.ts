"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export interface SystemConfig {
  id: string
  systemName: string
  systemTitle: string
  systemDescription?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  logoUrl?: string
  logoUrlDark?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  supportUrl?: string
  websiteUrl?: string
  privacyPolicyUrl?: string
  termsOfServiceUrl?: string
  facebookUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  maintenanceMode: boolean
  allowRegistration: boolean
  version?: string
  createdAt: string
  updatedAt: string
}

export interface SystemConfigUpdate {
  systemName?: string
  systemTitle?: string
  systemDescription?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  logoUrl?: string
  logoUrlDark?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  supportUrl?: string
  websiteUrl?: string
  privacyPolicyUrl?: string
  termsOfServiceUrl?: string
  facebookUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  maintenanceMode?: boolean
  allowRegistration?: boolean
  version?: string
}

export interface PublicSystemConfig {
  systemName: string
  systemTitle: string
  systemDescription?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  logoUrl?: string
  logoUrlDark?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  websiteUrl?: string
  maintenanceMode: boolean
  allowRegistration: boolean
  version?: string
}

export interface FileUploadData {
  type: 'logoUrl' | 'logoUrlDark' | 'faviconUrl'
  base64: string
  filename?: string
}

export interface FileUploadResponse {
  [key: string]: string
  type: string
  filename: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: any
}

class SystemConfigService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('📡 [API] Request:', { method: options.method || 'GET', url });

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      console.log('📥 [API] Response status:', response.status);
      console.log('📥 [API] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Verificar se há conteúdo para fazer parse
      const responseText = await response.text()
      console.log('📥 [API] Response text length:', responseText.length);

      // Se a resposta está vazia
      if (!responseText.trim()) {
        console.warn('⚠️ [API] Empty response body');
        return { success: true, data: null as T }
      }

      // Tentar fazer parse do JSON
      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ [API] Parsed response:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('❌ [API] JSON parse error:', parseError);
        console.error('❌ [API] Response text:', responseText);
        throw new Error('Failed to parse JSON response');
      }
    } catch (error) {
      console.error(`❌ [API] Request failed for ${endpoint}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Request failed',
      }
    }
  }

  async getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
    return this.makeRequest<SystemConfig>('/system-config')
  }

  async getPublicSystemConfig(): Promise<ApiResponse<PublicSystemConfig>> {
    return this.makeRequest<PublicSystemConfig>('/system-config/public')
  }

  async updateSystemConfig(data: SystemConfigUpdate): Promise<ApiResponse<SystemConfig>> {
    return this.makeRequest<SystemConfig>('/system-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async uploadFile(data: FileUploadData): Promise<ApiResponse<FileUploadResponse>> {
    return this.makeRequest<FileUploadResponse>('/system-config/upload', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

export const systemConfigService = new SystemConfigService()