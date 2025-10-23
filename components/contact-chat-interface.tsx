"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Loader2,
  RefreshCw,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  File,
  User,
  Users,
  Clock,
  CheckCheck,
  Check,
  PhoneOff,
  Bot,
  BotOff,
  Smartphone,
  Mic,
  Square,
  X as XIcon,
  Play,
  Pause,
  Download
} from "lucide-react"
import { myMessagesService, type Message } from "@/lib/my-messages-api"
import { evolutionAPIService } from "@/lib/evolution-api"
import {
  getDeactivatedAgentsByConfig,
  createDeactivatedAgent,
  updateDeactivatedAgent,
  type DeactivatedAgent
} from "@/lib/deactivated-agents-api"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useSocket, useTypingIndicator } from "@/lib/socket-context"

interface ContactChatInterfaceProps {
  contactId: string
  agentId: string
}

export function ContactChatInterface({ contactId, agentId }: ContactChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactInfo, setContactInfo] = useState<{
    isGroup: boolean
    chatId: string
    instanceName?: string
  } | null>(null)
  const [isContactDeactivated, setIsContactDeactivated] = useState(false)
  const [deactivatedAgent, setDeactivatedAgent] = useState<DeactivatedAgent | null>(null)
  const [togglingContactStatus, setTogglingContactStatus] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [mediaCache, setMediaCache] = useState<Record<string, string>>({})
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({})
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousContactIdRef = useRef<string | null>(null)

  // ===================================================
  // WebSocket Integration
  // ===================================================

  const {
    joinAgentRoom,
    leaveAgentRoom,
    joinContactRoom,
    leaveContactRoom,
    onNewMessage,
    onMessageUpdate,
    isConnected: socketConnected,
    status: socketStatus
  } = useSocket()

  const { isTyping: contactIsTyping, emitTyping } = useTypingIndicator(contactId)

  // Join appropriate socket rooms
  useEffect(() => {
    if (!socketConnected || !agentId) return

    console.log(`🚪 [WEBSOCKET] Entrando nos rooms - Agent: ${agentId}, Contact: ${contactId}`)

    // Join agent room for general updates
    joinAgentRoom(agentId)

    // Join contact-specific room if contact is selected
    if (contactId) {
      joinContactRoom(agentId, contactId)
    }

    // Cleanup: leave rooms when component unmounts or dependencies change
    return () => {
      console.log(`🚪 [WEBSOCKET] Saindo dos rooms - Agent: ${agentId}, Contact: ${contactId}`)
      leaveAgentRoom(agentId)
      if (contactId) {
        leaveContactRoom(agentId, contactId)
      }
    }
  }, [socketConnected, agentId, contactId, joinAgentRoom, leaveAgentRoom, joinContactRoom, leaveContactRoom])

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!socketConnected) return

    console.log(`👂 [WEBSOCKET] Ouvindo novas mensagens para contact: ${contactId}`)

    const cleanupNewMessage = onNewMessage((newMessage) => {
      console.log(`📨 [WEBSOCKET] Nova mensagem recebida:`, newMessage)

      // Only add if it's for this contact
      if (newMessage.chatId === contactId || newMessage.senderId === contactId) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.messageId === newMessage.messageId || msg.id === newMessage.id)
          if (exists) {
            console.log(`⚠️ [WEBSOCKET] Mensagem duplicada ignorada:`, newMessage.messageId)
            return prev
          }

          // Add new message and sort
          const updated = [...prev, newMessage].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt || 0).getTime()
            const dateB = new Date(b.timestamp || b.createdAt || 0).getTime()
            return dateA - dateB
          })

          console.log(`✅ [WEBSOCKET] Mensagem adicionada. Total: ${updated.length}`)
          return updated
        })

        // Show toast notification for received messages (apenas se for de outro usuário)
        if (newMessage.direction === "received" && !newMessage.isAiResponse) {
          toast.info(`Nova mensagem de ${newMessage.senderName || contactId}`, {
            description: newMessage.message?.substring(0, 50) + (newMessage.message?.length > 50 ? '...' : ''),
            duration: 3000
          })
        } else if (newMessage.isAiResponse) {
          // Notificação discreta para resposta da IA
          toast.success(`IA respondeu`, {
            description: newMessage.aiResponse?.substring(0, 50) + (newMessage.aiResponse && newMessage.aiResponse.length > 50 ? '...' : ''),
            duration: 2000
          })
        }
      } else {
        console.log(`⏭️ [WEBSOCKET] Mensagem ignorada - não é para este contato (atual: ${contactId}, msg: ${newMessage.chatId || newMessage.senderId})`)
      }
    })

    const cleanupMessageUpdate = onMessageUpdate((updatedMessage) => {
      console.log(`🔄 [WEBSOCKET] Mensagem atualizada:`, updatedMessage)

      setMessages((prev) =>
        prev.map(msg =>
          msg.messageId === updatedMessage.messageId || msg.id === updatedMessage.id
            ? { ...msg, ...updatedMessage }
            : msg
        )
      )
    })

    return () => {
      cleanupNewMessage()
      cleanupMessageUpdate()
    }
  }, [socketConnected, contactId, onNewMessage, onMessageUpdate])

  // Emit typing event when user types
  useEffect(() => {
    if (newMessage.trim().length > 0) {
      emitTyping(true)

      // Stop typing indicator after 1 second of no typing
      const timeout = setTimeout(() => {
        emitTyping(false)
      }, 1000)

      return () => clearTimeout(timeout)
    } else {
      emitTyping(false)
    }
  }, [newMessage, emitTyping])

  const loadMessages = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await myMessagesService.getMessagesByAgent(agentId, {
        contactId: contactId,
        limit: 100, // Aumentar limite para mais mensagens
      })

      if (response.success) {
        // Ordenar mensagens por timestamp para exibir cronologicamente
        const sortedMessages = response.data.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime()
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime()
          return dateA - dateB // Mais antigas primeiro
        })

        // Mesclar com mensagens existentes, removendo duplicatas
        setMessages(currentMessages => {
          // Criar mapa de mensagens existentes por ID
          const existingMap = new Map<string, Message>()
          currentMessages.forEach(msg => {
            const key = msg.messageId || msg.id
            existingMap.set(key, msg)
          })

          // Adicionar mensagens do servidor, mantendo as mais recentes
          sortedMessages.forEach(msg => {
            const key = msg.messageId || msg.id
            if (!existingMap.has(key)) {
              existingMap.set(key, msg)
            }
          })

          // Converter de volta para array e ordenar
          const mergedMessages = Array.from(existingMap.values()).sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt || 0).getTime()
            const dateB = new Date(b.timestamp || b.createdAt || 0).getTime()
            return dateA - dateB
          })

          console.log(`📨 [MESSAGES] Mescladas ${mergedMessages.length} mensagens (${currentMessages.length} existentes + ${sortedMessages.length} do servidor)`)
          return mergedMessages
        })

        // Extrair informações do contato da mensagem mais recente
        if (response.data.length > 0) {
          // Buscar mensagem com informações mais completas do contato
          const messageWithContactInfo = response.data.find(msg =>
            msg.senderName && msg.senderName !== contactId
          ) || response.data[0]

          setContactName(messageWithContactInfo.senderName || messageWithContactInfo.senderId || contactId)
          setContactInfo({
            isGroup: messageWithContactInfo.isGroup || false,
            chatId: messageWithContactInfo.chatId || contactId,
            instanceName: messageWithContactInfo.instanceName,
          })
        } else {
          // Se não há mensagens, usar o contactId como nome
          setContactName(contactId)
          setContactInfo({
            isGroup: false,
            chatId: contactId,
            instanceName: undefined,
          })
        }

        console.log(`💬 [CHAT] Carregadas ${response.data.length} mensagens para contato ${contactId}`)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      // Definir valores padrão em caso de erro
      setContactName(contactId)
      setContactInfo({
        isGroup: false,
        chatId: contactId,
        instanceName: undefined,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkContactDeactivationStatus = async () => {
    try {
      const deactivatedAgents = await getDeactivatedAgentsByConfig(agentId, true)

      // Procurar por este contato específico
      // O contactId pode ser o número completo ou apenas o número
      const phoneNumber = contactId.split('@')[0] // Remove @s.whatsapp.net se presente
      const deactivated = deactivatedAgents.find(agent =>
        agent.phoneNumber === phoneNumber ||
        agent.phoneNumber === contactId ||
        agent.phoneNumber.replace(/[^\d]/g, '') === phoneNumber.replace(/[^\d]/g, '')
      )

      setIsContactDeactivated(!!deactivated)
      setDeactivatedAgent(deactivated || null)

      console.log(`🚫 [DEACTIVATION] Status para contato ${contactId}:`, {
        isDeactivated: !!deactivated,
        phoneNumber,
        deactivatedAgent: deactivated
      })
    } catch (error) {
      console.error('Error checking contact deactivation status:', error)
      setIsContactDeactivated(false)
      setDeactivatedAgent(null)
    }
  }

  const handleToggleContactStatus = async () => {
    if (togglingContactStatus) return

    const phoneNumber = contactId.split('@')[0] // Remove @s.whatsapp.net se presente
    const newStatus = !isContactDeactivated

    // Confirmação
    const action = newStatus ? 'desativar a IA' : 'reativar a IA'
    const confirmed = window.confirm(
      `⚠️ Tem certeza que deseja ${action} para este contato?\n\n` +
      `Contato: ${contactName}\n` +
      `Número: ${phoneNumber}\n\n` +
      (newStatus
        ? 'A IA parará de responder às mensagens deste contato.'
        : 'A IA voltará a responder às mensagens deste contato.')
    )

    if (!confirmed) return

    setTogglingContactStatus(true)

    try {
      if (newStatus) {
        // Desativar - criar novo registro
        const newDeactivated = await createDeactivatedAgent({
          configIAId: agentId,
          phoneNumber: phoneNumber,
          reason: `Desativado via interface de chat em ${new Date().toLocaleString('pt-BR')}`,
          blockedBy: 'user'
        })

        if (newDeactivated) {
          setDeactivatedAgent(newDeactivated)
          setIsContactDeactivated(true)
          toast.success(`🚫 IA desativada para ${contactName}`, {
            description: 'O agente não responderá mais às mensagens deste contato'
          })
        }
      } else {
        // Reativar - atualizar registro existente
        if (deactivatedAgent) {
          const updated = await updateDeactivatedAgent(deactivatedAgent.id, { isActive: false })
          if (updated) {
            setDeactivatedAgent(null)
            setIsContactDeactivated(false)
            toast.success(`✅ IA reativada para ${contactName}`, {
              description: 'O agente voltará a responder às mensagens deste contato'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error toggling contact status:', error)
      toast.error('Erro ao alterar status do contato', {
        description: 'Tente novamente em alguns instantes'
      })
    } finally {
      setTogglingContactStatus(false)
    }
  }

  useEffect(() => {
    if (contactId && agentId) {
      // Verificar se o contato realmente mudou
      const contactChanged = previousContactIdRef.current !== contactId

      if (contactChanged) {
        console.log(`🔄 [CHAT] Trocando de contato: ${previousContactIdRef.current} → ${contactId}`)

        // Limpar mensagens ao trocar de contato
        setMessages([])
        previousContactIdRef.current = contactId
      } else {
        console.log(`🔄 [CHAT] Recarregando mensagens para contato ${contactId}`)
      }

      // Reset do estado
      setContactName(contactId)
      setContactInfo(null)
      setIsContactDeactivated(false)
      setDeactivatedAgent(null)

      // Carregar mensagens do servidor (vai mesclar com WebSocket)
      loadMessages()
      checkContactDeactivationStatus()
    }
  }, [contactId, agentId])

  useEffect(() => {
    // Scroll to bottom when messages change
    // Usar timeout para garantir que o DOM foi atualizado
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [messages])

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      // Stop media recorder if still recording
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop()
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [mediaRecorder, isRecording])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !contactInfo?.instanceName) return

    setSending(true)
    const loadingToast = toast.loading("Enviando mensagem...")

    try {
      // Enviar mensagem via Evolution API
      const response = await evolutionAPIService.sendTextMessage({
        instanceName: contactInfo.instanceName,
        remoteJid: contactInfo.chatId,
        message: newMessage.trim(),
        agentId: agentId,
      })

      if (response.success) {
        toast.success("Mensagem enviada com sucesso!", {
          id: loadingToast,
        })

        // Recarregar mensagens após enviar
        await loadMessages(true)
        setNewMessage("")
      } else {
        throw new Error(response.message || "Falha ao enviar mensagem")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Erro ao enviar mensagem", {
        id: loadingToast,
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
      })
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" })
        await sendAudioMessage(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      setMediaRecorder(recorder)
      setAudioChunks(chunks)
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.info("Gravação iniciada", {
        description: "Clique novamente para parar e enviar"
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Erro ao iniciar gravação", {
        description: "Verifique as permissões do microfone"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setRecordingTime(0)
      setAudioChunks([])

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }

      // Stop all tracks
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }

      toast.info("Gravação cancelada")
    }
  }

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!contactInfo?.instanceName) {
      toast.error("Erro ao enviar áudio", {
        description: "Instância não encontrada"
      })
      return
    }

    const loadingToast = toast.loading("Enviando áudio...")

    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        const response = await evolutionAPIService.sendAudioMessage({
          instanceName: contactInfo.instanceName!,
          remoteJid: contactInfo.chatId,
          audioBase64: base64Audio,
          agentId: agentId,
        })

        if (response.success) {
          toast.success("Áudio enviado com sucesso!", {
            id: loadingToast,
          })

          // Recarregar mensagens após enviar
          await loadMessages(true)
          setRecordingTime(0)
        } else {
          throw new Error(response.message || "Falha ao enviar áudio")
        }
      }

      reader.onerror = () => {
        throw new Error("Erro ao processar áudio")
      }
    } catch (error) {
      console.error("Error sending audio:", error)
      toast.error("Erro ao enviar áudio", {
        id: loadingToast,
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
      })
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMediaBase64 = async (message: Message) => {
    if (!message.messageId || !contactInfo?.instanceName) return null

    // Check cache first
    const cacheKey = message.messageId
    if (mediaCache[cacheKey]) {
      return mediaCache[cacheKey]
    }

    // Check if already loading
    if (loadingMedia[cacheKey]) return null

    try {
      setLoadingMedia(prev => ({ ...prev, [cacheKey]: true }))

      const response = await evolutionAPIService.getMediaBase64({
        instanceName: contactInfo.instanceName,
        messageKey: {
          id: message.messageId,
          remoteJid: message.chatId,
          fromMe: message.direction === "sent",
        },
        convertToMp4: message.messageType === "video",
      })

      if (response.success && response.data?.base64) {
        // Se a Evolution API retorna o base64 com data URI prefix, usar diretamente
        let base64 = response.data.base64

        // Se o base64 não tem prefixo data URI, adicionar
        if (!base64.startsWith('data:')) {
          // Usar mimetype da resposta, ou fallback para message.mediaType
          const mimetype = response.data.mimetype || message.mediaType || 'application/octet-stream'
          base64 = `data:${mimetype};base64,${base64}`
          console.log('🎵 [MEDIA] Adicionado prefixo data URI:', {
            messageId: message.messageId,
            mimetype,
            source: response.data.mimetype ? 'backend' : 'message.mediaType',
            base64Length: base64.length,
            hasPrefix: base64.startsWith('data:')
          })
        }

        setMediaCache(prev => ({ ...prev, [cacheKey]: base64 }))
        return base64
      }

      return null
    } catch (error) {
      console.error("Error fetching media base64:", error)
      return null
    } finally {
      setLoadingMedia(prev => ({ ...prev, [cacheKey]: false }))
    }
  }

  const handleRefresh = () => {
    loadMessages(true)
  }

  const formatMessageTime = (timestamp?: string | null) => {
    if (!timestamp) return ""

    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return format(date, "HH:mm")
    } else {
      return format(date, "dd/MM HH:mm")
    }
  }

  const getMessageStatusIcon = (message: Message) => {
    if (message.direction === "sent") {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    }
    return null
  }

  // Audio Player Component
  const AudioPlayer = ({ message }: { message: Message }) => {
    const [audioSrc, setAudioSrc] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [transcription, setTranscription] = useState<string | null>(null)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [audioError, setAudioError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
      const loadAudio = async () => {
        const base64 = await getMediaBase64(message)
        if (base64) {
          console.log('🎵 [AUDIO] Carregando áudio:', {
            messageId: message.messageId,
            hasDataPrefix: base64.startsWith('data:'),
            base64Length: base64.length,
            base64Preview: base64.substring(0, 100),
            mediaType: message.mediaType,
            messageType: message.messageType,
          })

          // getMediaBase64 já retorna o base64 com o prefixo correto
          setAudioSrc(base64)
          setAudioError(null)
        } else {
          console.error('❌ [AUDIO] Não foi possível carregar o base64 do áudio')
          setAudioError('Não foi possível carregar o áudio')
        }
      }
      loadAudio()
    }, [message.messageId])

    const togglePlayPause = async () => {
      if (!audioRef.current) {
        console.error('❌ [AUDIO] audioRef.current é null')
        return
      }

      const audio = audioRef.current

      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        console.log('⏸️ [AUDIO] Áudio pausado')
      } else {
        try {
          console.log('▶️ [AUDIO] Tentando reproduzir:', {
            src: audio.src?.substring(0, 100),
            readyState: audio.readyState,
            networkState: audio.networkState,
            duration: audio.duration,
            canPlay: audio.readyState >= 2
          })

          // Verificar se o áudio está pronto
          if (audio.readyState < 2) {
            console.warn('⚠️ [AUDIO] Áudio ainda não está pronto, aguardando...')
            setAudioError('Aguardando carregamento do áudio...')

            // Esperar o áudio ficar pronto
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout ao carregar áudio'))
              }, 5000)

              audio.oncanplay = () => {
                clearTimeout(timeout)
                resolve()
              }

              audio.onerror = () => {
                clearTimeout(timeout)
                reject(new Error('Erro ao carregar áudio'))
              }
            })

            setAudioError(null)
          }

          // Tentar reproduzir
          const playPromise = audio.play()

          if (playPromise !== undefined) {
            await playPromise
            setIsPlaying(true)
            setAudioError(null)
            console.log('✅ [AUDIO] Reprodução iniciada com sucesso')
          }
        } catch (error) {
          console.error('❌ [AUDIO] Erro ao tentar reproduzir:', error)
          setIsPlaying(false)

          if (error instanceof Error) {
            if (error.name === 'NotSupportedError') {
              setAudioError('Formato de áudio não suportado pelo navegador')
            } else if (error.name === 'NotAllowedError') {
              setAudioError('Reprodução bloqueada. Clique novamente para permitir')
            } else {
              setAudioError(`Erro ao reproduzir: ${error.message}`)
            }
          } else {
            setAudioError('Erro desconhecido ao reproduzir áudio')
          }
        }
      }
    }

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        const audio = audioRef.current
        setDuration(audio.duration)
        console.log('📊 [AUDIO] Metadata carregada:', {
          duration: audio.duration,
          readyState: audio.readyState,
          networkState: audio.networkState,
          canPlay: audio.readyState >= 2
        })
      }
    }

    const handleCanPlay = () => {
      console.log('✅ [AUDIO] Áudio pronto para reprodução (canplay event)')
      setAudioError(null)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const audio = e.currentTarget
      console.error('❌ [AUDIO] Erro ao reproduzir áudio:', {
        error: audio.error,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
        src: audioSrc?.substring(0, 100),
        networkState: audio.networkState,
        readyState: audio.readyState,
      })
      setAudioError(`Erro ao reproduzir áudio (código: ${audio.error?.code})`)
      setIsPlaying(false)
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleTranscribe = async () => {
      if (!audioSrc || !contactInfo?.instanceName) return

      setIsTranscribing(true)
      toast.loading("Interpretando áudio...", { id: "transcribe-audio" })

      try {
        // TODO: Implementar endpoint de transcrição no backend
        // Por enquanto, mostrar mensagem placeholder
        setTimeout(() => {
          setTranscription("Transcrição do áudio aparecerá aqui.")
          toast.success("Áudio interpretado!", { id: "transcribe-audio" })
          setIsTranscribing(false)
        }, 2000)
      } catch (error) {
        console.error("Error transcribing audio:", error)
        toast.error("Erro ao interpretar áudio", { id: "transcribe-audio" })
        setIsTranscribing(false)
      }
    }

    if (!audioSrc && loadingMedia[message.messageId]) {
      return (
        <div className="flex items-center space-x-2 p-2 rounded bg-black/10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Carregando áudio...</span>
        </div>
      )
    }

    if (!audioSrc) {
      return (
        <div className="flex items-center space-x-2 p-2 rounded bg-black/10">
          <Mic className="h-4 w-4" />
          <span className="text-xs">Áudio indisponível</span>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 p-2 rounded bg-black/10">
          <audio
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onEnded={handleEnded}
            onError={handleError}
            preload="metadata"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePlayPause}
            disabled={!!audioError}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-xs">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {audioError && (
          <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">{audioError}</p>
          </div>
        )}


      </div>
    )
  }

  // Image Viewer Component
  const ImageViewer = ({ message }: { message: Message }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
      const loadImage = async () => {
        const base64 = await getMediaBase64(message)
        if (base64) {
          // Ensure proper data URI format
          const imageDataUri = base64.startsWith('data:') ? base64 : `data:${message.mediaType || 'image/jpeg'};base64,${base64}`
          setImageSrc(imageDataUri)
        }
      }
      loadImage()
    }, [message.messageId])

    if (!imageSrc && loadingMedia[message.messageId]) {
      return (
        <div className="flex items-center justify-center p-4 rounded bg-black/10 min-h-[120px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )
    }

    if (!imageSrc) {
      return (
        <div className="flex items-center space-x-2 p-2 rounded bg-black/10">
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs">Imagem indisponível</span>
        </div>
      )
    }

    return (
      <>
        <div className="mt-2 rounded overflow-hidden max-w-xs cursor-pointer" onClick={() => setIsFullscreen(true)}>
          <img src={imageSrc} alt="Imagem" className="w-full h-auto" />
        </div>
        {isFullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <img src={imageSrc} alt="Imagem" className="max-w-full max-h-full object-contain" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              <XIcon className="h-6 w-6" />
            </Button>
          </div>
        )}
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando conversa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full overflow-hidden">
      {/* Header do Chat estilo WhatsApp */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar do contato */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                {contactInfo?.isGroup ? (
                  <Users className="h-6 w-6" />
                ) : (
                  <span className="text-sm">
                    {contactName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {contactName}
                </h3>
                {isContactDeactivated && (
                  <BotOff className="h-4 w-4 text-red-500" aria-label="IA desativada para este contato" />
                )}
                {contactInfo?.isGroup && (
                  <Users className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                <span className="truncate">
                  {isContactDeactivated
                    ? "IA desativada"
                    : contactIsTyping
                      ? "digitando..."
                      : "online"
                  }
                </span>
                {contactInfo?.instanceName && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Smartphone className="h-3 w-3" />
                      <span className="text-xs font-medium truncate">
                        {contactInfo.instanceName}
                      </span>
                    </div>
                  </>
                )}
                {/* WebSocket connection indicator */}
                <span>•</span>
                <div className="flex items-center space-x-1" title={`WebSocket: ${socketStatus}`}>
                  <div className={`w-2 h-2 rounded-full ${socketConnected
                      ? "bg-green-500 animate-pulse"
                      : socketStatus === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-red-500"
                    }`} />
                  <span className="text-xs">
                    {socketConnected ? "conectado" : socketStatus === "connecting" ? "conectando" : "desconectado"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar conversa"
              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleContactStatus}
              disabled={togglingContactStatus}
              title={
                togglingContactStatus
                  ? "Alterando status..."
                  : isContactDeactivated
                    ? "Reativar IA para este contato"
                    : "Desativar IA para este contato"
              }
              className={`h-8 w-8 ${isContactDeactivated
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                }`}
            >
              {togglingContactStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isContactDeactivated ? (
                <BotOff className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </Button>

            <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" disabled className="h-8 w-8 text-gray-400">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area estilo WhatsApp */}
      <ScrollArea className="flex-1 min-h-3" ref={scrollAreaRef}>
        <div
          className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-opacity='0.03'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {contactInfo?.isGroup ? (
                    <Users className="h-8 w-8 text-gray-400" />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Conversa com {contactName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma mensagem ainda. Envie a primeira mensagem!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.direction === "sent"
                const isAI = message.isAiResponse
                // Mensagens da IA devem ser alinhadas à direita como se fossem enviadas por você
                const alignRight = isOwn || isAI
                const showAvatar = !alignRight && (index === 0 || messages[index - 1]?.senderId !== message.senderId)
                const showName = !alignRight && contactInfo?.isGroup && showAvatar

                return (
                  <div
                    key={message.id}
                    className={`flex ${alignRight ? "justify-end" : "justify-start"} mb-1`}
                  >
                    {!alignRight && showAvatar && (
                      <div className="mr-2 mt-1 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                          {contactInfo?.isGroup ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <span>
                              {(message.senderName || contactName).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] relative ${alignRight ? "ml-12" : "mr-12"
                        }`}
                    >
                      {showName && (
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-3">
                          {message.senderName || message.senderId}
                        </p>
                      )}

                      <div
                        className={`rounded-lg px-3 py-2 shadow-sm relative ${alignRight
                          ? "bg-green-500 text-white rounded-br-none"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                          }`}
                      >
                        {/* Tail da mensagem */}
                        <div
                          className={`absolute bottom-0 w-3 h-3 ${alignRight
                            ? "-right-1 bg-green-500"
                            : "-left-1 bg-white dark:bg-gray-700"
                            }`}
                          style={{
                            clipPath: alignRight
                              ? "polygon(0 0, 100% 0, 0 100%)"
                              : "polygon(100% 0, 100% 100%, 0 100%)"
                          }}
                        />

                        {isAI && (
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center bg-white/20 px-2 py-1 rounded">
                              <Bot className="h-3 w-3 mr-1 text-white" />
                              <span className="text-xs font-medium text-white">
                                Assistente IA
                              </span>
                            </div>
                            {message.instanceName && (
                              <div className="flex items-center space-x-1">
                                <Smartphone className="h-3 w-3 text-white/80" />
                                <span className="text-xs text-white/80 font-mono">
                                  {message.instanceName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mostra instância para mensagens normais também (não só IA) */}
                        {!isAI && message.instanceName && (
                          <div className="flex items-center mb-1">
                            <Smartphone className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              via {message.instanceName}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          {/* Mensagem principal */}
                          {message.message && (
                            <p className="text-sm break-words leading-relaxed">
                              {isAI ? message.aiResponse : message.message || message.content}
                            </p>
                          )}

                          {/* Media content */}
                          {(message.mediaType === "audio" || message.messageType === "audioMessage") && <AudioPlayer message={message} />}
                          {message.mediaType?.startsWith("image/") && <ImageViewer message={message} />}
                          {message.mediaType && !message.mediaType.startsWith("image/") && message.mediaType !== "audio" && message.messageType !== "audioMessage" && (
                            <div className="flex items-center space-x-2 mt-2 p-2 rounded bg-black/10">
                              <File className="h-4 w-4" />
                              <span className="text-xs">
                                {message.fileName || "Arquivo de mídia"}
                              </span>
                            </div>
                          )}

                          {/* Caption */}
                          {message.caption && (
                            <p className="text-xs opacity-75 italic mt-1">
                              {message.caption}
                            </p>
                          )}
                        </div>

                        {/* Message footer */}
                        <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${alignRight ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                          }`}>
                          <span>{formatMessageTime(message.timestamp || message.createdAt)}</span>
                          {alignRight && (
                            <div className="flex items-center space-x-1">
                              {getMessageStatusIcon(message)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!alignRight && !showAvatar && <div className="w-10 flex-shrink-0"></div>}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Input Area estilo WhatsApp */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {isRecording ? (
          // Recording UI
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-full px-4 py-3 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Gravando...
                </span>
              </div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {formatRecordingTime(recordingTime)}
              </span>
            </div>

            <Button
              type="button"
              onClick={cancelRecording}
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Cancelar gravação"
            >
              <XIcon className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              onClick={stopRecording}
              className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
              title="Enviar áudio"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          // Normal message input UI
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-12 py-3 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-green-500 focus:border-green-500"
                disabled={sending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
              >
                😊
              </Button>
            </div>

            {newMessage.trim() ? (
              <Button
                type="submit"
                disabled={sending}
                className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                title="Enviar mensagem"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={startRecording}
                disabled={!contactInfo?.instanceName}
                className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all hover:scale-105"
                title="Gravar áudio"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </form>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {isRecording
            ? "Gravando áudio - Clique no botão verde para enviar ou no X para cancelar"
            : "As mensagens são criptografadas de ponta a ponta e processadas pela IA"
          }
        </p>
      </div>
    </div>
  )
}
