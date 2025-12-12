import { API_BASE_URL } from "./api-config";

// Tipos de notificação
export type NotificationType =
  | "LEAD_EXITED_FOLLOWUP"
  | "LEAD_MARKED_WON"
  | "LEAD_MARKED_LOST"
  | "FOLLOWUP_COMPLETED"
  | "LEAD_RESPONDED"
  | "AGENT_ACTIVATED"
  | "AGENT_DEACTIVATED"
  | "AGENT_ERROR"
  | "WHATSAPP_DISCONNECTED"
  | "WHATSAPP_CONNECTED"
  | "NEW_LEAD"
  | "LEAD_STAGE_CHANGED"
  | "SYSTEM_ALERT"
  | "SYSTEM_INFO";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Notification {
  id: string;
  userId: string;
  funnelId?: string;
  leadId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  priority: NotificationPriority;
  isHighlighted: boolean;
  highlightUntil?: string;
  isRead: boolean;
  readAt?: string;
  isDismissed: boolean;
  dismissedAt?: string;
  playSound: boolean;
  soundPlayed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  metadata?: {
    total?: number;
    unreadCount?: number;
    limit?: number;
    offset?: number;
  };
}

export interface UnreadCountResponse {
  count: number;
  pendingSound: number;
  soundNotifications: { id: string; type: NotificationType; priority: NotificationPriority }[];
}

export interface HighlightedResponse {
  notifications: Notification[];
  highlightedLeadIds: string[];
}

class NotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/notifications`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<NotificationApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error("Notification API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // Listar notificações do usuário
  async getNotifications(params: {
    userId: string;
    unreadOnly?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
  }): Promise<NotificationApiResponse<Notification[]>> {
    const queryParams = new URLSearchParams({
      userId: params.userId,
      ...(params.unreadOnly && { unreadOnly: "true" }),
      ...(params.type && { type: params.type }),
      ...(params.limit && { limit: params.limit.toString() }),
      ...(params.offset && { offset: params.offset.toString() }),
    });

    return this.makeRequest<Notification[]>(`?${queryParams.toString()}`);
  }

  // Contar notificações não lidas
  async getUnreadCount(userId: string): Promise<NotificationApiResponse<UnreadCountResponse>> {
    return this.makeRequest<UnreadCountResponse>(`/unread-count?userId=${userId}`);
  }

  // Buscar notificações destacadas (para o funil)
  async getHighlightedNotifications(
    userId: string,
    funnelId?: string
  ): Promise<NotificationApiResponse<HighlightedResponse>> {
    const queryParams = new URLSearchParams({ userId });
    if (funnelId) {
      queryParams.append("funnelId", funnelId);
    }
    return this.makeRequest<HighlightedResponse>(`/highlighted?${queryParams.toString()}`);
  }

  // Marcar como lida
  async markAsRead(notificationId: string): Promise<NotificationApiResponse<Notification>> {
    return this.makeRequest<Notification>(`/${notificationId}/read`, {
      method: "PATCH",
    });
  }

  // Marcar todas como lidas
  async markAllAsRead(userId: string): Promise<NotificationApiResponse<void>> {
    return this.makeRequest<void>("/read-all", {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    });
  }

  // Marcar som como tocado
  async markSoundPlayed(notificationId: string): Promise<NotificationApiResponse<Notification>> {
    return this.makeRequest<Notification>(`/${notificationId}/sound-played`, {
      method: "PATCH",
    });
  }

  // Dispensar notificação
  async dismiss(notificationId: string): Promise<NotificationApiResponse<Notification>> {
    return this.makeRequest<Notification>(`/${notificationId}/dismiss`, {
      method: "PATCH",
    });
  }

  // Deletar notificação
  async delete(notificationId: string): Promise<NotificationApiResponse<void>> {
    return this.makeRequest<void>(`/${notificationId}`, {
      method: "DELETE",
    });
  }
}

// Exportar instância singleton
export const notificationApiService = new NotificationService();

// Utilitários para notificações

// Ícones para cada tipo de notificação
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  LEAD_EXITED_FOLLOWUP: "🔔",
  LEAD_MARKED_WON: "🎉",
  LEAD_MARKED_LOST: "❌",
  FOLLOWUP_COMPLETED: "✅",
  LEAD_RESPONDED: "💬",
  AGENT_ACTIVATED: "🤖",
  AGENT_DEACTIVATED: "⏸️",
  AGENT_ERROR: "⚠️",
  WHATSAPP_DISCONNECTED: "📵",
  WHATSAPP_CONNECTED: "📱",
  NEW_LEAD: "🆕",
  LEAD_STAGE_CHANGED: "➡️",
  SYSTEM_ALERT: "🚨",
  SYSTEM_INFO: "ℹ️",
};

// Cores para cada prioridade
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
};

// Cores de destaque para leads
export const HIGHLIGHT_COLORS: Record<NotificationType, string> = {
  LEAD_EXITED_FOLLOWUP: "ring-2 ring-yellow-400 ring-offset-2 animate-pulse",
  LEAD_RESPONDED: "ring-2 ring-green-400 ring-offset-2",
  LEAD_MARKED_WON: "ring-2 ring-emerald-400 ring-offset-2",
  LEAD_MARKED_LOST: "ring-2 ring-red-400 ring-offset-2",
  NEW_LEAD: "ring-2 ring-blue-400 ring-offset-2 animate-pulse",
  FOLLOWUP_COMPLETED: "",
  AGENT_ACTIVATED: "",
  AGENT_DEACTIVATED: "",
  AGENT_ERROR: "",
  WHATSAPP_DISCONNECTED: "",
  WHATSAPP_CONNECTED: "",
  LEAD_STAGE_CHANGED: "",
  SYSTEM_ALERT: "",
  SYSTEM_INFO: "",
};

// Função para formatar tempo relativo
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "agora";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else if (diffDays === 1) {
    return "ontem";
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  } else {
    return date.toLocaleDateString("pt-BR");
  }
}
