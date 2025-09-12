"use client"

import { useEffect, useRef } from "react"
import { ChatHeader } from "./chat-header"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { useChat } from "@/hooks/use-chat"
import type { Agent } from "@/lib/agents"

interface ChatInterfaceProps {
  agent: Agent
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const { chatSession, isLoading, sendMessage, isSending } = useChat(agent.id)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatSession?.messages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    )
  }

  if (!chatSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chat não encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader agent={agent} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatSession.messages.map((message) => (
          <ChatMessage key={message.id} message={message} agentName={agent.name} />
        ))}

        {isSending && (
          <div className="flex gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm">{agent.name.charAt(0)}</span>
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={sendMessage} disabled={isSending} />
    </div>
  )
}
