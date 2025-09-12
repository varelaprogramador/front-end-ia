// Tipos para Instâncias do Evolution API

export interface EvolutionInstance {
  id: string;
  userId: string;
  apiKey?: string;
  instanceName: string;
  displayName: string;
  connectionState: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";
  ownerJid?: string;
  profileName?: string;
  profilePictureUrl?: string;
  status: "active" | "inactive" | "suspended";
  serverUrl?: string;
  webhookUrl?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  webhookEvents?: string[];
  isDefault?: boolean;
  sendConnectionStatus?: boolean;
  chatwootAccountId?: string;
  chatwootToken?: string;
  chatwootUrl?: string;
  chatwootSignMsg?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvolutionInstanceRequest {
  userId: string;
  instanceName: string;
  displayName?: string;
  serverUrl?: string;
  evolutionUrl?: string;
  apiKey: string;
  webhook?: string;
  webhookUrl?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  webhookEvents?: string[];
  events?: string[];
  isDefault?: boolean;
  sendConnectionStatus?: boolean;
  chatwootAccountId?: string;
  chatwootToken?: string;
  chatwootUrl?: string;
  chatwootSignMsg?: boolean;
}

export interface UpdateEvolutionInstanceRequest {
  instanceName?: string;
  displayName?: string;
  serverUrl?: string;
  evolutionUrl?: string;
  apiKey?: string;
  webhook?: string;
  webhookUrl?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  webhookEvents?: string[];
  events?: string[];
  isDefault?: boolean;
  sendConnectionStatus?: boolean;
  chatwootAccountId?: string;
  chatwootToken?: string;
  chatwootUrl?: string;
  chatwootSignMsg?: boolean;
  status?: "active" | "inactive" | "suspended";
  connectionState?: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";
}

export interface EvolutionInstanceStats {
  totalInstances: number;
  connectedInstances: number;
  disconnectedInstances: number;
  errorInstances: number;
}

export interface QRCodeResponse {
  base64?: string;
  code: string;
  count: number;
  pairingCode?: string;
}

export interface ConnectionStatus {
  instanceName: string;
  state: "open" | "close" | "connecting";
  connectionAttempts?: number;
}

export interface InstanceWebhookEvent {
  event: string;
  instance: string;
  data: any;
  date_time: string;
  sender: string;
  server_url: string;
  api_key: string;
}

// Eventos disponíveis do Evolution API
export const EVOLUTION_EVENTS = [
  "APPLICATION_STARTUP",
  "QRCODE_UPDATED",
  "CONNECTION_UPDATE",
  "STATUS_INSTANCE",
  "MESSAGES_UPSERT",
  "MESSAGES_UPDATE",
  "MESSAGES_DELETE",
  "SEND_MESSAGE",
  "CONTACTS_SET",
  "CONTACTS_UPSERT",
  "CONTACTS_UPDATE",
  "PRESENCE_UPDATE",
  "CHATS_SET",
  "CHATS_UPSERT",
  "CHATS_UPDATE",
  "CHATS_DELETE",
  "GROUPS_UPSERT",
  "GROUP_UPDATE",
  "GROUP_PARTICIPANTS_UPDATE",
  "NEW_JWT_TOKEN",
  "TYPEBOT_START",
  "TYPEBOT_CHANGE_STATUS",
] as const;

export type EvolutionEventType = (typeof EVOLUTION_EVENTS)[number];
