"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/contexts/notification-context";
import {
  type Notification,
  NOTIFICATION_ICONS,
  PRIORITY_COLORS,
  formatRelativeTime,
} from "@/lib/notification-api";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
    pendingSoundNotifications,
    markSoundPlayed,
    playNotificationSound,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const prevUnreadCount = useRef(unreadCount);

  // Tocar som quando novas notificações chegam
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && pendingSoundNotifications.length > 0) {
      playNotificationSound();
      // Marcar sons como tocados
      pendingSoundNotifications.forEach((n) => {
        markSoundPlayed(n.id);
      });
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, pendingSoundNotifications, playNotificationSound, markSoundPlayed]);

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navegar se tiver URL de ação
    if (notification.actionUrl) {
      setOpen(false);
      router.push(notification.actionUrl);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dismiss(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
        >
          <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-primary")} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <DialogTitle>Notificações</DialogTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Lista de notificações */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDismiss={(e) => handleDismiss(e, notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const icon = NOTIFICATION_ICONS[notification.type] || "📣";
  const priorityClass = PRIORITY_COLORS[notification.priority];

  return (
    <div
      className={cn(
        "relative px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 group",
        !notification.isRead && "bg-primary/5",
        notification.isHighlighted && "border-l-4 border-l-yellow-400"
      )}
      onClick={onClick}
    >
      {/* Indicador de não lida */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}

      <div className="flex gap-3 pl-2">
        {/* Ícone */}
        <div className="flex-shrink-0 text-xl">{icon}</div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-medium", !notification.isRead && "font-semibold")}>
              {notification.title}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100 -mr-2"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </span>

            {notification.priority !== "MEDIUM" && (
              <Badge
                variant="outline"
                className={cn("text-xs h-4 px-1", priorityClass)}
              >
                {notification.priority === "URGENT"
                  ? "Urgente"
                  : notification.priority === "HIGH"
                  ? "Alta"
                  : "Baixa"}
              </Badge>
            )}

            {notification.actionLabel && (
              <Badge variant="secondary" className="text-xs h-4 px-1">
                {notification.actionLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
