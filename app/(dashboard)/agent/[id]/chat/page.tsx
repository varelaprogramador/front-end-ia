"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AgentContactsList } from "@/components/agent-contacts-list"
import { ContactChatInterface } from "@/components/contact-chat-interface"
import { getAgentById, toggleAgentStatus } from "@/lib/agents"
import { Power, PowerOff, Zap, ZapOff } from "lucide-react"
import { toast } from "sonner"

interface ChatPageProps {
  params: { id: string }
}

export default function ChatPage({ params }: ChatPageProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>()
  const [agent, setAgent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    const loadAgent = async () => {
      setIsLoading(true)
      try {
        console.log("🔄 Carregando agente ID:", params.id)
        const agentData = await getAgentById(params.id)
        console.log("📦 Dados do agente recebidos:", agentData)
        setAgent(agentData || null)
      } catch (error) {
        console.error("❌ Erro ao carregar agente:", error)
        setAgent(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadAgent()
    }
  }, [params.id])
  console.log(agent)

  // Atalho de teclado para toggle rápido
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Space para toggle rápido
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault()
        if (!isToggling && agent) {
          handleToggleStatus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [agent, isToggling])

  const handleToggleStatus = async () => {
    if (!agent) return

    const newStatus = agent.status === "active" ? "inactive" : "active"

    // Confirmação para desativação (mais crítica)
    if (newStatus === "inactive") {
      const confirmed = window.confirm(
        `⚠️ Desativar o agente IA "${agent.name}"?\n\n` +
        "O agente parará de responder às mensagens automaticamente. " +
        "Você poderá reativá-lo a qualquer momento."
      )
      if (!confirmed) return
    }

    setIsToggling(true)

    // Toast informativo durante a alteração
    toast.loading(`${newStatus === "active" ? "Ativando" : "Desativando"} agente IA...`, {
      id: "toggle-status"
    })

    try {
      console.log(`🔄 Toggling agent ${params.id} status to: ${newStatus}`)
      
      const updatedAgent = await toggleAgentStatus(params.id, newStatus)

      if (updatedAgent) {
        // Atualizar o estado local com o agente completo
        setAgent(updatedAgent)

        // Adiciona timestamp ao histórico (simulado)
        const timestamp = new Date().toLocaleString('pt-BR')
        // Feedback sonoro sutil (opcional)
        try {
          // Som discreto usando Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          // Frequência diferente para ativo/inativo
          oscillator.frequency.setValueAtTime(newStatus === "active" ? 800 : 400, audioContext.currentTime)
          oscillator.type = 'sine'

          // Volume baixo e duração curta
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
        } catch (error) {
          // Ignora erros de áudio silenciosamente
        }

        // Toast de sucesso com mais detalhes e timestamp
        toast.success(
          `🤖 Agente IA ${newStatus === "active" ? "ativado" : "desativado"} com sucesso!\n` +
          `${newStatus === "active"
            ? "✅ O agente agora responderá às mensagens automáticamente"
            : "⏸️ O agente não enviará mais respostas automáticas"
          }\n` +
          `⏰ ${timestamp}`, {
          id: "toggle-status",
          duration: 5000
        }
        )

        console.log(`✅ Agent ${updatedAgent.name} status updated to: ${updatedAgent.status}`)
      } else {
        throw new Error("Failed to toggle agent status")
      }
    } catch (error) {
      console.error("Error toggling agent status:", error)

      // Toast de erro mais descritivo
      toast.error(
        `❌ Erro ao ${newStatus === "active" ? "ativar" : "desativar"} o agente IA\n` +
        `💡 Verifique a conexão com o servidor e tente novamente`, {
        id: "toggle-status",
        duration: 6000
      }
      )
    } finally {
      setIsToggling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-80 border-r bg-background p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando chat...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Agente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex h-full relative">
      <AgentContactsList
        agentId={params.id}
        selectedContactId={selectedContactId}
        onSelectContact={setSelectedContactId}
      />

      <div className="flex-1 flex flex-col">
        {/* Header com informações do agente */}
        <div className={`px-4 py-3 border-b bg-gradient-to-r transition-all duration-300 ${agent?.status === "active"
          ? "from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800"
          : "from-red-50 to-rose-50 border-red-200 dark:from-red-950 dark:to-rose-950 dark:border-red-800"
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${agent?.status === "active" ? "bg-green-500" : "bg-red-500"
                }`} />
              <div>
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                <p className={`text-sm ${agent?.status === "active"
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
                  }`}>
                  {agent?.status === "active"
                    ? "🤖 Agente ativo - Respondendo automaticamente"
                    : "⏸️ Agente pausado - Não está respondendo"
                  }
                </p>
              </div>
            </div>

            {/* Mini status indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${agent?.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
              {agent?.status === "active" ? "ATIVO" : "INATIVO"}
            </div>
          </div>
        </div>

        {selectedContactId ? (
          <ContactChatInterface contactId={selectedContactId} agentId={params.id} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${agent?.status === "active"
                ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                }`}>
                {agent?.status === "active" ? (
                  <Zap className="h-8 w-8" />
                ) : (
                  <ZapOff className="h-8 w-8" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat do {agent.name}</h3>
              <p className="text-muted-foreground mb-4">
                Selecione um contato para iniciar a conversa
              </p>

              {/* Status info adicional */}
              <div className={`p-3 rounded-lg text-sm ${agent?.status === "active"
                ? "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                }`}>
                {agent?.status === "active"
                  ? "💡 O agente está ativo e responderá automaticamente às mensagens dos contatos"
                  : "⚠️ O agente está pausado. Ative-o para que responda automaticamente às mensagens"
                }
              </div>

              {/* Dica sobre atalho */}
              <div className="mt-4 text-xs text-muted-foreground">
                💡 Dica: Use <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Ctrl + Space</kbd> para alternar o status rapidamente
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão flutuante de toggle status */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Badge de status */}
        <div className={`absolute -top-2 -left-2 px-2 py-1 rounded-full text-xs font-medium shadow-lg transition-all duration-300 transform group-hover:scale-110 ${agent?.status === "active"
          ? "bg-green-100 text-green-800 border-2 border-green-200 shadow-green-500/20"
          : "bg-red-100 text-red-800 border-2 border-red-200 shadow-red-500/20"
          }`}>
          {agent?.status === "active" ? "🟢 Ativo" : "🔴 Inativo"}
        </div>

        {/* Tooltip de atalho - aparece no hover */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Ctrl + Space para toggle rápido
        </div>

        {/* Botão principal */}
        <Button
          onClick={handleToggleStatus}
          disabled={isToggling}
          size="lg"
          className={`h-16 w-16 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl active:scale-95 border-4 group relative overflow-hidden ${agent?.status === "active"
            ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white border-green-300 shadow-green-500/30"
            : "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-red-300 shadow-red-500/30"
            } ${isToggling ? "animate-pulse cursor-not-allowed" : "cursor-pointer"}`}
          title={`${isToggling ? "Alterando..." : agent?.status === "active" ? "Desativar" : "Ativar"} agente IA\n\nAtalho: Ctrl + Space`}
        >
          {isToggling ? (
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white" />
          ) : agent?.status === "active" ? (
            <div className="flex flex-col items-center relative">
              <Zap className="h-7 w-7 animate-pulse drop-shadow-sm" />
              {/* Brilho adicional para status ativo */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ZapOff className="h-7 w-7 drop-shadow-sm" />
            </div>
          )}

          {/* Efeito de ondulação ao clicar */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150" />
        </Button>

        {/* Efeito de pulsação para status ativo */}
        {agent?.status === "active" && !isToggling && (
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30 -z-10" />
        )}

        {/* Partículas animadas para status ativo (efeito mais sutil) */}
        {agent?.status === "active" && !isToggling && (
          <>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-300 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s' }} />
            <div className="absolute -bottom-1 -right-2 w-1 h-1 bg-green-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -top-2 -left-1 w-1.5 h-1.5 bg-green-200 rounded-full animate-bounce opacity-50" style={{ animationDelay: '1s' }} />
          </>
        )}
      </div>
    </div>
  )
}
