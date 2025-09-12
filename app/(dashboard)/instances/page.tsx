"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axios from 'axios'
import { API_BASE_URL } from "@/lib/api-config"
import type { EvolutionInstance, EvolutionInstanceStats } from "@/lib/types/evolution-instance"
import { EvolutionInstanceForm } from "@/components/evolution-instance-form"
import { Plus, Search, Loader2, RefreshCw, Smartphone, Wifi, WifiOff, AlertCircle, Zap, Power, PowerOff, QrCode, Trash2, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserId } from "@/lib/use-user-id"

export default function InstancesPage() {
  const [instances, setInstances] = useState<EvolutionInstance[]>([])
  const [filteredInstances, setFilteredInstances] = useState<EvolutionInstance[]>([])
  const [stats, setStats] = useState<EvolutionInstanceStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingInstance, setEditingInstance] = useState<EvolutionInstance | undefined>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connectingInstances, setConnectingInstances] = useState<Set<string>>(new Set())
  const [qrCodeData, setQrCodeData] = useState<{
    base64: string
    instanceName: string
    count: number
  } | null>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)
  const { toast } = useToast()
  const userId = useUserId()

  // Função para carregar instâncias e estatísticas
  const loadInstances = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      if (!userId) {
        console.warn("loadInstances: usuário não autenticado")
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const [instancesResponse, statsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/evolution-instances/user/${userId}`),
        axios.get(`${API_BASE_URL}/evolution-instances/stats/${userId}`)
      ])

      const instancesList = instancesResponse.data.success ? instancesResponse.data.instances || [] : []
      const statsData = statsResponse.data.success ? statsResponse.data.stats : null

      setInstances(instancesList)
      setFilteredInstances(instancesList || [])
      setStats(statsData)
    } catch (error) {
      console.error('Error loading instances:', error)
      toast({
        title: "Erro ao carregar instâncias",
        description: "Não foi possível carregar a lista de instâncias. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar instâncias na inicialização
  useEffect(() => {
    if (userId) {
      loadInstances()
    }
  }, [userId])

  // Filtrar instâncias baseado na busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredInstances(instances)
    } else {
      const filtered = instances.filter(
        (instance) =>
          instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instance.serverUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instance.ownerJid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instance.profileName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredInstances(filtered)
    }
  }, [searchTerm, instances])

  // Função para conectar instância diretamente com Evolution API
  const handleConnect = async (instance: any) => {
    try {
      // 1. Mostrar loading state
      setConnectingInstances(prev => new Set([...prev, instance.id]))





      if (!instance.serverUrl || !instance.apiKey) {
        throw new Error("Instância não possui configurações válidas (serverUrl ou apiKey)")
      }

      // 2. Conectar diretamente com Evolution API
      console.log("📡 [CONNECT] Conectando diretamente com Evolution API")
      const evolutionUrl = `${instance.serverUrl.replace(/\/$/, "")}/instance/connect/${instance.instanceName}`

      const response = await axios.get(evolutionUrl, {
        headers: {
          'apikey': instance.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })

      console.log("📋 [CONNECT] Resposta da Evolution API:", response.data)

      // 3. Verificar se recebeu QR code
      const qrData = response.data
      if (!qrData || (!qrData.code && !qrData.base64)) {
        throw new Error("QR Code não foi gerado pela Evolution API")
      }

      // 4. Atualizar status no backend para CONNECTING
      // try {
      //   await axios.put(`${API_BASE_URL}/evolution-instances/${instance.id}`, {
      //     connectionState: "CONNECTING"
      //   })
      // } catch (updateError) {
      //   console.warn("⚠️ [CONNECT] Falha ao atualizar status no backend:", updateError)
      // }

      // Preparar dados do QR Code
      let qrCodeBase64 = qrData.code || qrData.base64

      // Limpar e validar o base64
      if (qrCodeBase64) {
        // Remover prefixo data:image se já existir
        qrCodeBase64 = qrCodeBase64.replace(/^data:image\/[a-z]+;base64,/, '')

        // Remover caracteres inválidos como vírgulas extras, espaços, etc.
        qrCodeBase64 = qrCodeBase64.replace(/[^A-Za-z0-9+/=]/g, '')


        console.log("🔲 [CONNECT] QR Code Base64 limpo:", qrCodeBase64.substring(0, 50) + "...")

        // Verificar se não está vazio após limpeza
        if (qrCodeBase64.length < 10) {
          console.error("❌ [CONNECT] QR Code base64 muito pequeno ou inválido")
          throw new Error("QR Code inválido recebido da Evolution API")
        }
      } else {
        console.error("❌ [CONNECT] Nenhum QR Code base64 recebido")
        throw new Error("QR Code não foi gerado pela Evolution API")
      }

      setQrCodeData({
        base64: qrData.base64,
        instanceName: instance.instanceName,
        count: qrData.count || 1
      })
      setShowQrDialog(true)

      // Log do QR code para debug
      console.log("🔲 [CONNECT] QR Code Base64:", qrCodeBase64)
      console.log("📊 [CONNECT] QR Code Count:", qrData.count || 1)

      // 7. Atualizar lista de instâncias
      await loadInstances(true)

    } catch (error) {
      console.error('💥 [CONNECT] Erro ao conectar:', error)

      let errorMessage = "Ocorreu um erro inesperado ao conectar."

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Timeout: Servidor Evolution API não respondeu a tempo."
        } else if (error.response?.status === 404) {
          errorMessage = "Instância não encontrada na Evolution API."
        } else if (error.response?.status === 401) {
          errorMessage = "API Key inválida ou não autorizada."
        } else if (error.response?.data?.message) {
          errorMessage = `Evolution API: ${error.response.data.message}`
        } else {
          errorMessage = `Erro HTTP ${error.response?.status}: ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Erro ao conectar ❌",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setConnectingInstances(prev => {
        const newSet = new Set(prev)
        newSet.delete(instance.id)
        return newSet
      })
    }
  }

  // Função para desconectar instância
  const handleDisconnect = async (instanceId: string) => {
    if (confirm("Tem certeza que deseja desconectar esta instância?")) {
      try {
        const response = await axios.post(`${API_BASE_URL}/evolution-instances/${instanceId}/disconnect`)

        if (response.data.success) {
          toast({
            title: "Instância desconectada ✅",
            description: "A instância foi desconectada com sucesso.",
          })
          await loadInstances(true)
        } else {
          toast({
            title: "Erro ao desconectar",
            description: response.data.message || "Não foi possível desconectar a instância.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error disconnecting instance:', error)
        toast({
          title: "Erro ao desconectar",
          description: "Ocorreu um erro inesperado.",
          variant: "destructive",
        })
      }
    }
  }

  // Função para deletar instância
  const handleDelete = async (instanceId: string, instanceName: string) => {
    if (confirm(`Tem certeza que deseja excluir a instância "${instanceName}"?`)) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/evolution-instances/${instanceId}`)

        if (response.data.success) {
          toast({
            title: "Instância excluída ✅",
            description: "A instância foi excluída com sucesso.",
          })
          await loadInstances(true)
        } else {
          toast({
            title: "Erro ao excluir",
            description: response.data.message || "Não foi possível excluir a instância.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting instance:', error)
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro inesperado.",
          variant: "destructive",
        })
      }
    }
  }

  // Função para criar nova instância
  const handleCreateInstance = () => {
    setEditingInstance(undefined)
    setShowForm(true)
  }

  // Função para editar instância
  const handleEditInstance = (instance: EvolutionInstance) => {
    setEditingInstance(instance)
    setShowForm(true)
  }

  // Função para lidar com sucesso do formulário
  const handleFormSuccess = async () => {
    setShowForm(false)
    await loadInstances(true)

    toast({
      title: editingInstance ? "Instância atualizada" : "Instância criada",
      description: editingInstance
        ? "A instância foi atualizada com sucesso."
        : "A instância foi criada com sucesso.",
    })
  }

  // Função para atualizar a lista
  const handleRefresh = () => {
    loadInstances(true)
  }

  // Obter cor do status
  const getStatusColor = (connectionState: string) => {
    switch (connectionState) {
      case "CONNECTED":
        return "bg-green-500"
      case "CONNECTING":
        return "bg-yellow-500"
      case "DISCONNECTED":
        return "bg-gray-400"
      case "ERROR":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  // Obter texto do status
  const getStatusText = (connectionState: string) => {
    switch (connectionState) {
      case "CONNECTED":
        return "Conectado"
      case "CONNECTING":
        return "Conectando"
      case "DISCONNECTED":
        return "Desconectado"
      case "ERROR":
        return "Erro"
      default:
        return "Desconhecido"
    }
  }

  // Obter ícone do status
  const getStatusIcon = (connectionState: string) => {
    switch (connectionState) {
      case "CONNECTED":
        return <Wifi className="h-4 w-4" />
      case "CONNECTING":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "DISCONNECTED":
        return <WifiOff className="h-4 w-4" />
      case "ERROR":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <WifiOff className="h-4 w-4" />
    }
  }

  // Estado de carregamento inicial
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando instâncias...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-balance">Lista de Instâncias</h2>
            <p className="text-muted-foreground text-pretty">
              Gerencie suas instâncias do Evolution API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleCreateInstance} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Instância
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInstances}</div>
                <p className="text-xs text-muted-foreground">instâncias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
                <Wifi className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.connectedInstances}</div>
                <p className="text-xs text-muted-foreground">online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Desconectadas</CardTitle>
                <WifiOff className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.disconnectedInstances}</div>
                <p className="text-xs text-muted-foreground">offline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.errorInstances}</div>
                <p className="text-xs text-muted-foreground">problemas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar instâncias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredInstances.length} de {instances.length} instâncias
          </div>
        </div>

        {/* Instances List */}
        {filteredInstances.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma instância encontrada</h3>
            <p className="text-muted-foreground mb-4 text-pretty">
              {searchTerm
                ? "Tente ajustar sua busca ou criar uma nova instância"
                : instances.length === 0
                  ? "Comece criando sua primeira instância do Evolution API"
                  : "Nenhuma instância corresponde à sua busca"
              }
            </p>
            <Button onClick={handleCreateInstance}>
              {instances.length === 0 ? "Criar Primeira Instância" : "Criar Nova Instância"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstances.map((instance) => (
              <Card key={instance.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-balance">{instance.instanceName}</CardTitle>
                      <CardDescription className="text-pretty">
                        {instance.ownerJid || "Não conectado"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.connectionState)}`} />
                      {getStatusText(instance.connectionState)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Servidor Evolution:</p>
                    <p className="text-xs text-muted-foreground truncate">{instance.serverUrl}</p>
                  </div>

                  {instance.profileName && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Perfil:</p>
                      <div className="flex items-center gap-2">
                        {instance.profilePictureUrl && (
                          <img
                            src={instance.profilePictureUrl}
                            alt={instance.profileName}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">{instance.profileName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {instance.connectionState === "CONNECTED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(instance.id)}
                        className="flex items-center gap-1"
                      >
                        <PowerOff className="h-3 w-3" />
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(instance)}
                        disabled={connectingInstances.has(instance.id)}
                        className="flex items-center gap-1"
                      >
                        {connectingInstances.has(instance.id) ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Conectando...
                          </>
                        ) : (
                          <>
                            <Power className="h-3 w-3" />
                            Conectar
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInstance(instance)}
                      className="flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(instance.id, instance.instanceName)}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refresh indicator */}
        {refreshing && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Atualizando...</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie este QR Code com seu WhatsApp para conectar a instância "{qrCodeData?.instanceName}"
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeData?.base64 ? (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img
                  src={qrCodeData.base64.startsWith('data:')
                    ? qrCodeData.base64
                    : `data:image/png;base64,${qrCodeData.base64}`}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    console.error('❌ [QR] Erro ao carregar imagem QR Code')
                    const target = e.target as HTMLImageElement
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-64 h-64 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded">
                          <div class="text-center text-gray-500">
                            <p class="text-sm font-medium">QR Code não pôde ser exibido</p>
                            <p class="text-xs mt-1">Tente renovar o código</p>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded">
                <div className="text-center text-gray-500">
                  <p className="text-sm font-medium">Carregando QR Code...</p>
                </div>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Tentativa #{qrCodeData?.count || 1}
              </p>
              <p className="text-xs text-muted-foreground">
                1. Abra o WhatsApp no seu telefone
              </p>
              <p className="text-xs text-muted-foreground">
                2. Vá em Menu ou Configurações e selecione "Aparelhos conectados"
              </p>
              <p className="text-xs text-muted-foreground">
                3. Toque em "Conectar um aparelho" e aponte a câmera para este código
              </p>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleConnect(instances.find(i => i.instanceName === qrCodeData?.instanceName))}
                className="flex-1"
                disabled={connectingInstances.has(instances.find(i => i.instanceName === qrCodeData?.instanceName)?.id || '')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Renovar QR Code
              </Button>
              <Button
                onClick={() => setShowQrDialog(false)}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evolution Instance Form */}
      <EvolutionInstanceForm
        instance={editingInstance}
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}