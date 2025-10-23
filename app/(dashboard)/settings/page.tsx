"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Users, ShieldAlert } from "lucide-react"
import { Save, RefreshCw, Building2 } from "lucide-react"
import { systemConfigService, type SystemConfig, type SystemConfigUpdate } from "@/lib/system-config-api"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoadingSystem, setIsLoadingSystem] = useState(false)
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [pendingImages, setPendingImages] = useState<{ [key: string]: { file: File, preview: string } | null }>({
    logoUrl: null,
    logoUrlDark: null,
    faviconUrl: null
  })

  // Verificar permissão de admin
  useEffect(() => {
    if (isLoaded && user) {
      const isAdmin = user.publicMetadata?.is_admin === true
      if (!isAdmin) {
        toast.error("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    loadSystemConfig()
  }, [])

  const loadSystemConfig = async () => {
    try {
      const response = await systemConfigService.getSystemConfig()
      if (response.success && response.data) {
        setSystemConfig(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error)
      toast.error('Erro ao carregar configurações do sistema')
    }
  }


  const handleSystemConfigSave = async () => {
    if (!systemConfig) return

    setIsLoadingSystem(true)
    try {
      // Primeiro fazer upload das imagens pendentes
      const updatedConfig = { ...systemConfig }

      for (const [type, imageData] of Object.entries(pendingImages)) {
        if (imageData) {
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(imageData.file)
          })

          const base64 = await base64Promise

          const uploadResponse = await systemConfigService.uploadFile({
            type: type as 'logoUrl' | 'logoUrlDark' | 'faviconUrl',
            base64,
            filename: imageData.file.name
          })

          if (uploadResponse.success && uploadResponse.data) {
            updatedConfig[type as keyof SystemConfig] = uploadResponse.data[type] as any
          }
        }
      }

      // Atualizar configurações do sistema
      const updateData: SystemConfigUpdate = {
        systemName: updatedConfig.systemName,
        systemTitle: updatedConfig.systemTitle,
        systemDescription: updatedConfig.systemDescription,
        seoTitle: updatedConfig.seoTitle,
        seoDescription: updatedConfig.seoDescription,
        seoKeywords: updatedConfig.seoKeywords,
        logoUrl: updatedConfig.logoUrl,
        logoUrlDark: updatedConfig.logoUrlDark,
        faviconUrl: updatedConfig.faviconUrl,
        primaryColor: updatedConfig.primaryColor,
        secondaryColor: updatedConfig.secondaryColor,
        contactEmail: updatedConfig.contactEmail,
        supportUrl: updatedConfig.supportUrl,
        websiteUrl: updatedConfig.websiteUrl,
        privacyPolicyUrl: updatedConfig.privacyPolicyUrl,
        termsOfServiceUrl: updatedConfig.termsOfServiceUrl,
        facebookUrl: updatedConfig.facebookUrl,
        twitterUrl: updatedConfig.twitterUrl,
        linkedinUrl: updatedConfig.linkedinUrl,
        instagramUrl: updatedConfig.instagramUrl,
        maintenanceMode: updatedConfig.maintenanceMode,
        allowRegistration: updatedConfig.allowRegistration,
        version: updatedConfig.version,
      }

      const response = await systemConfigService.updateSystemConfig(updateData)

      if (response.success) {
        toast.success('Configurações do sistema salvas com sucesso!')
        // Limpar imagens pendentes
        setPendingImages({
          logoUrl: null,
          logoUrlDark: null,
          faviconUrl: null
        })
        loadSystemConfig() // Recarregar dados
      } else {
        toast.error(response.message || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error)
      toast.error('Erro ao salvar configurações do sistema')
    } finally {
      setIsLoadingSystem(false)
    }
  }

  const updateSystemConfig = useCallback((field: keyof SystemConfig, value: any) => {
    setSystemConfig(prev => prev ? { ...prev, [field]: value } : null)
  }, [])

  const handleImageSelect = useCallback((type: 'logoUrl' | 'logoUrlDark' | 'faviconUrl', file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onloadend = () => {
      setPendingImages(prev => ({
        ...prev,
        [type]: {
          file,
          preview: reader.result as string
        }
      }))
      toast.success('Imagem selecionada. Clique em "Salvar Sistema" para enviar.')
    }
    reader.readAsDataURL(file)
  }, [])

  // Memoizar o componente ImageUploadField para evitar re-renderizações
  const ImageUploadField = useMemo(() => ({
    type,
    label,
    currentValue
  }: {
    type: 'logoUrl' | 'logoUrlDark' | 'faviconUrl'
    label: string
    currentValue?: string
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pendingImage = pendingImages[type]
    const displayImage = pendingImage?.preview || currentValue

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleImageSelect(type, file)
      }
    }

    const removeImage = () => {
      if (pendingImage) {
        // Remover imagem pendente
        setPendingImages(prev => ({ ...prev, [type]: null }))
        toast.success('Imagem removida')
      } else {
        // Remover URL existente
        updateSystemConfig(type, '')
      }
    }

    const replaceImage = () => {
      fileInputRef.current?.click()
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="space-y-2">
          {/* Image Preview */}
          {displayImage && (
            <div className="relative w-20 h-20 border rounded-lg overflow-hidden bg-muted">
              <img
                src={displayImage}
                alt={label}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {/* Overlay com botões */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={replaceImage}
                  className="bg-primary text-primary-foreground rounded p-1 text-xs hover:bg-primary/80"
                  title="Trocar imagem"
                >
                  <Upload className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="bg-destructive text-destructive-foreground rounded p-1 text-xs hover:bg-destructive/80"
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {/* Indicador de imagem pendente */}
              {pendingImage && (
                <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                  Novo
                </div>
              )}
            </div>
          )}

          {/* Upload Button quando não há imagem */}
          {!displayImage && (
            <div
              className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}

          {/* URL Input e botão de upload */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Selecionar Imagem
            </Button>

            <Input
              value={currentValue || ''}
              onChange={(e) => updateSystemConfig(type, e.target.value)}
              placeholder="ou cole a URL da imagem"
              className="flex-1"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    )
  }, [pendingImages, updateSystemConfig, handleImageSelect])

  // Verificar se ainda está carregando
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Carregando...</p>
        </div>
      </div>
    )
  }

  // Verificar se o usuário é admin
  const isAdmin = user?.publicMetadata?.is_admin === true
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página. Apenas administradores podem acessar as configurações do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema e preferências da empresa</p>
        </div>
        <Button
          onClick={() => window.location.href = '/settings/users'}
          variant="outline"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Gerenciar Usuários
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Configurações do Sistema</CardTitle>
              </div>
              <Button
                onClick={handleSystemConfigSave}
                disabled={isLoadingSystem || !systemConfig}
                size="sm"
                className="gap-2"
              >
                {isLoadingSystem ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isLoadingSystem ? "Salvando..." : "Salvar Sistema"}
              </Button>
            </div>
            <CardDescription>Configurações básicas do sistema, branding, SEO e identidade visual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {systemConfig ? (
              <>
                {/* Identidade do Sistema */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">IDENTIDADE DO SISTEMA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="systemName">Nome do Sistema</Label>
                      <Input
                        id="systemName"
                        value={systemConfig.systemName}
                        onChange={(e) => updateSystemConfig('systemName', e.target.value)}
                        placeholder="AI Management System"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="systemTitle">Título do Sistema</Label>
                      <Input
                        id="systemTitle"
                        value={systemConfig.systemTitle}
                        onChange={(e) => updateSystemConfig('systemTitle', e.target.value)}
                        placeholder="AI Management Platform"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemDescription">Descrição do Sistema</Label>
                    <Textarea
                      id="systemDescription"
                      value={systemConfig.systemDescription || ''}
                      onChange={(e) => updateSystemConfig('systemDescription', e.target.value)}
                      placeholder="Descrição completa do sistema..."
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* SEO */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">SEO</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seoTitle">Título SEO</Label>
                      <Input
                        id="seoTitle"
                        value={systemConfig.seoTitle || ''}
                        onChange={(e) => updateSystemConfig('seoTitle', e.target.value)}
                        placeholder="Título para motores de busca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seoKeywords">Palavras-chave SEO</Label>
                      <Input
                        id="seoKeywords"
                        value={systemConfig.seoKeywords || ''}
                        onChange={(e) => updateSystemConfig('seoKeywords', e.target.value)}
                        placeholder="ia, automacao, chatbot"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">Descrição SEO</Label>
                    <Textarea
                      id="seoDescription"
                      value={systemConfig.seoDescription || ''}
                      onChange={(e) => updateSystemConfig('seoDescription', e.target.value)}
                      placeholder="Descrição para motores de busca..."
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Identidade Visual */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">IDENTIDADE VISUAL</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ImageUploadField
                      type="logoUrl"
                      label="Logo do Sistema"
                      currentValue={systemConfig.logoUrl || undefined}
                    />
                    <ImageUploadField
                      type="logoUrlDark"
                      label="Logo (Modo Escuro)"
                      currentValue={systemConfig.logoUrlDark || undefined}
                    />
                    <ImageUploadField
                      type="faviconUrl"
                      label="Favicon"
                      currentValue={systemConfig.faviconUrl || undefined}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={systemConfig.primaryColor || '#000000'}
                          onChange={(e) => updateSystemConfig('primaryColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={systemConfig.primaryColor || '#000000'}
                          onChange={(e) => updateSystemConfig('primaryColor', e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={systemConfig.secondaryColor || '#ffffff'}
                          onChange={(e) => updateSystemConfig('secondaryColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={systemConfig.secondaryColor || '#ffffff'}
                          onChange={(e) => updateSystemConfig('secondaryColor', e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contato e Links
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">CONTATO & LINKS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email de Contato</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={systemConfig.contactEmail || ''}
                        onChange={(e) => updateSystemConfig('contactEmail', e.target.value)}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Site Principal</Label>
                      <Input
                        id="websiteUrl"
                        type="url"
                        value={systemConfig.websiteUrl || ''}
                        onChange={(e) => updateSystemConfig('websiteUrl', e.target.value)}
                        placeholder="https://www.empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportUrl">URL de Suporte</Label>
                      <Input
                        id="supportUrl"
                        type="url"
                        value={systemConfig.supportUrl || ''}
                        onChange={(e) => updateSystemConfig('supportUrl', e.target.value)}
                        placeholder="https://suporte.empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="privacyPolicyUrl">Política de Privacidade</Label>
                      <Input
                        id="privacyPolicyUrl"
                        type="url"
                        value={systemConfig.privacyPolicyUrl || ''}
                        onChange={(e) => updateSystemConfig('privacyPolicyUrl', e.target.value)}
                        placeholder="https://empresa.com/privacidade"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">CONFIGURAÇÕES DO SISTEMA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="version">Versão</Label>
                      <Input
                        id="version"
                        value={systemConfig.version || ''}
                        onChange={(e) => updateSystemConfig('version', e.target.value)}
                        placeholder="1.0.0"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Modo de Manutenção</Label>
                        <p className="text-sm text-muted-foreground">Desabilitar acesso ao sistema</p>
                      </div>
                      <Switch
                        checked={systemConfig.maintenanceMode}
                        onCheckedChange={(checked) => updateSystemConfig('maintenanceMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Permitir Registro</Label>
                        <p className="text-sm text-muted-foreground">Novos usuários podem se registrar</p>
                      </div>
                      <Switch
                        checked={systemConfig.allowRegistration}
                        onCheckedChange={(checked) => updateSystemConfig('allowRegistration', checked)}
                      />
                    </div>
                  </div>
                </div> */}
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
