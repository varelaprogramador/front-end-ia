export type CredentialType = "GOOGLE_CALENDAR" | "CHATGPT" | "N8N" | "CUSTOM";

export interface Credential {
  id: string;
  userId: string;
  name: string;
  type: CredentialType;
  url: string;
  method: string;
  authHeaderKey: string | null;
  authHeaderValue: string | null;
  customHeaders: Record<string, string> | null;
  awaitResponse: boolean;
  successModel: Record<string, any> | null;
  data: Record<string, any> | null;
  isActive: boolean;
  id_n8n: string | null; // ID da credencial no N8N
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCredentialDto {
  name: string;
  type: CredentialType;
  url: string;
  method?: string;
  authHeaderKey?: string;
  authHeaderValue?: string;
  customHeaders?: Record<string, string>;
  awaitResponse?: boolean;
  successModel?: Record<string, any>;
  data?: Record<string, any>;
}

export interface UpdateCredentialDto extends Partial<CreateCredentialDto> {
  isActive?: boolean;
}

export interface TestCredentialResponse {
  success: boolean;
  status: number;
  statusText: string;
  data: any;
  headers?: any;
  error?: string;
}
