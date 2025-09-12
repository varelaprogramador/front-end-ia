import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ChatMessage as Message } from "@/lib/chat"
import { Check, CheckCheck } from "lucide-react"

interface ChatMessageProps {
  message: Message
  agentName: string
}

export function ChatMessage({ message, agentName }: ChatMessageProps) {
  const isAgent = message.sender === "agent"
  const isUser = message.sender === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} mb-4`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isAgent ? "bg-primary text-primary-foreground" : "bg-secondary"}>
          {isAgent ? agentName.charAt(0) : "U"}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[70%]`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-muted-foreground rounded-bl-md"
          }`}
        >
          <p className="text-sm text-pretty">{message.content}</p>
        </div>

        <div className={`flex items-center gap-1 mt-1 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {isUser && (
            <div className="flex items-center">
              {message.status === "sent" && <Check className="h-3 w-3 text-muted-foreground" />}
              {message.status === "delivered" && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
              {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
