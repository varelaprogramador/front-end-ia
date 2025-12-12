"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUserId } from "@/lib/use-user-id";
import { toast } from "sonner";
import { useSocket, type NotificationPayload } from "@/lib/socket-context";
import {
  notificationApiService,
  type Notification,
  type NotificationType,
  NOTIFICATION_ICONS,
} from "@/lib/notification-api";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  highlightedLeadIds: string[];
  loading: boolean;
  error: string | null;
  // Ações
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  markSoundPlayed: (id: string) => Promise<void>;
  isLeadHighlighted: (leadId: string) => boolean;
  getLeadHighlightType: (leadId: string) => NotificationType | null;
  // Som
  pendingSoundNotifications: { id: string; type: NotificationType }[];
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Som de notificação em base64 - "ding" curto e agradável
// Este é um arquivo WAV válido gerado programaticamente
const generateNotificationSound = () => {
  // Parâmetros do som
  const sampleRate = 22050;
  const duration = 0.3; // 300ms
  const frequency = 880; // A5 note (880 Hz)
  const numSamples = Math.floor(sampleRate * duration);

  // Criar buffer de áudio
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels (mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Gerar onda senoidal com envelope (fade in/out)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Envelope: rápido fade in, longo fade out
    const envelope = Math.min(1, t * 20) * Math.exp(-t * 8);
    // Harmônicos para um som mais rico
    const sample = envelope * (
      Math.sin(2 * Math.PI * frequency * t) * 0.6 +
      Math.sin(2 * Math.PI * frequency * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * frequency * 3 * t) * 0.1
    );
    view.setInt16(44 + i * 2, Math.floor(sample * 32767 * 0.8), true);
  }

  // Converter para base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const userId = useUserId();
  const { joinUserRoom, leaveUserRoom, onNotification, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highlightedLeadIds, setHighlightedLeadIds] = useState<string[]>([]);
  const [leadNotificationMap, setLeadNotificationMap] = useState<Map<string, NotificationType>>(new Map());
  const [loading, setLoading] = useState(false); // Começa false para não bloquear UI
  const [error, setError] = useState<string | null>(null);
  const [pendingSoundNotifications, setPendingSoundNotifications] = useState<
    { id: string; type: NotificationType }[]
  >([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Criar elemento de áudio
  useEffect(() => {
    if (typeof window !== "undefined") {
      const soundUrl = generateNotificationSound();
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = 0.5;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Audio play failed (user interaction required):", err);
      });
    }
  }, []);

  // Buscar notificações
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const [notifResponse, countResponse, highlightResponse] = await Promise.all([
        notificationApiService.getNotifications({ userId, limit: 50 }),
        notificationApiService.getUnreadCount(userId),
        notificationApiService.getHighlightedNotifications(userId),
      ]);

      if (notifResponse.success && notifResponse.data) {
        setNotifications(notifResponse.data);
      }

      if (countResponse.success && countResponse.data) {
        setUnreadCount(countResponse.data.count);

        // Verificar notificações com som pendente
        if (countResponse.data.soundNotifications.length > 0) {
          setPendingSoundNotifications(countResponse.data.soundNotifications);
          // Tocar som automaticamente
          playNotificationSound();
        }
      }

      if (highlightResponse.success && highlightResponse.data) {
        setHighlightedLeadIds(highlightResponse.data.highlightedLeadIds);

        // Criar mapa de leadId -> tipo de notificação
        const newMap = new Map<string, NotificationType>();
        for (const notif of highlightResponse.data.notifications) {
          if (notif.leadId) {
            newMap.set(notif.leadId, notif.type);
          }
        }
        setLeadNotificationMap(newMap);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }, [userId, playNotificationSound]);

  // Polling para buscar novas notificações (fallback quando WebSocket não está conectado)
  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // Polling a cada 30 segundos (mais espaçado quando WebSocket está ativo)
      const interval = isConnected ? 60000 : 30000;
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, interval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [userId, fetchNotifications, isConnected]);

  // Entrar na sala de notificações do usuário via WebSocket
  useEffect(() => {
    if (userId && isConnected) {
      console.log("🔔 Entrando na sala de notificações do usuário:", userId);
      joinUserRoom(userId);

      return () => {
        console.log("🔕 Saindo da sala de notificações do usuário:", userId);
        leaveUserRoom(userId);
      };
    }
  }, [userId, isConnected, joinUserRoom, leaveUserRoom]);

  // Escutar notificações em tempo real via WebSocket
  useEffect(() => {
    if (!userId) return;

    const cleanup = onNotification((notification: NotificationPayload) => {
      console.log("🔔 Nova notificação em tempo real:", notification);

      // Converter payload para tipo Notification
      const newNotification: Notification = {
        id: notification.id,
        userId: notification.userId,
        funnelId: notification.funnelId,
        leadId: notification.leadId,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        priority: notification.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        isRead: false,
        isHighlighted: notification.isHighlighted,
        playSound: notification.playSound,
        soundPlayed: false,
        isDismissed: false,
        createdAt: notification.createdAt,
      };

      // Adicionar à lista de notificações
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Atualizar highlighted leads se aplicável
      if (notification.isHighlighted && notification.leadId) {
        setHighlightedLeadIds((prev) =>
          prev.includes(notification.leadId!) ? prev : [...prev, notification.leadId!]
        );
        setLeadNotificationMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(notification.leadId!, notification.type as NotificationType);
          return newMap;
        });
      }

      // Tocar som se necessário
      if (notification.playSound) {
        playNotificationSound();
      }

      // Mostrar toast global
      const icon = NOTIFICATION_ICONS[notification.type as NotificationType] || "📣";
      toast(notification.title, {
        description: notification.message,
        icon: icon,
        duration: 5000,
        action: notification.actionUrl ? {
          label: notification.actionLabel || "Ver",
          onClick: () => {
            window.location.href = notification.actionUrl!;
          },
        } : undefined,
      });
    });

    return cleanup;
  }, [userId, onNotification, playNotificationSound]);

  // Marcar como lida
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await notificationApiService.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await notificationApiService.markAllAsRead(userId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [userId]);

  // Dispensar notificação
  const dismiss = useCallback(async (id: string) => {
    try {
      const response = await notificationApiService.dismiss(id);
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Atualizar highlightedLeadIds
        const notification = notifications.find((n) => n.id === id);
        if (notification?.leadId) {
          setHighlightedLeadIds((prev) => prev.filter((leadId) => leadId !== notification.leadId));
          setLeadNotificationMap((prev) => {
            const newMap = new Map(prev);
            newMap.delete(notification.leadId!);
            return newMap;
          });
        }
      }
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  }, [notifications]);

  // Marcar som como tocado
  const markSoundPlayed = useCallback(async (id: string) => {
    try {
      await notificationApiService.markSoundPlayed(id);
      setPendingSoundNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error marking sound as played:", err);
    }
  }, []);

  // Verificar se um lead está destacado
  const isLeadHighlighted = useCallback(
    (leadId: string) => highlightedLeadIds.includes(leadId),
    [highlightedLeadIds]
  );

  // Obter tipo de notificação de um lead
  const getLeadHighlightType = useCallback(
    (leadId: string): NotificationType | null => leadNotificationMap.get(leadId) || null,
    [leadNotificationMap]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        highlightedLeadIds,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismiss,
        markSoundPlayed,
        isLeadHighlighted,
        getLeadHighlightType,
        pendingSoundNotifications,
        playNotificationSound,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
