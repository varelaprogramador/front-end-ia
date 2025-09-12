"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getChatSession, sendMessage, simulateAgentResponse, type ChatSession } from "@/lib/chat"

export function useChat(agentId: string) {
  const queryClient = useQueryClient()

  const { data: chatSession, isLoading } = useQuery({
    queryKey: ["chat", agentId],
    queryFn: () => getChatSession(agentId),
    enabled: !!agentId,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Add user message immediately
      const userMessage = sendMessage(content, "user")

      // Update cache optimistically
      queryClient.setQueryData(["chat", agentId], (old: ChatSession | undefined) => {
        if (!old) return old
        return {
          ...old,
          messages: [...old.messages, userMessage],
          lastMessage: userMessage,
        }
      })

      // Simulate agent response
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000))
      const agentResponse = simulateAgentResponse(content)

      return { userMessage, agentResponse }
    },
    onSuccess: ({ agentResponse }) => {
      // Add agent response to cache
      queryClient.setQueryData(["chat", agentId], (old: ChatSession | undefined) => {
        if (!old) return old
        return {
          ...old,
          messages: [...old.messages, agentResponse],
          lastMessage: agentResponse,
        }
      })
    },
  })

  return {
    chatSession,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  }
}
